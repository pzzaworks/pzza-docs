import { createHash } from "node:crypto";
import type { Dirent } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type { LastModifiedSource, LocalePrefix, LocaleStrategy, MetaFile, PageData, PageFrontmatter } from "../types.js";
import { getGitLastModified } from "./git.js";

const PAGE_EXTENSIONS = new Set([".mdx", ".md"]);

export interface ScannedDir {
  /** Directory path relative to contentDir ("" for the root). */
  dir: string;
  meta?: MetaFile;
  pages: PageData[];
  dirs: ScannedDir[];
}

export interface ScanResult {
  root: ScannedDir;
  /** Changes whenever any file or directory under contentDir is added, removed or modified. */
  hash: string;
}

export interface LoadedFile {
  page: PageData;
  /** Markdown body with the frontmatter removed. */
  body: string;
}

interface CacheEntry<T> {
  mtimeMs: number;
  value: T;
}

/** Converts "getting-started" to "Getting Started". Used when a page has no title. */
export function titleFromName(name: string): string {
  return name
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Route groups are folders named `(group)`; they organise content without affecting URLs. */
export function isRouteGroup(segment: string): boolean {
  return segment.startsWith("(") && segment.endsWith(")");
}

/** Splits `name.de` into base name and locale when `de` is a known locale. */
export function splitLocale(stem: string, locales: readonly string[]): { base: string; locale?: string } {
  const dot = stem.lastIndexOf(".");
  if (dot === -1) return { base: stem };
  const suffix = stem.slice(dot + 1);
  if (!locales.includes(suffix)) return { base: stem };
  return { base: stem.slice(0, dot), locale: suffix };
}

export function slugFromFile(relativeFile: string, locales: readonly string[]): string[] {
  const noExt = relativeFile.replace(/\.(mdx|md)$/i, "");
  const segments = noExt.split(/[\\/]+/).filter((segment) => segment !== "" && !isRouteGroup(segment));
  const last = segments.pop();
  if (last !== undefined) {
    const { base } = splitLocale(last, locales);
    if (base !== "index") segments.push(base);
  }
  return segments;
}

export function urlFromSlug(baseUrl: string, slug: string[]): string {
  if (slug.length === 0) return baseUrl;
  return baseUrl === "/" ? `/${slug.join("/")}` : `${baseUrl}/${slug.join("/")}`;
}

function readFrontmatter(data: Record<string, unknown>, fallbackTitle: string): PageFrontmatter {
  const str = (key: string): string | undefined => (typeof data[key] === "string" ? (data[key] as string) : undefined);
  const title = str("title")?.trim() || fallbackTitle;
  return {
    title,
    description: str("description"),
    icon: str("icon"),
    full: typeof data["full"] === "boolean" ? data["full"] : undefined,
    order: typeof data["order"] === "number" ? data["order"] : undefined,
    tag: str("tag"),
  };
}

export interface FileStoreOptions {
  contentDir: string;
  baseUrl: string;
  locales: readonly string[];
  defaultLocale?: string;
  strategy: LocaleStrategy;
  prefix: LocalePrefix;
  lastModified: LastModifiedSource;
}

/** The page fields that depend on which locale is being served rather than on the file. */
interface FileIdentity {
  slug: string[];
  file: string;
  stem: string;
}

/**
 * Reads MDX files and meta.json with an mtime-keyed cache so repeated requests in
 * the same process do not hit the disk for unchanged files.
 */
export class FileStore {
  private readonly fileCache = new Map<string, CacheEntry<LoadedFile>>();
  private readonly metaCache = new Map<string, CacheEntry<MetaFile>>();
  readonly contentDir: string;
  private readonly baseUrl: string;
  private readonly locales: readonly string[];
  private readonly defaultLocale: string | undefined;
  private readonly strategy: LocaleStrategy;
  private readonly prefix: LocalePrefix;
  private readonly lastModifiedSource: LastModifiedSource;

  constructor(options: FileStoreOptions) {
    this.contentDir = options.contentDir;
    this.baseUrl = options.baseUrl;
    this.locales = options.locales;
    this.defaultLocale = options.defaultLocale;
    this.strategy = options.strategy;
    this.prefix = options.prefix;
    this.lastModifiedSource = options.lastModified;
    if (this.strategy === "directory" && !this.defaultLocale) {
      throw new Error('The "directory" locale strategy needs `defaultLocale`: it names the directory holding the source content.');
    }
    if (this.prefix === "always" && !this.defaultLocale) {
      throw new Error('`localePrefix: "always"` needs `defaultLocale` so the default locale can be prefixed too.');
    }
  }

  /** Content root for a locale: `contentDir/<locale>` with the directory strategy, `contentDir` otherwise. */
  private rootFor(locale: string | undefined): string {
    if (this.strategy !== "directory") return this.contentDir;
    return path.join(this.contentDir, locale ?? this.defaultLocale ?? "");
  }

  /** The URL prefix pages of a locale get: baseUrl, or `/<locale><baseUrl>` when the prefix setting asks for it. */
  private baseUrlFor(locale: string | undefined): string {
    const isDefault = locale === undefined;
    const name = locale ?? this.defaultLocale;
    const wantsPrefix = this.prefix === "always" || (this.prefix === "as-needed" && !isDefault);
    if (!wantsPrefix || !name) return this.baseUrl;
    return this.baseUrl === "/" ? `/${name}` : `/${name}${this.baseUrl}`;
  }

  /** Slug and relative paths of a file. With the directory strategy the first path segment is the locale directory, not part of the slug. */
  private identify(absolutePath: string): FileIdentity {
    const file = path.relative(this.contentDir, absolutePath).split(path.sep).join("/");
    const withinRoot = this.strategy === "directory" ? file.split("/").slice(1).join("/") : file;
    const stem = path.posix.basename(file).replace(/\.(mdx|md)$/i, "");
    return { slug: slugFromFile(withinRoot, this.locales), file, stem };
  }

  /**
   * Reads and caches one file. The page carries the URL of the default locale;
   * `scan` re-labels it for the locale actually being served.
   */
  async loadFile(absolutePath: string): Promise<LoadedFile> {
    const info = await stat(absolutePath);
    const cached = this.fileCache.get(absolutePath);
    if (cached && cached.mtimeMs === info.mtimeMs) return cached.value;

    const raw = await readFile(absolutePath, "utf8");
    const parsed = matter(raw);
    const { slug, file, stem } = this.identify(absolutePath);
    const { base, locale } = splitLocale(stem, this.locales);
    const fallback = titleFromName(base === "index" ? (slug[slug.length - 1] ?? "index") : base);
    const page: PageData = {
      ...readFrontmatter(parsed.data, fallback),
      slug,
      url: urlFromSlug(this.baseUrlFor(undefined), slug),
      path: absolutePath,
      file,
      locale,
      frontmatter: parsed.data,
      lastModified: await this.resolveLastModified(absolutePath, info.mtimeMs, info.mtime),
    };
    const value: LoadedFile = { page, body: parsed.content };
    this.fileCache.set(absolutePath, { mtimeMs: info.mtimeMs, value });
    return value;
  }

  /** The page as served for a locale: URL under that locale's prefix and the locale recorded on it. */
  private localize(page: PageData, locale: string | undefined): PageData {
    const url = urlFromSlug(this.baseUrlFor(locale), page.slug);
    if (url === page.url && page.locale === locale) return page;
    return { ...page, url, locale: locale ?? page.locale };
  }

  private async resolveLastModified(file: string, mtimeMs: number, mtime: Date): Promise<Date> {
    if (this.lastModifiedSource === "git") return (await getGitLastModified(file, mtimeMs)) ?? mtime;
    return mtime;
  }

  private async loadMeta(absolutePath: string): Promise<MetaFile | undefined> {
    let info: Awaited<ReturnType<typeof stat>>;
    try {
      info = await stat(absolutePath);
    } catch {
      return undefined;
    }
    const cached = this.metaCache.get(absolutePath);
    if (cached && cached.mtimeMs === info.mtimeMs) return cached.value;
    const raw = await readFile(absolutePath, "utf8");
    const json: unknown = JSON.parse(raw);
    const meta = parseMeta(json, absolutePath);
    this.metaCache.set(absolutePath, { mtimeMs: info.mtimeMs, value: meta });
    return meta;
  }

  /**
   * Walks the content for one locale (`undefined` is the default locale).
   * Suffix strategy: `page.<locale>.mdx` replaces `page.mdx`, other locales'
   * files are skipped. Directory strategy: `contentDir/<locale>` is laid over
   * `contentDir/<defaultLocale>` file by file, so untranslated pages still
   * render in the source language.
   */
  async scan(locale?: string): Promise<ScanResult> {
    const hash = createHash("sha1");
    const root = this.strategy === "directory" ? await this.scanLocaleDirs("", locale, hash) : await this.scanDir("", locale, hash);
    return { root, hash: hash.digest("hex") };
  }

  private async scanDir(relativeDir: string, locale: string | undefined, hash: ReturnType<typeof createHash>): Promise<ScannedDir> {
    const absoluteDir = path.join(this.contentDir, relativeDir);
    const entries = await readdir(absoluteDir, { withFileTypes: true });
    const result: ScannedDir = { dir: relativeDir, pages: [], dirs: [] };
    const candidates = new Map<string, { default?: string; localized?: string }>();

    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;
      const relative = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
      const absolute = path.join(this.contentDir, relative);
      if (entry.isDirectory()) {
        hash.update(`d:${relative}\n`);
        result.dirs.push(await this.scanDir(relative, locale, hash));
        continue;
      }
      if (!entry.isFile()) continue;
      const info = await stat(absolute);
      hash.update(`f:${relative}:${info.mtimeMs}\n`);
      if (!PAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;

      const stem = entry.name.replace(/\.(mdx|md)$/i, "");
      const { base, locale: fileLocale } = splitLocale(stem, this.locales);
      const slot = candidates.get(base) ?? {};
      if (fileLocale === undefined) slot.default = absolute;
      else if (fileLocale === locale) slot.localized = absolute;
      candidates.set(base, slot);
    }

    for (const slot of candidates.values()) {
      const chosen = slot.localized ?? slot.default;
      if (chosen) result.pages.push(this.localize((await this.loadFile(chosen)).page, locale));
    }

    const localizedMeta = locale ? await this.loadMeta(path.join(absoluteDir, `meta.${locale}.json`)) : undefined;
    result.meta = localizedMeta ?? (await this.loadMeta(path.join(absoluteDir, "meta.json")));
    return result;
  }

  private async listDir(absoluteDir: string): Promise<Dirent[]> {
    try {
      return await readdir(absoluteDir, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }

  /** Directory strategy: the default locale's tree with the requested locale's files laid over it. */
  private async scanLocaleDirs(relativeDir: string, locale: string | undefined, hash: ReturnType<typeof createHash>): Promise<ScannedDir> {
    const defaultRoot = this.rootFor(undefined);
    const localeRoot = locale ? this.rootFor(locale) : undefined;
    const result: ScannedDir = { dir: relativeDir, pages: [], dirs: [] };
    const subdirs = new Set<string>();
    const files = new Map<string, string>();

    // The default locale is read first so a translated file of the same name replaces it.
    const layers = [{ root: defaultRoot, tag: "d" }, ...(localeRoot ? [{ root: localeRoot, tag: locale ?? "" }] : [])];
    for (const layer of layers) {
      const absoluteDir = path.join(layer.root, relativeDir);
      for (const entry of await this.listDir(absoluteDir)) {
        if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;
        const relative = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
        const absolute = path.join(absoluteDir, entry.name);
        if (entry.isDirectory()) {
          hash.update(`${layer.tag}:d:${relative}\n`);
          subdirs.add(entry.name);
          continue;
        }
        if (!entry.isFile()) continue;
        const info = await stat(absolute);
        hash.update(`${layer.tag}:f:${relative}:${info.mtimeMs}\n`);
        if (!PAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
        files.set(entry.name.replace(/\.(mdx|md)$/i, ""), absolute);
      }
    }

    for (const chosen of files.values()) {
      result.pages.push(this.localize((await this.loadFile(chosen)).page, locale));
    }
    for (const name of [...subdirs].sort()) {
      result.dirs.push(await this.scanLocaleDirs(relativeDir ? `${relativeDir}/${name}` : name, locale, hash));
    }

    const localizedMeta = localeRoot ? await this.loadMeta(path.join(localeRoot, relativeDir, "meta.json")) : undefined;
    result.meta = localizedMeta ?? (await this.loadMeta(path.join(defaultRoot, relativeDir, "meta.json")));
    return result;
  }
}

function parseMeta(json: unknown, file: string): MetaFile {
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    throw new Error(`Invalid meta.json at ${file}: expected an object`);
  }
  const record = json as Record<string, unknown>;
  const meta: MetaFile = {};
  if (typeof record["title"] === "string") meta.title = record["title"];
  if (typeof record["icon"] === "string") meta.icon = record["icon"];
  if (typeof record["description"] === "string") meta.description = record["description"];
  if (typeof record["collapsible"] === "boolean") meta.collapsible = record["collapsible"];
  if (typeof record["defaultOpen"] === "boolean") meta.defaultOpen = record["defaultOpen"];
  if (typeof record["root"] === "boolean" || typeof record["root"] === "string") meta.root = record["root"];
  if (typeof record["pagesIndex"] === "string") meta.pagesIndex = record["pagesIndex"];
  if (Array.isArray(record["pages"])) {
    meta.pages = record["pages"].filter((p): p is string => typeof p === "string");
  }
  return meta;
}
