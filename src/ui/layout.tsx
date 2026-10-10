import type { ReactNode } from "react";
import type { DocsConfig, PageTreeNode } from "../types.js";
import { Sidebar } from "./client/sidebar.js";
import { Header } from "./header.js";
import { collectTreeIcons } from "./icons.js";

export interface DocsLayoutProps {
  tree: PageTreeNode[];
  config: DocsConfig;
  children: ReactNode;
  /** Rendered at the bottom of the desktop sidebar. */
  sidebarFooter?: ReactNode;
  /** Rendered above the tree in both the desktop sidebar and the mobile drawer. */
  sidebarBanner?: ReactNode;
  className?: string;
  /** Custom header content, see `Header` `start` and `end`. */
  headerStart?: ReactNode;
  headerEnd?: ReactNode;
}

/** Header + sidebar + main column. Place it in the route layout that wraps the docs pages. */
export function DocsLayout({ tree, config, children, sidebarFooter, sidebarBanner, className, headerStart, headerEnd }: DocsLayoutProps) {
  // Icon names are resolved once here so both sidebars (desktop and drawer) share the elements.
  const icons = collectTreeIcons(tree);
  return (
    <div className={["pd-layout", className].filter(Boolean).join(" ")}>
      <Header config={config} tree={tree} icons={icons} start={headerStart} end={headerEnd} sidebarBanner={sidebarBanner} />
      <div className="pd-layout-body">
        <aside className="pd-sidebar-column">
          <Sidebar
            tree={tree}
            icons={icons}
            header={sidebarBanner}
            defaultOpenLevel={config.sidebar?.defaultOpenLevel}
            prefetch={config.sidebar?.prefetch}
            footer={sidebarFooter}
          />
        </aside>
        <main className="pd-main">{children}</main>
      </div>
    </div>
  );
}
