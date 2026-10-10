import type { BreadcrumbItem, Neighbours, PageLink, PageTreeFolder, PageTreeNode } from "./types.js";

/** Pages in reading order (folders contribute their index then children, separators and external links are skipped). */
export function flattenTree(tree: PageTreeNode[]): PageLink[] {
  const seen = new Set<string>();
  const out: PageLink[] = [];
  const push = (name: string, url: string): void => {
    if (seen.has(url)) return;
    seen.add(url);
    out.push({ name, url });
  };
  const walk = (nodes: PageTreeNode[]): void => {
    for (const node of nodes) {
      if (node.type === "page") {
        if (!node.external) push(node.name, node.url);
      } else if (node.type === "folder") {
        if (node.url && !node.index?.external) push(node.name, node.url);
        walk(node.children);
      }
    }
  };
  walk(tree);
  return out;
}

export function getNeighboursFromTree(tree: PageTreeNode[], url: string): Neighbours {
  const flat = flattenTree(tree);
  const index = flat.findIndex((p) => p.url === url);
  if (index === -1) return {};
  return { previous: flat[index - 1], next: flat[index + 1] };
}

/** Folder chain leading to `url`, ending with the page itself. */
export function getBreadcrumbsFromTree(tree: PageTreeNode[], url: string): BreadcrumbItem[] {
  const walk = (nodes: PageTreeNode[], trail: BreadcrumbItem[]): BreadcrumbItem[] | undefined => {
    for (const node of nodes) {
      if (node.type === "page" && node.url === url) {
        return [...trail, { name: node.name, url: node.url }];
      }
      if (node.type === "folder") {
        if (node.url === url) return [...trail, { name: node.name, url: node.url }];
        const found = walk(node.children, [...trail, { name: node.name, url: node.url }]);
        if (found) return found;
      }
    }
    return undefined;
  };
  return walk(tree, []) ?? [];
}

/** True when `url` is the page itself or, with `nested`, a page below it. */
export function isActiveUrl(pathname: string, url: string, nested = false): boolean {
  const current = pathname.replace(/\/+$/, "") || "/";
  const target = url.replace(/\/+$/, "") || "/";
  if (current === target) return true;
  return nested && target !== "/" && current.startsWith(`${target}/`);
}

/** True when the folder's index or any descendant matches the pathname. */
export function folderContains(folder: PageTreeFolder, pathname: string): boolean {
  if (folder.url && isActiveUrl(pathname, folder.url)) return true;
  return folder.children.some((child) => {
    if (child.type === "page") return !child.external && isActiveUrl(pathname, child.url);
    if (child.type === "folder") return folderContains(child, pathname);
    return false;
  });
}

/** Folders flagged `root`, searched at any depth, in tree order. */
export function getRootFolders(tree: PageTreeNode[]): PageTreeFolder[] {
  const roots: PageTreeFolder[] = [];
  const walk = (nodes: PageTreeNode[]): void => {
    for (const node of nodes) {
      if (node.type !== "folder") continue;
      if (node.root) roots.push(node);
      else walk(node.children);
    }
  };
  walk(tree);
  return roots;
}

/** The root folder owning the current pathname, when roots exist. */
export function getActiveRoot(tree: PageTreeNode[], pathname: string): PageTreeFolder | undefined {
  return getRootFolders(tree).find((root) => folderContains(root, pathname));
}

/**
 * Nodes to render in the sidebar: the active root's children when roots exist,
 * otherwise the whole tree minus other roots. Without a matching root the first
 * root is used so the sidebar is never empty.
 */
export function getSidebarNodes(tree: PageTreeNode[], pathname: string): PageTreeNode[] {
  const roots = getRootFolders(tree);
  if (roots.length === 0) return tree;
  const active = roots.find((root) => folderContains(root, pathname));
  if (active) return active.children;
  // Pages outside every root (for example the top-level index) show the top-level tree without root folders.
  const outside = tree.filter((node) => !(node.type === "folder" && node.root));
  if (outside.some((node) => (node.type === "page" && isActiveUrl(pathname, node.url)) || (node.type === "folder" && folderContains(node, pathname)))) {
    return outside;
  }
  return roots[0]?.children ?? tree;
}

/**
 * URL to visit when switching from the current root to `target`. Roots sharing
 * the same string `root` type keep the relative path when the target has the
 * same page; otherwise the target's index is used.
 */
export function projectUrlToRoot(tree: PageTreeNode[], pathname: string, target: PageTreeFolder): string | undefined {
  const current = getActiveRoot(tree, pathname);
  const fallback = target.url ?? flattenTree(target.children)[0]?.url;
  if (!current || current === target) return fallback;
  if (typeof current.root !== "string" || current.root !== target.root || !current.url || !target.url) return fallback;
  const currentBase = current.url.replace(/\/+$/, "");
  const targetBase = target.url.replace(/\/+$/, "");
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (!normalized.startsWith(`${currentBase}/`)) return fallback;
  const candidate = `${targetBase}${normalized.slice(currentBase.length)}`;
  const exists = flattenTree(target.children).some((page) => page.url === candidate);
  return exists ? candidate : fallback;
}
