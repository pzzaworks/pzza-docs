import "server-only";
import type { MDXComponents } from "mdx/types";
import { defaultMdxComponents } from "./mdx/index.js";
import { createSourceWithComponents, type Source, type SourceOptions } from "./source/index.js";
import type { ResolvedDocsConfig } from "./types.js";

export { defaultMarkdownPath, defineConfig, normalizeBaseUrl, normalizeSiteUrl } from "./config.js";
export { COLOR_TOKENS, DENSITY_TOKENS, resolveThemeCss, resolveThemeTokens, toCssValue } from "./theme/css.js";
export { CODE_TOKEN_DEFAULTS, resolveCodeThemes } from "./source/code/themes.js";
export type { ThemeTokens } from "./theme/css.js";
export { THEME_PRESETS } from "./theme/presets.js";
export type { PresetDefinition } from "./theme/presets.js";
export type { Source, SourceOptions };
export {
  flattenTree,
  folderContains,
  getActiveRoot,
  getBreadcrumbsFromTree,
  getNeighboursFromTree,
  getRootFolders,
  getSidebarNodes,
  isActiveUrl,
  projectUrlToRoot,
} from "./tree.js";
export type {
  BreadcrumbItem,
  CompiledPage,
  DocsConfig,
  HeaderConfig,
  HeaderTransparentMode,
  ImageLogo,
  LastModifiedSource,
  LlmConfig,
  MetaFile,
  NavConfig,
  NavLink,
  Neighbours,
  PageData,
  PageFrontmatter,
  PageLink,
  PageSuggestion,
  PageTreeFolder,
  PageTreeNode,
  PageTreePage,
  PageTreeSeparator,
  ResolvedDocsConfig,
  SearchConfig,
  SearchEntry,
  SearchHeadingRecord,
  SearchPageRecord,
  SearchRecord,
  SearchTextRecord,
  SidebarConfig,
  CodeThemePair,
  CodeTokenColors,
  ResolvedThemeConfig,
  ThemeColors,
  ThemeConfig,
  ThemeDensity,
  ThemeFonts,
  ThemeLayout,
  ThemeName,
  ThemePreset,
  TocConfig,
  TocItem,
} from "./types.js";

/**
 * Creates the filesystem content source. Pages are compiled with
 * `defaultMdxComponents` merged under any components passed in `options`.
 * Server only: importing this entry from a client component throws.
 */
export function createSource(config: ResolvedDocsConfig, options: SourceOptions = {}): Source {
  const components: MDXComponents = { ...defaultMdxComponents, ...options.components };
  return createSourceWithComponents(config, components);
}
