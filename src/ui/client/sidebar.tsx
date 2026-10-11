"use client";

import { ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { folderContains, getRootFolders, getSidebarNodes, isActiveUrl, projectUrlToRoot } from "../../tree.js";
import type { PageTreeFolder, PageTreeNode, PageTreePage } from "../../types.js";

export interface SidebarProps {
  tree: PageTreeNode[];
  /** Rendered above the tree, for example extra links on mobile. */
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Folders at this depth or shallower start open. Defaults to 0. */
  defaultOpenLevel?: number;
  /** Prefetch links with `next/link`. Defaults to true. */
  prefetch?: boolean;
  /** Icon name (as used in the tree) to element, resolved on the server. */
  icons?: Record<string, ReactNode>;
  /** Lists the root folders above the tree so readers can switch sections. Defaults to true; `DocsLayout` turns it off when the header nav already links to them. */
  showRoots?: boolean;
}

interface TreeContext {
  pathname: string;
  defaultOpenLevel: number;
  prefetch: boolean;
  icons: Record<string, ReactNode>;
}

function NodeIcon({ name, icons }: { name: string | undefined; icons: Record<string, ReactNode> }) {
  const icon = name ? icons[name] : undefined;
  if (!icon) return null;
  return <span className="pd-sidebar-icon">{icon}</span>;
}

function PageItem({ node, ctx }: { node: PageTreePage; ctx: TreeContext }) {
  if (node.external) {
    return (
      <li>
        <a href={node.url} className="pd-sidebar-item" target="_blank" rel="noreferrer noopener">
          <NodeIcon name={node.icon} icons={ctx.icons} />
          <span className="pd-sidebar-item-text">{node.name}</span>
          <ExternalLink size={12} className="pd-sidebar-external" aria-hidden />
        </a>
      </li>
    );
  }
  const active = isActiveUrl(ctx.pathname, node.url);
  return (
    <li>
      <Link
        href={node.url}
        prefetch={ctx.prefetch ? undefined : false}
        className="pd-sidebar-item"
        data-active={active ? "" : undefined}
        aria-current={active ? "page" : undefined}
      >
        <NodeIcon name={node.icon} icons={ctx.icons} />
        <span className="pd-sidebar-item-text">{node.name}</span>
      </Link>
    </li>
  );
}

function Folder({ node, ctx, depth }: { node: PageTreeFolder; ctx: TreeContext; depth: number }) {
  const active = folderContains(node, ctx.pathname);
  const collapsible = node.collapsible !== false;
  const [open, setOpen] = useState(() => (node.defaultOpen ?? depth <= ctx.defaultOpenLevel) || active);

  // Navigating into a folder opens it even when the user closed it earlier.
  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  const expanded = !collapsible || open;
  const current = node.url !== undefined && isActiveUrl(ctx.pathname, node.url);
  const iconName = node.icon ?? node.index?.icon;
  const labelContent = (
    <>
      <NodeIcon name={iconName} icons={ctx.icons} />
      <span className="pd-sidebar-item-text">{node.name}</span>
    </>
  );
  const label = node.url ? (
    <Link
      href={node.url}
      prefetch={ctx.prefetch ? undefined : false}
      className="pd-sidebar-folder-label"
      title={node.description}
      data-active={current ? "" : undefined}
      aria-current={current ? "page" : undefined}
    >
      {labelContent}
    </Link>
  ) : collapsible ? (
    <button type="button" className="pd-sidebar-folder-label" title={node.description} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
      {labelContent}
    </button>
  ) : (
    <span className="pd-sidebar-folder-label" title={node.description}>{labelContent}</span>
  );

  return (
    <li className="pd-sidebar-folder" data-open={expanded ? "" : undefined} data-depth={depth}>
      <div className="pd-sidebar-item pd-sidebar-folder-row" data-active={current ? "" : undefined}>
        {label}
        {collapsible ? (
          <button
            type="button"
            className="pd-sidebar-folder-toggle"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? `Collapse ${node.name}` : `Expand ${node.name}`}
          >
            <ChevronRight size={14} className="pd-sidebar-chevron" aria-hidden />
          </button>
        ) : null}
      </div>
      <div className="pd-sidebar-collapse" data-open={expanded ? "" : undefined}>
        <div className="pd-sidebar-collapse-inner" inert={expanded ? undefined : true}>
          <Tree nodes={node.children} ctx={ctx} depth={depth + 1} />
        </div>
      </div>
    </li>
  );
}

function Tree({ nodes, ctx, depth }: { nodes: PageTreeNode[]; ctx: TreeContext; depth: number }) {
  return (
    <ul className="pd-sidebar-list" data-depth={depth}>
      {nodes.map((node) => {
        if (node.type === "separator") {
          return (
            <li key={node.$id} className="pd-sidebar-separator">
              <NodeIcon name={node.icon} icons={ctx.icons} />
              <span className="pd-sidebar-item-text">{node.name}</span>
            </li>
          );
        }
        if (node.type === "folder") return <Folder key={node.$id} node={node} ctx={ctx} depth={depth} />;
        return <PageItem key={node.$id} node={node} ctx={ctx} />;
      })}
    </ul>
  );
}

function RootSwitcher({ tree, ctx }: { tree: PageTreeNode[]; ctx: TreeContext }) {
  const roots = getRootFolders(tree);
  if (roots.length === 0) return null;
  return (
    <div className="pd-sidebar-roots" aria-label="Documentation sections">
      {roots.map((root) => {
        const href = projectUrlToRoot(tree, ctx.pathname, root);
        const active = folderContains(root, ctx.pathname);
        if (!href) return null;
        return (
          <Link
            key={root.$id}
            href={href}
            prefetch={ctx.prefetch ? undefined : false}
            className="pd-sidebar-root"
            data-active={active ? "" : undefined}
            aria-current={active ? "page" : undefined}
          >
            <NodeIcon name={root.icon ?? root.index?.icon} icons={ctx.icons} />
            <span className="pd-sidebar-item-text">{root.name}</span>
          </Link>
        );
      })}
    </div>
  );
}

const EMPTY_ICONS: Record<string, ReactNode> = {};

export function Sidebar({ tree, header, footer, className, defaultOpenLevel = 0, prefetch = true, icons = EMPTY_ICONS, showRoots = true }: SidebarProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const ctx: TreeContext = { pathname, defaultOpenLevel, prefetch, icons };
  const nodes = getSidebarNodes(tree, pathname);

  // Keep the active item in view inside the sidebar without scrolling the page.
  useEffect(() => {
    const nav = navRef.current;
    const item = nav?.querySelector<HTMLElement>('.pd-sidebar-item[data-active], .pd-sidebar-folder-label[data-active]');
    if (!nav || !item) return;
    const navRect = nav.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const top = itemRect.top - navRect.top + nav.scrollTop;
    const bottom = top + itemRect.height;
    if (top < nav.scrollTop) nav.scrollTop = top;
    else if (bottom > nav.scrollTop + nav.clientHeight) nav.scrollTop = bottom - nav.clientHeight;
  }, [pathname]);

  return (
    <nav ref={navRef} className={["pd-sidebar", className].filter(Boolean).join(" ")} aria-label="Documentation">
      {header}
      {showRoots ? <RootSwitcher tree={tree} ctx={ctx} /> : null}
      <Tree nodes={nodes} ctx={ctx} depth={0} />
      {footer}
    </nav>
  );
}
