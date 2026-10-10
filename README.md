# PzzaDocs

PzzaDocs is a customizable MDX docs framework for Next.js (App Router). The npm package is `pzzadocs`. Plain CSS with
`--pd-*` tokens, server-side MDX compilation, shiki highlighting with notation
transformers, structured client-side search, LLM-friendly Markdown outputs and
a React 19 component set.

## Install

```bash
pnpm add pzzadocs
```

Peer dependencies: `next@^16`, `react@^19`, `react-dom@^19`.

## Quick start

`docs.config.ts`:

```ts
import { defineConfig } from "pzzadocs";

export default defineConfig({
  title: "My Docs",
  description: "Documentation for my project.",
  contentDir: "content/docs",
  baseUrl: "/docs",
  nav: {
    links: [{ text: "Overview", href: "/docs" }],
    github: "https://github.com/you/repo",
  },
  editUrl: (page) => `https://github.com/you/repo/edit/main/content/docs/${page.file}`,
});
```

`lib/source.ts`:

```ts
import { createSource } from "pzzadocs";
import config from "../docs.config";

export const source = createSource(config);
```

`app/layout.tsx`:

```tsx
import "pzzadocs/styles.css";
import { RootProvider } from "pzzadocs/ui";
import { Geist, Geist_Mono } from "next/font/google";
import config from "../docs.config";

const sans = Geist({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--pd-font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--pd-font-mono" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body>
        <RootProvider theme={config.theme} search={config.search}>{children}</RootProvider>
      </body>
    </html>
  );
}
```

`app/docs/layout.tsx`:

```tsx
import { DocsLayout } from "pzzadocs/ui";
import config from "../../docs.config";
import { source } from "../../lib/source";

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout tree={await source.getPageTree()} config={config}>
      {children}
    </DocsLayout>
  );
}
```

`app/docs/[[...slug]]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "pzzadocs/ui";
import config from "../../../docs.config";
import { source } from "../../../lib/source";

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const page = await source.getPage(slug);
  if (!page) notFound();
  const tree = await source.getPageTree();

  return (
    <DocsPage
      toc={page.toc}
      tree={tree}
      url={page.url}
      full={page.full}
      lastModified={page.lastModified}
      editUrl={config.editUrl?.(page)}
      markdownUrl={config.llm.enabled ? config.llm.markdownPath(page.url) : undefined}
      siteUrl={config.siteUrl}
    >
      <DocsTitle>{page.title}</DocsTitle>
      <DocsDescription>{page.description}</DocsDescription>
      <DocsBody>{page.content}</DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  const pages = await source.getPages();
  return pages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const page = await source.getPage(slug);
  return page ? { title: page.title, description: page.description } : {};
}
```

`app/api/search/route.ts`:

```ts
import { source } from "../../../lib/source";

export async function GET() {
  return Response.json(await source.getSearchIndex());
}
```

Markdown and llms routes (optional, used by the page actions menu). A route
handler cannot live next to `page.tsx`, so serve Markdown from its own segment:

```ts
// app/llms.mdx/[[...slug]]/route.ts
import { source } from "../../../lib/source";

export async function GET(_: Request, ctx: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await ctx.params;
  const markdown = await source.getMarkdown(slug);
  if (!markdown) return new Response("Not found", { status: 404 });
  return new Response(markdown, { headers: { "content-type": "text/markdown; charset=utf-8" } });
}
```

and point the menu at it with `llm: { markdownPath: (url) => url.replace(/^\/docs/, "/llms.mdx") }`.
Set `siteUrl` (for example `"https://docs.example.com"`) so `llms.txt`,
`llms-full.txt` and the "Open in ..." prompts carry absolute URLs; pass it to
`DocsPage` as `siteUrl={config.siteUrl}`. Without it the outputs stay relative
and the page actions fall back to the browser origin.
`app/llms.txt/route.ts` returns `source.getLlmsTxt()` and `app/llms-full.txt/route.ts`
returns `source.getLlmsFullTxt()`.

Not-found page with "did you mean" suggestions. Do not read the pathname from
`headers()` inside `app/not-found.tsx`: that opts every route out of static
generation. Keep the not-found page static, let a small client component read
`usePathname()` and ask a route handler:

```ts
// app/api/suggest/route.ts
import { source } from "../../../lib/source";

export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path") ?? "";
  if (!path.startsWith("/") || path.length > 200) return Response.json([]);
  return Response.json(await source.getSuggestions(path, 5));
}
```

```tsx
// app/not-found.tsx renders <Suggestions />, a client component:
"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { PageSuggestion } from "pzzadocs";

