import path from "node:path";
import type { MDXComponents } from "mdx/types";
import type { CompiledPage, Neighbours, PageData, PageSuggestion, PageTreeNode, ResolvedDocsConfig, SearchRecord } from "../types.js";
import { getBreadcrumbsFromTree, flattenTree } from "../tree.js";
import { resolveCodeThemes } from "./code/themes.js";
import { compileMdx } from "./compile.js";
import { FileStore, type ScanResult } from "./files.js";
import { toLlmsTxt, toMarkdown } from "./markdown.js";
import type { PageStructure } from "./rehype-structure.js";
import { suggestPages } from "./suggestions.js";
import { assertUniqueUrls, buildTree } from "./tree.js";

export interface SourceOptions {
  /** Extra MDX components merged over `defaultMdxComponents`. */
  components?: MDXComponents;
}

export interface Source {
  /** Every page with parsed frontmatter, in filesystem order. No MDX is compiled. */
  getPages(locale?: string): Promise<PageData[]>;
  /** Compiles and returns one page, or undefined when the slug has no file. */
  getPage(slug?: string[], locale?: string): Promise<CompiledPage | undefined>;
  getPageTree(locale?: string): Promise<PageTreeNode[]>;
  /** Flat record list for the search endpoint. Compiles every page; cached until any content file changes. */
  getSearchIndex(locale?: string): Promise<SearchRecord[]>;
  getNeighbours(slug?: string[], locale?: string): Promise<Neighbours>;
  /** Raw Markdown of a page with heading anchors appended as `[#id]`. */
  getMarkdown(slug?: string[], locale?: string): Promise<string | undefined>;
  /** `llms.txt`: index of every page with descriptions, organised by the tree. */
  getLlmsTxt(locale?: string): Promise<string>;
  /** `llms-full.txt`: every page's Markdown concatenated in tree order. */
  getLlmsFullTxt(locale?: string): Promise<string>;
  /** "Did you mean" candidates for an unknown path, for a not-found page. */
  getSuggestions(pathname: string, limit?: number, locale?: string): Promise<PageSuggestion[]>;
}

interface CompiledCacheEntry {
  mtimeMs: number;
  page: CompiledPage;
  structure: PageStructure;
}

interface DerivedCache<T> {
  hash: string;
  value: T;
}

const DEFAULT_LOCALE_KEY = "";
// Read once at module scope so bundlers see a single, static cwd lookup instead of one per request.
const WORKING_DIR = process.cwd();

