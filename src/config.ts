import type { DocsConfig, ResolvedDocsConfig } from "./types.js";

/** Normalises a route prefix: leading slash, no trailing slash, "/" stays "/". */
export function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  if (trimmed === "") return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/** Strips trailing slashes; empty values resolve to undefined. */
export function normalizeSiteUrl(siteUrl: string | undefined): string | undefined {
  const trimmed = siteUrl?.trim().replace(/\/+$/, "");
  return trimmed ? trimmed : undefined;
}

/** Default Markdown route: the page URL with an `.mdx` suffix. */
export function defaultMarkdownPath(url: string): string {
  return `${url.replace(/\/+$/, "") || "/index"}.mdx`;
}

/** Applies defaults and returns the config object consumed by `createSource` and the UI. */
export function defineConfig(config: DocsConfig): ResolvedDocsConfig {
  return {
    ...config,
    contentDir: config.contentDir ?? "content/docs",
    baseUrl: normalizeBaseUrl(config.baseUrl ?? "/docs"),
    siteUrl: normalizeSiteUrl(config.siteUrl),
    search: {
      enabled: config.search?.enabled ?? true,
      indexUrl: config.search?.indexUrl ?? "/api/search",
      hotKey: config.search?.hotKey ?? "k",
    },
    theme: {
      ...config.theme,
      defaultTheme: config.theme?.defaultTheme ?? "system",
      hotKey: config.theme?.hotKey ?? true,
      preset: config.theme?.preset ?? "mono",
      codeTheme: config.theme?.codeTheme ?? "pzza",
      density: config.theme?.density ?? "comfortable",
    },
    toc: {
      minDepth: config.toc?.minDepth ?? 2,
      maxDepth: config.toc?.maxDepth ?? 3,
    },
    llm: {
      enabled: config.llm?.enabled ?? true,
      markdownPath: config.llm?.markdownPath ?? defaultMarkdownPath,
    },
    math: {
      enabled: config.math?.enabled ?? true,
      singleDollar: config.math?.singleDollar ?? false,
    },
    sidebar: {
      defaultOpenLevel: config.sidebar?.defaultOpenLevel ?? 0,
      prefetch: config.sidebar?.prefetch ?? true,
    },
    header: {
      transparentMode: config.header?.transparentMode ?? "none",
    },
    lastModified: config.lastModified ?? "git",
    locales: config.locales ?? [],
  };
}