export function Suggestions() {
  const pathname = usePathname();
  const [items, setItems] = useState<PageSuggestion[]>([]);
  useEffect(() => {
    fetch(`/api/suggest?path=${encodeURIComponent(pathname)}`)
      .then((res) => res.json() as Promise<PageSuggestion[]>)
      .then(setItems)
      .catch(() => setItems([]));
  }, [pathname]);
  return items.length ? <ul>{items.map((s) => <li key={s.url}><a href={s.url}>{s.title}</a></li>)}</ul> : null;
}
```

## Content

Pages live in `contentDir` as `.mdx` or `.md` files with frontmatter:

```mdx
---
title: Installation        # required
description: Set it up.    # optional
icon: Rocket               # optional, lucide icon name
full: false                # optional, layout mode: article spans the TOC column, TOC becomes the top bar
order: 1                   # optional sort key
tag: guides                # optional, exposed on search records
---
```

`index.mdx` inside a folder maps to the folder route. Folders named `(group)`
are route groups: they organise the sidebar without appearing in URLs. Two files
resolving to the same URL throw at build time.

Locale variants sit next to the default file: `page.de.mdx` and `meta.de.json`
are used when you call `source.getPage(slug, "de")` (declare `locales: ["de"]`
in the config). Missing translations fall back to the default file.

### meta.json

```json
{
  "title": "Guides",
  "description": "Step by step guides.",
  "icon": "Book",
  "collapsible": true,
  "defaultOpen": true,
  "root": false,
  "pagesIndex": "index",
  "pages": [
    "index",
    "---[Star]Basics---",
    "quickstart",
    "...advanced",
    "!internal",
    "[Rocket][Changelog](/changelog)",
    "external:[Repository](https://github.com/you/repo)",
    "..."
  ]
}
```

| Entry | Meaning |
| --- | --- |
| `"name"` | A page or folder in this directory (file name without extension). |
| `"..."` | Remaining items sorted by `order` then name. `"z...a"` reverses the order. |
| `"!name"` | Excluded from the rest. |
| `"...folder"` | The children of `folder` inserted inline. |
| `"[Text](url)"` | A link item. `[Icon][Text](url)` adds a lucide icon. `external:` forces a new tab. |
| `"---Label---"` | A section label. `---[Icon]Label---` adds an icon. |

When `pages` is given, unlisted items are hidden unless `"..."` appears.
`root: true` turns the folder into a sidebar root: the sidebar shows a switcher
and only the active root's children. `root: "version"` (any string) marks roots
of the same type as interchangeable, so switching keeps the relative path when
the target has the same page. `description` is carried on the tree node and
used by `llms.txt`; the built-in sidebar only exposes it as the folder row's
`title` tooltip, so custom sidebars can render it however they like.

### Headings

- `## Title [#custom-id]` sets the anchor id.
- `## Title [!toc]` renders the heading but hides it from the TOC.
- `## Title [toc]` adds a TOC entry without rendering the heading (for headings rendered by components).
- The collected depth range comes from `toc: { minDepth: 2, maxDepth: 3 }`.

### Code blocks

````mdx
```ts title="app/page.tsx" lineNumbers=10
export default function Page() {} // [!code highlight]
const removed = 1; // [!code --]
const added = 2; // [!code ++]
```
````

Meta attributes: `title="..."`, `tab="Label"` (adjacent fences with `tab` merge
into one tabbed block), `tab-group="id"` (persists the selected tab in
localStorage), `noCopy`, `lineNumbers` or `lineNumbers=<start>`
(`showLineNumbers` is an alias). Notation comments: `[!code highlight]`,
`[!code ++]`, `[!code --]`, `[!code focus]`, `[!code word:term]`.

A `package-install` (or `npm`) fence expands into npm / pnpm / yarn / bun tabs:

````mdx
```package-install
npm install pzzadocs
npx create-next-app@latest
```
````

## Components

Every compiled page gets `defaultMdxComponents` without imports:
`Callout`, `Tabs` / `Tab`, `Steps` / `Step`, `Cards` / `Card`,
`Accordions` / `Accordion`, `CodeBlock`, `CodeTabs`, `TypeTable`,
`Files` / `Folder` / `File`, `InlineTOC`, `ImageZoom`, `Heading`. Standard
elements are mapped too: headings get copyable anchors, `a` uses `next/link`
for internal routes, `pre` renders the code frame, `img` opens a lightbox,
`table` scrolls horizontally.

