import type { ReactNode } from "react";
import { DEFAULT_LABELS } from "../labels.js";
import type { BreadcrumbItem, Neighbours, PageTreeNode, TocItem, UiLabels } from "../types.js";
import { Breadcrumbs } from "./client/breadcrumbs.js";
import { PageActions } from "./client/page-actions.js";
import { Pagination } from "./client/pagination.js";
import { PzzadocsMark } from "./pzzadocs-mark.js";
import { TOC } from "./client/toc.js";

export interface DocsPageProps {
  toc?: TocItem[];
  /** Used to derive breadcrumbs and prev/next links. */
  tree?: PageTreeNode[];
  /** URL of the current page. Falls back to the router pathname when omitted. */
  url?: string;
  breadcrumbs?: BreadcrumbItem[];
  neighbours?: Neighbours;
  /** Layout mode: the article spans the TOC column and the TOC becomes the popover bar at every width (frontmatter `full`). */
  full?: boolean;
  lastModified?: Date | string;
  /** Pre-computed "Edit on GitHub" link, shown in the page actions menu. */
  editUrl?: string;
  /** Route serving the page as raw Markdown; enables the page actions (copy, view, open in an assistant). */
  markdownUrl?: string;
  /** Pass `config.siteUrl` so assistant prompts and "View as Markdown" get an absolute URL (an absolute `markdownUrl` works too). */
  siteUrl?: string;
  /** BCP 47 tag used to format the last-modified date. Defaults to "en-US". */
  locale?: string;
  /** UI strings for the current locale, for the server-rendered footer. */
  labels?: Partial<UiLabels>;
  className?: string;
  children: ReactNode;
}

function formatDate(value: Date | string, locale: string): { iso: string; label: string } {
  const date = typeof value === "string" ? new Date(value) : value;
  return {
    iso: date.toISOString(),
    label: date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" }),
  };
}

/** The footer attribution is part of the framework and is always shown. */
const POWERED_BY_HREF = "https://docs.pzza.works";

/** Article column with breadcrumbs, page actions, prose body, right-hand TOC and footer navigation. */
export function DocsPage({ toc = [], tree, url, breadcrumbs, neighbours, full, lastModified, editUrl, markdownUrl, siteUrl, locale = "en-US", labels, className, children }: DocsPageProps) {
  const date = lastModified ? formatDate(lastModified, locale) : undefined;
  const text = { ...DEFAULT_LABELS, ...labels };
  const showBreadcrumbs = Boolean(breadcrumbs || tree);
  const showActions = Boolean(markdownUrl || editUrl);
  return (
    <div className={["pd-page", className].filter(Boolean).join(" ")} data-full={full ? "" : undefined}>
      <article className="pd-article">
        {showBreadcrumbs || showActions ? (
          <div className="pd-article-top">
            {showBreadcrumbs ? <Breadcrumbs items={breadcrumbs} tree={tree} url={url} /> : <span />}
            {showActions ? <PageActions markdownUrl={markdownUrl} editUrl={editUrl} pageUrl={url} siteUrl={siteUrl} /> : null}
          </div>
        ) : null}
        {children}
        <footer className="pd-page-footer">
          {neighbours || tree ? <Pagination neighbours={neighbours} tree={tree} url={url} /> : null}
          <div className="pd-page-meta">
              {date ? (
                <span>
                  {text.lastUpdated} <time dateTime={date.iso}>{date.label}</time>
                </span>
              ) : null}
              <a href={POWERED_BY_HREF} target="_blank" rel="noreferrer noopener" className="pd-powered-by">
                <span className="pd-powered-by-label">Powered by</span>
                <span className="pd-powered-by-brand">
                  <span className="pd-powered-by-mark">
                    <PzzadocsMark />
                  </span>
                  <span className="pd-powered-by-name">PzzaDocs</span>
                </span>
              </a>
            </div>
        </footer>
      </article>
      {toc.length > 0 ? <TOC items={toc} variant={full ? "bar" : "auto"} /> : null}
    </div>
  );
}

export interface DocsTitleProps {
  children: ReactNode;
  className?: string;
}

export function DocsTitle({ children, className }: DocsTitleProps) {
  return <h1 className={["pd-title", className].filter(Boolean).join(" ")}>{children}</h1>;
}

export interface DocsDescriptionProps {
  children?: ReactNode;
  className?: string;
}

export function DocsDescription({ children, className }: DocsDescriptionProps) {
  if (!children) return null;
  return <p className={["pd-description", className].filter(Boolean).join(" ")}>{children}</p>;
}

export interface DocsBodyProps {
  children: ReactNode;
  className?: string;
}

/** Prose container; all typography scales apply inside it. */
export function DocsBody({ children, className }: DocsBodyProps) {
  return <div className={["pd-prose", className].filter(Boolean).join(" ")}>{children}</div>;
}
