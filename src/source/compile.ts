import { compile, run } from "@mdx-js/mdx";
import type { MDXComponents } from "mdx/types";
import { createElement, type ReactNode } from "react";
import * as runtime from "react/jsx-runtime";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import type { CodeThemePair, TocItem } from "../types.js";
import { rehypeShiki } from "./rehype-shiki.js";
import { rehypeStructure, type PageStructure } from "./rehype-structure.js";
import { rehypeToc, type TocOptions } from "./rehype-toc.js";
import { remarkHeadingControls } from "./remark-headings.js";

export interface CompileResult {
  toc: TocItem[];
  content: ReactNode;
  structure: PageStructure;
}

/**
 * Compiles an MDX body (frontmatter already stripped by gray-matter) and
 * evaluates it with the React runtime. Server only.
 */
export interface CompileOptions {
  toc: TocOptions;
  codeThemes?: CodeThemePair;
}

export async function compileMdx(body: string, file: string, components: MDXComponents, options: CompileOptions): Promise<CompileResult> {
  const { toc, codeThemes } = options;
  const collected: TocItem[] = [];
  const tocOnly: TocItem[] = [];
  const structure: PageStructure = { headings: [], contents: [] };

  const compiled = await compile(body, {
    outputFormat: "function-body",
    development: false,
    remarkPlugins: [remarkGfm, remarkHeadingControls(tocOnly)],
    rehypePlugins: [rehypeSlug, rehypeStructure(structure), rehypeToc(collected, toc), [rehypeShiki, { themes: codeThemes }]],
  });

  const mod = await run(String(compiled), { ...runtime, baseUrl: `file://${file}` });
  const content = createElement(mod.default, { components });

  // TOC-only entries are appended in document order relative to each other; they carry
  // no position in the rendered tree, so they go after the collected headings.
  const items = [...collected, ...tocOnly.filter((item) => item.depth >= toc.minDepth && item.depth <= toc.maxDepth)];
  structure.headings.push(...tocOnly.map((item) => ({ id: item.id, content: item.title, depth: item.depth })));
  return { toc: items, content, structure };
}