```mdx
<Callout type="info" title="Note">Supports info, warn, error and success.</Callout>

<Tabs items={["pnpm", "npm"]} persist="package-manager">
  <Tab value="pnpm">`pnpm add pzzadocs`</Tab>
  <Tab value="npm">`npm install pzzadocs`</Tab>
</Tabs>

<Steps>
  <Step>### Install</Step>
  <Step>### Configure</Step>
</Steps>

<Cards>
  <Card title="Theming" description="Override the tokens." href="/docs/theming" />
</Cards>

<TypeTable type={{ title: { type: "string", required: true, description: "Page title" } }} />

<Files>
  <Folder name="app" defaultOpen>
    <File name="layout.tsx" />
  </Folder>
</Files>
```

The page footer shows "Last updated" and the "Powered by PzzaDocs" link;
`editUrl` is surfaced through the page actions menu ("Open in GitHub") rather
than the footer. The footer attribution is part of the framework and is always
shown.

`InlineTOC` needs the heading list explicitly; MDX has no automatic `toc` in
scope. Pass it from the route through the components option, or render it
around the body:

```tsx
<DocsBody>
  <InlineTOC items={page.toc} />
  {page.content}
</DocsBody>
```

Add your own components with `createSource(config, { components })`; they are
merged over the defaults.

`pzzadocs/ui` also exports `Banner` (dismissible, persisted by `id`, sets
`--pd-banner-height`) and `PageActions` (Copy Markdown plus a View options
menu with Open in GitHub, View as Markdown and open-in-assistant links).

## Config reference

| Key | Type | Default |
| --- | --- | --- |
| `title` | `string` | required |
| `description` | `string` | |
| `logo` | `ReactNode \| { src, alt?, width?, height? }` | |
| `contentDir` | `string` (relative to cwd, or absolute) | `"content/docs"` |
| `baseUrl` | `string` | `"/docs"` |
| `siteUrl` | `string` (public origin, trailing slash stripped) | |
| `nav.links` | `{ text, href, external? }[]` | `[]` |
| `nav.github` | `string` | |
| `nav.cta` | `{ text, href }` | |
| `editUrl` | `(page: PageData) => string` | |
| `search.enabled` | `boolean` | `true` |
| `search.indexUrl` | `string` | `"/api/search"` |
| `search.hotKey` | `string` | `"k"` |
| `theme.defaultTheme` | `"light" \| "dark" \| "system"` | `"system"` |
| `theme.hotKey` | `boolean` (press `D` to toggle) | `true` |
| `toc.minDepth` / `toc.maxDepth` | `number` | `2` / `3` |
| `llm.enabled` | `boolean` | `true` |
| `llm.markdownPath` | `(url: string) => string` | `` (url) => `${url}.mdx` `` |
| `sidebar.defaultOpenLevel` | `number` | `0` |
| `sidebar.prefetch` | `boolean` | `true` |
| `header.transparentMode` | `"none" \| "top" \| "always"` | `"none"` |
| `lastModified` | `"git" \| "fs" \| false` | `"git"` |
| `defaultLocale` / `locales` | `string` / `string[]` | `undefined` / `[]` |

`createSource(config)` returns:

| Method | Returns |
| --- | --- |
| `getPages(locale?)` | `PageData[]` (frontmatter only) |
| `getPage(slug?, locale?)` | `CompiledPage \| undefined` with `toc` and rendered `content` |
| `getPageTree(locale?)` | `PageTreeNode[]` for the sidebar |
| `getSearchIndex(locale?)` | `SearchRecord[]` (`page`, `heading` and `text` records) |
| `getNeighbours(slug?, locale?)` | `{ previous?, next? }` |
| `getMarkdown(slug?, locale?)` | Raw Markdown with `[#id]` anchors |
| `getLlmsTxt(locale?)` / `getLlmsFullTxt(locale?)` | `llms.txt` index / full concatenation |
| `getSuggestions(pathname, limit?, locale?)` | `PageSuggestion[]` for a not-found page |

Compiled pages are cached per process keyed by file path and mtime; the tree and
search index are keyed by a hash of the whole content directory listing, so
adding or removing files invalidates them. `lastModified` uses the last git
commit touching the file and falls back to the filesystem mtime when git is not
available or the file is not in history.

## Theming

Everything visual is driven by `--pd-*` custom properties. There are three
levels, from least to most effort:

1. `theme` in `docs.config.ts`: presets, colors, fonts, radius, density, layout
   and code themes. `RootProvider` renders a `ThemeStyles` server component
   that emits the resulting `:root` / `.dark` overrides as a static `<style>`
   (no runtime JavaScript, no flash).
2. Token overrides in your own stylesheet (`app/globals.css`).
3. Class-based CSS against the stable `pd-*` class names.

