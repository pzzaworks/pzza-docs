import type { ResolvedDocsConfig, UiLabels } from "./types.js";

/** English defaults for every string the framework UI renders. */
export const DEFAULT_LABELS: UiLabels = {
  search: "Search",
  searchShort: "Search...",
  searchPlaceholder: "Search documentation...",
  searchDialog: "Search documentation",
  searchResults: "Results",
  searchLoading: "Loading...",
  searchNoResults: 'No results for "{query}"',
  searchError: "Could not load search index",
  onThisPage: "On this page",
  previous: "Previous",
  next: "Next",
  pagination: "Pagination",
  breadcrumb: "Breadcrumb",
  lastUpdated: "Last updated",
  copyMarkdown: "Copy Markdown",
  copied: "Copied",
  markdownCopied: "Markdown copied to clipboard",
  viewOptions: "View options",
  openInGitHub: "Open in GitHub",
  viewAsMarkdown: "View as Markdown",
  openIn: "Open in {name}",
  copyCode: "Copy code",
  openNavigation: "Open navigation",
  closeNavigation: "Close navigation",
  navigation: "Navigation",
  switchToLight: "Switch to light theme",
  switchToDark: "Switch to dark theme",
  repository: "Repository",
  zoomImage: "Zoom image",
  closeImage: "Close image",
  dismiss: "Dismiss",
};

/** Fills a template such as `Open in {name}`. */
export function fillLabel(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/** Merges the config's `translations` for a locale over the English defaults. */
export function resolveLabels(config: Pick<ResolvedDocsConfig, "translations" | "defaultLocale">, locale?: string): UiLabels {
  const key = locale ?? config.defaultLocale;
  const overrides = key ? config.translations?.[key] : undefined;
  return { ...DEFAULT_LABELS, ...overrides };
}
