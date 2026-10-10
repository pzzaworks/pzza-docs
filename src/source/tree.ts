import path from "node:path";
import type { PageData, PageTreeFolder, PageTreeNode, PageTreePage } from "../types.js";
import { isRouteGroup, splitLocale, titleFromName, type ScannedDir } from "./files.js";

const REST = "...";
const REST_REVERSED = "z...a";
const SEPARATOR = /^---(?:\[([^\]]*)\])?(.*)---$/;
const LINK = /^(external:)?(?:\[([^\]]*)\])?\[([^\]]*)\]\(([^)]*)\)$/;

function isIndex(page: PageData, locales: readonly string[]): boolean {
  return baseName(page, locales) === "index";
}

/** File name without extension and locale suffix. */
function baseName(page: PageData, locales: readonly string[]): string {
  const stem = path.posix.basename(page.file).replace(/\.(mdx|md)$/i, "");
  return splitLocale(stem, locales).base;
}

function byOrderThenName(a: { order?: number; name: string }, b: { order?: number; name: string }): number {
  const ao = a.order ?? Number.POSITIVE_INFINITY;
  const bo = b.order ?? Number.POSITIVE_INFINITY;
  if (ao !== bo) return ao - bo;
  return a.name.localeCompare(b.name);
}

function pageNode(page: PageData): PageTreePage {
  return {
    type: "page",
    $id: page.file.replace(/\.(mdx|md)$/i, ""),
    name: page.title,
    url: page.url,
    icon: page.icon,
    description: page.description,
  };
}

function linkNode(match: RegExpExecArray, id: string): PageTreePage {
  const [, externalPrefix, icon, text, url] = match;
  const href = url ?? "";
  return {
    type: "page",
    $id: id,
    name: text ?? href,
    url: href,
    icon: icon || undefined,
    external: Boolean(externalPrefix) || /^https?:\/\//.test(href),
  };
}

interface Candidate {
  name: string;
  order?: number;
  node: PageTreeNode;
}

/**
 * Builds the sidebar tree for one directory. Ordering follows `meta.json#pages`
 * when present (see `MetaFile.pages` for the grammar); otherwise the index page
 * comes first, then pages and folders by `order` and name.
 */
export function buildFolder(dir: ScannedDir, locales: readonly string[]): PageTreeFolder {
  const meta = dir.meta;
  const indexPage = dir.pages.find((p) => isIndex(p, locales));
  const others = dir.pages.filter((p) => !isIndex(p, locales));
  const dirName = path.posix.basename(dir.dir);
  const idBase = dir.dir || "root";

  const folders = new Map<string, { scanned: ScannedDir; node: PageTreeFolder }>();
  for (const sub of dir.dirs) {
    folders.set(path.posix.basename(sub.dir), { scanned: sub, node: buildFolder(sub, locales) });
  }
  const pages = new Map<string, PageData>();
  for (const page of others) pages.set(baseName(page, locales), page);

  const lookup = (name: string): PageTreeNode | undefined => {
    if (name === "index") return indexPage ? pageNode(indexPage) : undefined;
    const page = pages.get(name);
    if (page) return pageNode(page);
    return folders.get(name)?.node;
  };

  const candidates = (): Candidate[] => {
    const items: Candidate[] = [];
    for (const [name, page] of pages) items.push({ name, order: page.order, node: pageNode(page) });
    for (const [name, folder] of folders) {
      const subIndex = folder.scanned.pages.find((p) => isIndex(p, locales));
      items.push({ name, order: subIndex?.order, node: folder.node });
    }
    return items;
  };

  let children: PageTreeNode[];
  const listed = meta?.pages;
  if (listed) {
    const consumed = new Set<string>();
    for (const entry of listed) {
      if (entry.startsWith("!")) consumed.add(entry.slice(1));
      else if (entry.startsWith("...") && entry !== REST) consumed.add(entry.slice(3));
      else if (entry !== REST && entry !== REST_REVERSED && !SEPARATOR.test(entry) && !LINK.test(entry)) consumed.add(entry);
    }

    children = [];
    listed.forEach((entry, position) => {
      if (entry.startsWith("!")) return;

      const separator = SEPARATOR.exec(entry);
      if (separator) {
        children.push({
          type: "separator",
          $id: `${idBase}#separator-${position}`,
          name: (separator[2] ?? "").trim(),
          icon: separator[1] || undefined,
        });
        return;
      }

      if (entry === REST || entry === REST_REVERSED) {
        const rest = candidates()
          .filter((c) => !consumed.has(c.name))
          .sort(byOrderThenName);
        if (entry === REST_REVERSED) rest.reverse();
        children.push(...rest.map((c) => c.node));
        return;
      }

      if (entry.startsWith("...")) {
        const hoisted = folders.get(entry.slice(3));
        if (hoisted) children.push(...hoisted.node.children);
        return;
      }

      const link = LINK.exec(entry);
      if (link) {
        children.push(linkNode(link, `${idBase}#link-${position}`));
        return;
      }

      const node = lookup(entry);
      if (node) children.push(node);
    });
  } else {
    const rest = candidates().sort(byOrderThenName).map((c) => c.node);
    children = indexPage ? [pageNode(indexPage), ...rest] : rest;
  }

  let index: PageTreePage | undefined = indexPage ? pageNode(indexPage) : undefined;
  if (meta?.pagesIndex) {
    const link = LINK.exec(meta.pagesIndex);
    const resolved = link ? linkNode(link, `${idBase}#index-link`) : lookup(meta.pagesIndex);
    if (resolved?.type === "page") index = resolved;
  }

  const fallbackName = isRouteGroup(dirName) ? titleFromName(dirName.slice(1, -1)) : titleFromName(dirName);
  return {
    type: "folder",
    $id: idBase,
    name: meta?.title ?? indexPage?.title ?? fallbackName,
    index,
    url: index?.url,
    icon: meta?.icon ?? indexPage?.icon,
    description: meta?.description ?? indexPage?.description,
    collapsible: meta?.collapsible,
    defaultOpen: meta?.defaultOpen,
    root: meta?.root,
    children,
  };
}

export function buildTree(root: ScannedDir, locales: readonly string[]): PageTreeNode[] {
  return buildFolder(root, locales).children;
}

/** Throws when two different files resolve to the same URL (for example across route groups). */
export function assertUniqueUrls(pages: PageData[]): void {
  const byUrl = new Map<string, string>();
  for (const page of pages) {
    const existing = byUrl.get(page.url);
    if (existing && existing !== page.file) {
      throw new Error(`Duplicate page URL "${page.url}": both "${existing}" and "${page.file}" resolve to it. Rename one of the files.`);
    }
    byUrl.set(page.url, page.file);
  }
}