```ts
export default defineConfig({
  title: "My Docs",
  theme: {
    defaultTheme: "system",
    preset: "warm",
    colors: { dark: { background: "#0b0a09" } },
    radius: 6,
    density: "compact",
    fonts: { sans: "var(--font-geist-sans), system-ui, sans-serif", mono: "var(--font-geist-mono), ui-monospace, monospace" },
    layout: { sidebarWidth: 260, contentWidth: "80ch" },
  },
});
```

### Presets

`preset` picks one of four gray palettes before your `colors` are applied:
`"mono"` (neutral, default), `"slate"` (cool, slightly blue), `"warm"` (paper
and ink) and `"contrast"` (pure black and white with firm borders). Presets
only touch color tokens.

### Colors and code colors

`colors.light` / `colors.dark` accept any CSS color string per token key
(`background`, `surface`, `surface2`, `surface3`, `foreground`, `foreground2`,
`mutedForeground`, `faintForeground`, `border`, `borderStrong`, `sidebar`,
`ring`, `overlay`). `code.light` / `code.dark` override the token groups of
the bundled subdued code themes (`plain`, `keyword`, `fn`, `string`, `number`,
`type`, `tag`, `attribute`, `property`, `variable`, `comment`, `punctuation`,
`regex`, `templatePunctuation`, `background`). To use any shiki theme pair
instead, pass `codeTheme: { light, dark }` with two `ThemeRegistration`
objects (for example imports from `shiki/themes/<name>.mjs`).

### Fonts, radius, density, layout

- `fonts.sans` / `fonts.mono` are `font-family` strings. With `next/font`,
  load the font with a `variable` and reference it:
  `fonts: { sans: "var(--font-geist-sans), system-ui, sans-serif" }`.
  Setting `--pd-font-sans` / `--pd-font-mono` on `<html>` yourself still works.
- `radius` sets `--pd-radius` (numbers are pixels) and derives
  `--pd-radius-sm` as `max(2px, calc(radius - 1px))`.
- `density: "compact"` lowers row heights and paddings through the density
  tokens (`--pd-row-height`, `--pd-block-gap`, `--pd-cell-padding-*`,
  `--pd-box-padding-*`, `--pd-card-padding`).
- `layout` sets `--pd-sidebar-width`, `--pd-toc-width`, `--pd-content-width`
  and `--pd-header-height`.

### Overriding tokens in CSS

Import `pzzadocs/styles.css` before your globals. The package stylesheet is
wrapped in cascade layers (`@layer pzzadocs.base, pzzadocs.components,
pzzadocs.utilities`), so unlayered consumer CSS always wins without
`!important`:

```css
:root {
  --pd-foreground: #000000;
  --pd-radius: 6px;
}
.dark {
  --pd-background: #000000;
}
.pd-sidebar-item[data-active] {
  font-weight: 600;
}
```

Stable class names (`pd-layout`, `pd-header`, `pd-sidebar`, `pd-sidebar-item`,
`pd-toc`, `pd-toc-link`, `pd-page`, `pd-article`, `pd-prose`, `pd-callout`,
`pd-code`, `pd-tabs`, `pd-steps`, `pd-cards`, `pd-card`, `pd-accordion`,
`pd-table`, `pd-search-dialog`, ...) and state attributes (`data-active`,
`data-open`, `data-state`, `data-depth`, `data-type`, `data-full`,
`data-transparent`) are a public styling API. Layout shells accept
`className`; `DocsLayout` also takes `sidebarBanner`, `sidebarFooter`,
`headerStart` and `headerEnd` (rendered by `Header` as `start` after the nav
tabs and `end` before the search trigger).

### Dark mode

`RootProvider` uses `next-themes` with `attribute="class"` (adds `.dark` to
`<html>`; `[data-theme="dark"]` is honoured too), `enableSystem` and
`disableTransitionOnChange`. Add `suppressHydrationWarning` to `<html>`,
set `theme.defaultTheme` and keep `theme.hotKey` (the `D` key) unless you need
the key elsewhere. `color-scheme` follows the active theme so native controls
match.

### Design tokens reference (mono preset)

| Token | Light | Dark |
| --- | --- | --- |
| `--pd-background` | `#fafafa` | `#0c0c0c` |
| `--pd-surface` | `#ffffff` | `#121212` |
| `--pd-surface-2` | `#f2f2f2` | `#1a1a1a` |
| `--pd-surface-3` | `#e9e9e9` | `#232323` |
| `--pd-foreground` | `#111111` | `#ececec` |
| `--pd-foreground-2` | `#3d3d3d` | `#c4c4c4` |
| `--pd-muted-foreground` | `#707070` | `#8a8a8a` |
| `--pd-faint-foreground` | `#a3a3a3` | `#5c5c5c` |
| `--pd-border` | `#e4e4e4` | `#242424` |
| `--pd-border-strong` | `#cfcfcf` | `#343434` |
| `--pd-sidebar` | `#fafafa` | `#0c0c0c` |
| `--pd-ring` | `#111111` | `#ececec` |
| `--pd-overlay` | `rgba(0, 0, 0, 0.4)` | `rgba(0, 0, 0, 0.6)` |

