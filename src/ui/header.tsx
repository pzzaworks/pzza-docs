import Link from "next/link";
import { isValidElement, type ReactNode } from "react";
import { DEFAULT_LABELS } from "../labels.js";
import type { DocsConfig, HeaderTransparentMode, ImageLogo, PageTreeNode, UiLabels } from "../types.js";
import { GitHubIcon } from "./client/brand-icons.js";
import { HeaderShell } from "./client/header-shell.js";
import { MobileNav } from "./client/mobile-nav.js";
import { NavTabs } from "./client/nav-tabs.js";
import { SearchTrigger } from "./client/search-trigger.js";
import { Sidebar } from "./client/sidebar.js";
import { ThemeToggle } from "./client/theme-toggle.js";
import { collectTreeIcons } from "./icons.js";

export interface HeaderProps {
  config: DocsConfig;
  /** Needed for the mobile drawer. */
  tree?: PageTreeNode[];
  /** Overrides `config.header.transparentMode`. */
  transparentMode?: HeaderTransparentMode;
  /** Pre-resolved sidebar icons; computed from `tree` when omitted. */
  icons?: Record<string, ReactNode>;
  className?: string;
  /** Custom content rendered after the nav tabs. */
  start?: ReactNode;
  /** Custom content rendered before the search trigger. */
  end?: ReactNode;
  /** Rendered above the tree inside the mobile drawer. */
  sidebarBanner?: ReactNode;
  /** UI strings for the current locale. */
  labels?: Partial<UiLabels>;
}

function isImageLogo(logo: DocsConfig["logo"]): logo is ImageLogo {
  return typeof logo === "object" && logo !== null && !isValidElement(logo) && "src" in logo;
}

function Logo({ config }: { config: DocsConfig }) {
  const { logo } = config;
  let mark: ReactNode = null;
  if (isImageLogo(logo)) {
    mark = <img src={logo.src} alt={logo.alt ?? ""} width={logo.width ?? 22} height={logo.height ?? 22} className="pd-logo-image" />;
  } else if (logo) {
    mark = logo;
  }
  return (
    <Link href={config.homeUrl ?? "/"} className="pd-logo" aria-label={config.title}>
      {mark ? <span className="pd-logo-mark">{mark}</span> : null}
      <span className="pd-logo-text">{config.title}</span>
    </Link>
  );
}

/** Sticky 48px header: logo, nav tabs, search trigger, repository link, theme toggle and optional CTA. */
export function Header({ config, tree, transparentMode, icons, className, start, end, sidebarBanner, labels }: HeaderProps) {
  const links = config.nav?.links ?? [];
  const text = { ...DEFAULT_LABELS, ...labels };
  const sidebarIcons = icons ?? (tree ? collectTreeIcons(tree) : undefined);
  return (
    <HeaderShell transparentMode={transparentMode ?? config.header?.transparentMode ?? "none"} className={className}>
      <div className="pd-header-inner">
        <div className="pd-header-left">
          {tree ? (
            <MobileNav brand={<Logo config={config} />}>
              <Sidebar
                tree={tree}
                icons={sidebarIcons}
                defaultOpenLevel={config.sidebar?.defaultOpenLevel}
                prefetch={config.sidebar?.prefetch}
                header={
                  <>
                    {links.length > 0 ? <NavTabs links={links} className="pd-nav-tabs-mobile" /> : null}
                    {sidebarBanner}
                  </>
                }
              />
            </MobileNav>
          ) : null}
          <div className="pd-header-brand">
            <Logo config={config} />
          </div>
          {links.length > 0 ? <NavTabs links={links} /> : null}
          {start}
        </div>
        <div className="pd-header-right">
          {end}
          <SearchTrigger />
          {config.nav?.github ? (
            <a
              className="pd-icon-button"
              href={config.nav.github}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={text.repository}
            >
              <GitHubIcon />
            </a>
          ) : null}
          <ThemeToggle />
          {config.nav?.cta ? (
            <Link href={config.nav.cta.href} className="pd-cta">
              {config.nav.cta.text}
            </Link>
          ) : null}
        </div>
      </div>
    </HeaderShell>
  );
}