export function createSourceWithComponents(config: ResolvedDocsConfig, components: MDXComponents): Source {
  const contentDir = path.isAbsolute(config.contentDir) ? config.contentDir : path.join(WORKING_DIR, config.contentDir);
  const store = new FileStore({ contentDir, baseUrl: config.baseUrl, locales: config.locales, lastModified: config.lastModified });
  const compiledCache = new Map<string, CompiledCacheEntry>();
  const codeThemes = resolveCodeThemes(config.theme);
  const treeCache = new Map<string, DerivedCache<PageTreeNode[]>>();
  const searchCache = new Map<string, DerivedCache<SearchRecord[]>>();

  const normalizeLocale = (locale?: string): string | undefined => {
    if (!locale || locale === config.defaultLocale) return undefined;
    return locale;
  };

  const scan = (locale?: string): Promise<ScanResult> => store.scan(normalizeLocale(locale));

  const collectPages = (result: ScanResult): PageData[] => {
    const out: PageData[] = [];
    const walk = (dir: ScanResult["root"]): void => {
      out.push(...dir.pages);
      dir.dirs.forEach(walk);
    };
    walk(result.root);
    assertUniqueUrls(out);
    return out;
  };

  const getPages = async (locale?: string): Promise<PageData[]> => collectPages(await scan(locale));

  const getPageTree = async (locale?: string): Promise<PageTreeNode[]> => {
    const result = await scan(locale);
    collectPages(result);
    const key = normalizeLocale(locale) ?? DEFAULT_LOCALE_KEY;
    const cached = treeCache.get(key);
    if (cached && cached.hash === result.hash) return cached.value;
    const tree = buildTree(result.root, config.locales);
    treeCache.set(key, { hash: result.hash, value: tree });
    return tree;
  };

  const compilePage = async (data: PageData): Promise<CompiledCacheEntry> => {
    const loaded = await store.loadFile(data.path);
    const mtimeMs = loaded.page.lastModified.getTime();
    const cached = compiledCache.get(data.path);
    if (cached && cached.mtimeMs === mtimeMs) return cached;

    const { toc, content, structure } = await compileMdx(loaded.body, loaded.page.path, components, { toc: config.toc, codeThemes, math: config.math });
    const entry: CompiledCacheEntry = { mtimeMs, page: { ...loaded.page, toc, content }, structure };
    compiledCache.set(data.path, entry);
    return entry;
  };

  const findPage = async (slug: string[] = [], locale?: string): Promise<PageData | undefined> => {
    const key = slug.join("/");
    const pages = await getPages(locale);
    return pages.find((p) => p.slug.join("/") === key);
  };

  const pagesInTreeOrder = async (locale?: string): Promise<PageData[]> => {
    const [pages, tree] = await Promise.all([getPages(locale), getPageTree(locale)]);
    const byUrl = new Map(pages.map((p) => [p.url, p]));
    const ordered: PageData[] = [];
    for (const link of flattenTree(tree)) {
      const page = byUrl.get(link.url);
      if (page) ordered.push(page);
    }
    // Pages hidden from the tree (not listed in meta.json) still get indexed, after the visible ones.
    for (const page of pages) if (!ordered.includes(page)) ordered.push(page);
    return ordered;
  };

  const buildSearchIndex = async (locale?: string): Promise<SearchRecord[]> => {
    const [pages, tree] = await Promise.all([pagesInTreeOrder(locale), getPageTree(locale)]);
    const records: SearchRecord[] = [];
    for (const data of pages) {
      const { page, structure } = await compilePage(data);
      const breadcrumbs = getBreadcrumbsFromTree(tree, page.url).slice(0, -1).map((c) => c.name);
      const base = { pageUrl: page.url, breadcrumbs, tag: page.tag };
      records.push({ ...base, type: "page", id: page.url, url: page.url, title: page.title, description: page.description });
      for (const heading of structure.headings) {
        records.push({ ...base, type: "heading", id: `${page.url}#${heading.id}`, url: `${page.url}#${heading.id}`, content: heading.content, pageTitle: page.title });
      }
      structure.contents.forEach((block, index) => {
        const hash = block.heading ? `#${block.heading}` : "";
        records.push({ ...base, type: "text", id: `${page.url}#text-${index}`, url: `${page.url}${hash}`, content: block.content, headingId: block.heading, pageTitle: page.title });
      });
    }
    return records;
  };

  const getMarkdownFor = async (data: PageData): Promise<string> => toMarkdown(data, (await store.loadFile(data.path)).body);

  return {
    getPages,
    async getPage(slug, locale) {
      const data = await findPage(slug, locale);
      return data ? (await compilePage(data)).page : undefined;
    },
    getPageTree,
    async getSearchIndex(locale) {
      const result = await scan(locale);
      const key = normalizeLocale(locale) ?? DEFAULT_LOCALE_KEY;
      const cached = searchCache.get(key);
      if (cached && cached.hash === result.hash) return cached.value;
      const records = await buildSearchIndex(locale);
      searchCache.set(key, { hash: result.hash, value: records });
      return records;
    },
    async getNeighbours(slug, locale) {
      const data = await findPage(slug, locale);
      if (!data) return {};
      // Link items from meta.json are not pages, so they never take part in prev/next.
      const pages = await pagesInTreeOrder(locale);
      const index = pages.findIndex((p) => p.url === data.url);
      const toLink = (page: PageData | undefined) => (page ? { name: page.title, url: page.url } : undefined);
      return { previous: toLink(pages[index - 1]), next: toLink(pages[index + 1]) };
    },
    async getMarkdown(slug, locale) {
      const data = await findPage(slug, locale);
      return data ? getMarkdownFor(data) : undefined;
    },
    async getLlmsTxt(locale) {
      const [pages, tree] = await Promise.all([getPages(locale), getPageTree(locale)]);
      const descriptions = new Map(pages.map((p) => [p.url, p.description]));
      return toLlmsTxt({
        title: config.title,
        description: config.description,
        tree,
        markdownPath: config.llm.markdownPath,
        siteUrl: config.siteUrl,
        include: (url) => descriptions.has(url),
        describe: (url) => descriptions.get(url),
      });
    },
    async getLlmsFullTxt(locale) {
      const pages = await pagesInTreeOrder(locale);
      const parts = await Promise.all(
        pages.map(async (page) => {
          const markdown = await getMarkdownFor(page);
          // Each section names its canonical page so the concatenated file stays navigable.
          return `<!-- ${config.siteUrl ?? ""}${page.url} -->\n${markdown}`;
        }),
      );
      return parts.join("\n---\n\n");
    },
    async getSuggestions(pathname, limit = 5, locale) {
      return suggestPages(await getPages(locale), pathname, limit);
    },
  };
}