Other presets: slate (`#f8f9fb` / `#0b0e12` background, `#0f1419` / `#e6eaf0`
foreground), warm (`#fbfaf8` / `#0f0e0d`, `#1a1816` / `#ebe6df`), contrast
(`#ffffff` / `#000000`, `#000000` / `#ffffff`); the full tables are exported
as `THEME_PRESETS` from `pzzadocs`.

Non-color tokens: `--pd-radius` 4px, `--pd-radius-sm` 3px,
`--pd-header-height` 48px, `--pd-banner-height` 0px, `--pd-sidebar-width`
240px, `--pd-toc-width` 220px, `--pd-content-width` 72ch,
`--pd-content-max-width` calc(76ch + 260px + 48px), `--pd-transition` 120ms
ease, `--pd-font-sans`, `--pd-font-mono`, and the density tokens
(`--pd-row-height` 28px / 24px compact, `--pd-block-gap` 16px / 12px,
`--pd-cell-padding-block` 8px / 5px, `--pd-cell-padding-inline` 12px / 10px,
`--pd-box-padding-block` 10px / 8px, `--pd-box-padding-inline` 12px / 10px,
`--pd-card-padding` 14px 16px / 10px 12px).

## Mounting at the root

The docs can live at the site root (`baseUrl: "/"`), for example on a
`docs.example.com` host. The index page then resolves to `/` and children to
`/guides/theming`; trailing or missing slashes in `baseUrl` are normalised
(`"/docs/"` and `"docs"` both become `"/docs"`).

```ts
// docs.config.ts
export default defineConfig({ title: "My Docs", baseUrl: "/", nav: { links: [{ text: "Docs", href: "/" }] } });
```

```tsx
// app/layout.tsx: RootProvider as before, then DocsLayout wraps every page
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootProvider theme={config.theme} search={config.search}>
          <DocsLayout tree={await source.getPageTree()} config={config}>{children}</DocsLayout>
        </RootProvider>
      </body>
    </html>
  );
}
```

`app/[[...slug]]/page.tsx` is the same page component shown in the quick start
(it reads `params.slug`, which is `undefined` for `/`). A nav link with
`href: "/"` is only active on `/` unless no more specific link matches.

The default Markdown route maps the index page to `/index.mdx` and every other
page to `.mdx`, so the matching handler is `app/llms.mdx/[[...slug]]/route.ts`
with `llm: { markdownPath: (url) => (url === "/" ? "/llms.mdx" : `/llms.mdx`) }`,
or keep the default and add a rewrite from `/:path*.mdx` to `/llms.mdx/:path*`
in `next.config.ts`.

## Bundling notes

- `pzzadocs` (the root entry) is server only; it imports `server-only` and
  throws when pulled into a client component.
- If the bundler struggles with shiki's dynamic grammar imports, add
  `serverExternalPackages: ["shiki"]` to `next.config.ts`.
- The content directory is read at request time, so Turbopack reports
  "dynamic filesystem access" for the source. It is expected; to make output
  tracing explicit, add
  `outputFileTracingIncludes: { "/docs/[[...slug]]": ["./content/docs/**/*"] }`.
  Passing an absolute `contentDir` (for example
  `path.join(process.cwd(), "content/docs")`) keeps the resolution in your app.

## Entry points

- `pzzadocs`: `defineConfig`, `createSource`, tree helpers (`getRootFolders`, `getSidebarNodes`, `projectUrlToRoot`, ...) and all types. Server only.
- `pzzadocs/ui`: `RootProvider`, `DocsLayout`, `DocsPage`, `DocsTitle`, `DocsDescription`, `DocsBody`, `Header`, `Sidebar`, `TOC`, `Search`, `SearchTrigger`, `ThemeToggle`, `Breadcrumbs`, `Pagination`, `PageActions`, `Banner`, `MobileNav`, `NavTabs`, `useSearch`.
- `pzzadocs/mdx`: `defaultMdxComponents` plus every component listed above and `CopyButton`, `Pre`, `Anchor`, `Table`, `Image`, `LangIcon`, `createHeading`.
- `pzzadocs/styles.css`: the stylesheet.
