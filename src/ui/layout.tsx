import type { ReactNode } from "react";
import type { DocsConfig, PageTreeNode, UiLabels } from "../types.js";
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
  /** UI strings for the current locale, see `resolveLabels`. Client components read them from `RootProvider`; pass them here too for the server-rendered parts. */
  labels?: Partial<UiLabels>;
}

/** Header + sidebar + main column. Place it in the route layout that wraps the docs pages. */
export function DocsLayout({ tree, config, children, sidebarFooter, sidebarBanner, className, headerStart, headerEnd, labels }: DocsLayoutProps) {
  // Icon names are resolved once here so both sidebars (desktop and drawer) share the elements.
  const icons = collectTreeIcons(tree);
  // Header nav tabs already switch between sections, so the sidebar's own root list would duplicate them.
  const showRoots = (config.nav?.links?.length ?? 0) === 0;
  return (
    <div className={["pd-layout", className].filter(Boolean).join(" ")}>
      <Header config={config} tree={tree} icons={icons} start={headerStart} end={headerEnd} sidebarBanner={sidebarBanner} labels={labels} />
      <div className="pd-layout-body">
        <aside className="pd-sidebar-column">
          <Sidebar
            tree={tree}
            icons={icons}
            header={sidebarBanner}
            defaultOpenLevel={config.sidebar?.defaultOpenLevel}
            prefetch={config.sidebar?.prefetch}
            showRoots={showRoots}
            footer={sidebarFooter}
          />
        </aside>
        <main className="pd-main">{children}</main>
      </div>
    </div>
  );
}
