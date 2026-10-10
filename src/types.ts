import type { ReactNode } from "react";
import type { ThemeRegistration } from "shiki/core";

/** A link rendered in the header navigation tabs. */
export interface NavLink {
  text: string;
  href: string;
  /** Opens in a new tab and renders with an external icon. Inferred from the href when omitted. */
  external?: boolean;
  /**
   * Route prefix that marks this link active, for example "/docs/components" for a link
   * whose href points at the first component page. Defaults to the href itself.
   */
  activePrefix?: string;
}

export interface NavConfig {
  links?: NavLink[];
  /** Repository URL rendered as an icon link in the header. */
  github?: string;
  /** Optional call-to-action rendered as an outline button at the right end of the header. */
  cta?: { text: string; href: string };
}

export interface ImageLogo {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface SearchConfig {
  /** Defaults to true. */
  enabled?: boolean;
  /** Endpoint returning `SearchRecord[]` as JSON. Defaults to "/api/search". */
  indexUrl?: string;
  /** Key combined with Meta (macOS) or Ctrl that opens the dialog. Defaults to "k". */
  hotKey?: string;
}

export type ThemeName = "light" | "dark" | "system";

/** Color tokens, one per `--pd-*` color custom property. Any CSS color string is accepted. */
export interface ThemeColors {
  background: string;
  surface: string;
  surface2: string;
  surface3: string;
  foreground: string;
  foreground2: string;
  mutedForeground: string;
  faintForeground: string;
  border: string;
  borderStrong: string;
  sidebar: string;
  ring: string;
  overlay: string;
}

/** Token groups of the bundled code themes (`pzza-light` / `pzza-dark`). */
export interface CodeTokenColors {
  plain: string;
  keyword: string;
  fn: string;
  string: string;
  number: string;
  type: string;
  tag: string;
  attribute: string;
  property: string;
  variable: string;
  comment: string;
  punctuation: string;
  regex: string;
  templatePunctuation: string;
  background: string;
}

export type ThemePreset = "mono" | "slate" | "warm" | "contrast";
export type ThemeDensity = "compact" | "comfortable";

export interface ThemeFonts {
  /** `font-family` value for text, for example `var(--font-geist-sans), system-ui, sans-serif`. */
  sans?: string;
  /** `font-family` value for code. */
  mono?: string;
}

export interface ThemeLayout {
  /** Numbers are pixels; strings are used verbatim. */
  sidebarWidth?: number | string;
  tocWidth?: number | string;
  contentWidth?: number | string;
  headerHeight?: number | string;
}

/** A pair of shiki theme registrations used for the dual-theme highlighting. */
export interface CodeThemePair {
  light: ThemeRegistration;
  dark: ThemeRegistration;
}

export interface ThemeConfig {
  /** Defaults to "system". */
  defaultTheme?: ThemeName;
  /** Pressing "D" outside inputs toggles light/dark. Defaults to true. */
  hotKey?: boolean;
  /** Built-in gray palette applied before `colors`. Defaults to "mono". */
  preset?: ThemePreset;
  /** Token overrides for each color scheme. Only the keys you set are emitted. */
  colors?: { light?: Partial<ThemeColors>; dark?: Partial<ThemeColors> };
  /** Token group overrides for the bundled code themes. Ignored when `codeTheme` is a custom pair. */
  code?: { light?: Partial<CodeTokenColors>; dark?: Partial<CodeTokenColors> };
  /** Bundled subdued themes ("pzza", default) or any shiki theme pair. */
  codeTheme?: "pzza" | CodeThemePair;
  /** Corner radius for every control. Numbers are pixels. Defaults to 4. */
  radius?: number | string;
  fonts?: ThemeFonts;
  layout?: ThemeLayout;
  /** Row heights and paddings. Defaults to "comfortable". */
  density?: ThemeDensity;
}

/** `ThemeConfig` with defaults applied. Overrides stay partial; presets are expanded by the CSS generator. */
export interface ResolvedThemeConfig extends ThemeConfig {
  defaultTheme: ThemeName;
  hotKey: boolean;
  preset: ThemePreset;
  codeTheme: "pzza" | CodeThemePair;
  density: ThemeDensity;
}

export interface TocConfig {
  /** Smallest heading level collected. Defaults to 2. */
  minDepth?: number;
  /** Largest heading level collected. Defaults to 3. */
  maxDepth?: number;
}

export interface LlmConfig {
  /** Enables Markdown and llms.txt outputs plus the page actions menu. Defaults to true. */
  enabled?: boolean;
  /** Maps a page URL to the route serving its raw Markdown. Defaults to `${url}.mdx`. */
  markdownPath?: (url: string) => string;
}

export interface SidebarConfig {
  /** Folders at this depth or shallower start open (0 = only root-level folders are closed unless `defaultOpen`). Defaults to 0. */
  defaultOpenLevel?: number;
  /** Prefetch sidebar links with `next/link`. Defaults to true. */
  prefetch?: boolean;
}

export type HeaderTransparentMode = "none" | "top" | "always";

export interface HeaderConfig {
  /** "top" makes the header transparent until the page scrolls, "always" keeps it transparent. Defaults to "none". */
  transparentMode?: HeaderTransparentMode;
}

/** Where `lastModified` comes from: git commit time, filesystem mtime or nothing. Defaults to "git". */
export type LastModifiedSource = "git" | "fs" | false;

export interface DocsConfig {
  title: string;
  description?: string;
  /** A React node (for example an inline SVG) or an image descriptor. Rendered next to the wordmark. */
  logo?: ReactNode | ImageLogo;
  /** Directory containing the MDX files, relative to `process.cwd()`. Defaults to "content/docs". */
  contentDir?: string;
  /** Route prefix where the docs pages are mounted. Defaults to "/docs". */
  baseUrl?: string;
  /** Public origin of the site, for example "https://docs.example.com". Enables absolute links in llms outputs and assistant prompts. */
  siteUrl?: string;
  nav?: NavConfig;
  /** Returns the "Edit on GitHub" URL for a page. Omit to hide the link. */
  editUrl?: (page: PageData) => string;
  search?: SearchConfig;
  theme?: ThemeConfig;
  toc?: TocConfig;
  llm?: LlmConfig;
  sidebar?: SidebarConfig;
  header?: HeaderConfig;
  lastModified?: LastModifiedSource;
  /** Default locale. Files without a locale suffix belong to it. */
  defaultLocale?: string;
  /** Locales that may appear as file suffixes (`page.de.mdx`, `meta.de.json`). */
  locales?: string[];
}

/** `DocsConfig` with every default applied. Produced by `defineConfig`. */
export interface ResolvedDocsConfig extends DocsConfig {
  contentDir: string;
  baseUrl: string;
  /** `siteUrl` without a trailing slash, or undefined. */
  siteUrl?: string;
  search: Required<SearchConfig>;
  theme: ResolvedThemeConfig;
  toc: Required<TocConfig>;
  llm: Required<LlmConfig>;
  sidebar: Required<SidebarConfig>;
  header: Required<HeaderConfig>;
  lastModified: LastModifiedSource;
  locales: string[];
}

/** Frontmatter keys the framework understands. Extra keys are kept in `frontmatter`. */
export interface PageFrontmatter {
  title: string;
  description?: string;
  /** lucide icon name, used by the sidebar and card listings. */
  icon?: string;
  /** Layout mode: the article spans the TOC column and the TOC becomes the popover bar. */
  full?: boolean;
  /** Sort key used when a folder has no `meta.json` or lists `"..."`. */
  order?: number;
  /** Free-form tag, exposed on search records for filtering. */
  tag?: string;
}

export interface PageData extends PageFrontmatter {
  /** Route segments relative to `baseUrl`. Route-group folders `(name)` are not included. */
  slug: string[];
  /** Absolute route, for example "/docs/guides/theming". */
  url: string;
  /** Absolute file path on disk. */
  path: string;
  /** File path relative to `contentDir`, with extension. */
  file: string;
  /** Locale of this file, or undefined for the default locale. */
  locale?: string;
  frontmatter: Record<string, unknown>;
  lastModified: Date;
}

export interface TocItem {
  id: string;
  title: string;
  depth: number;
}

/** A page with its MDX compiled to React elements. */
export interface CompiledPage extends PageData {
  toc: TocItem[];
  content: ReactNode;
}

interface PageTreeBase {
  /** Stable identifier derived from the node's path, safe to use as a React key. */
  $id: string;
  name: string;
  /** lucide icon name. Resolved to an element by the UI layer; the tree itself stays serializable. */
  icon?: string;
}

export interface PageTreePage extends PageTreeBase {
  type: "page";
  url: string;
  description?: string;
  /** Opens in a new tab. Set for `[Text](url)` link items pointing outside the site. */
  external?: boolean;
}

export interface PageTreeFolder extends PageTreeBase {
  type: "folder";
  /** The clickable page for the folder: `index.mdx` or the `pagesIndex` entry. */
  index?: PageTreePage;
  /** Shortcut for `index?.url`. */
  url?: string;
  description?: string;
  /** Defaults to true. A non-collapsible folder always shows its children. */
  collapsible?: boolean;
  defaultOpen?: boolean;
  /**
   * `true` makes the folder a sidebar root (shown via the root switcher);
   * a string groups roots of the same type so switching keeps the relative path.
   */
  root?: boolean | string;
  children: PageTreeNode[];
}

export interface PageTreeSeparator extends PageTreeBase {
  type: "separator";
}

export type PageTreeNode = PageTreePage | PageTreeFolder | PageTreeSeparator;

interface SearchRecordBase {
  /** Unique within the index. */
  id: string;
  /** Route of the owning page. */
  pageUrl: string;
  /** Route to navigate to; heading and text records include the `#hash`. */
  url: string;
  /** Folder names leading to the page. */
  breadcrumbs: string[];
  /** Frontmatter `tag`, for filtering. */
  tag?: string;
}

export interface SearchPageRecord extends SearchRecordBase {
  type: "page";
  title: string;
  description?: string;
}

export interface SearchHeadingRecord extends SearchRecordBase {
  type: "heading";
  /** Heading text. */
  content: string;
  /** Owning page title, for display. */
  pageTitle: string;
}

export interface SearchTextRecord extends SearchRecordBase {
  type: "text";
  /** Paragraph, list item, table cell or blockquote text. */
  content: string;
  /** Nearest preceding heading id, when any. */
  headingId?: string;
  pageTitle: string;
}

/** One entry of the JSON returned by the search endpoint. */
export type SearchRecord = SearchPageRecord | SearchHeadingRecord | SearchTextRecord;

/** Kept for callers written against the first release; the index is now a flat record list. */
export type SearchEntry = SearchRecord;

export interface PageLink {
  name: string;
  url: string;
}

export interface Neighbours {
  previous?: PageLink;
  next?: PageLink;
}

export interface BreadcrumbItem {
  name: string;
  url?: string;
}

/** A "did you mean" candidate produced by `source.getSuggestions`. */
export interface PageSuggestion {
  url: string;
  title: string;
  score: number;
}

/** Shape of a folder's `meta.json`. */
export interface MetaFile {
  title?: string;
  icon?: string;
  description?: string;
  /** Defaults to true. */
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** `true` for an isolated sidebar root; a string names the root type so same-type roots are interchangeable. */
  root?: boolean | string;
  /** File name (without extension) of the clickable index page, or a `[Text](url)` link item. */
  pagesIndex?: string;
  /**
   * Explicit ordering. Supported entries:
   * - `"name"` a page or folder in this directory
   * - `"..."` remaining items by `order` then name, `"z...a"` the same reversed
   * - `"!name"` excluded from the rest
   * - `"...folder"` the children of `folder` hoisted inline
   * - `"[Text](url)"` or `"[Icon][Text](url)"` a link item, `"external:"` prefix forces a new tab
   * - `"---Label---"` or `"---[Icon]Label---"` a section separator
   */
  pages?: string[];
}
