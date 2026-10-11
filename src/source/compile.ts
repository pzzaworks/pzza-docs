import { compile, run, type CompileOptions as MdxCompileOptions } from "@mdx-js/mdx";
import type { MDXComponents } from "mdx/types";
import { createElement, type ReactNode } from "react";
import * as runtime from "react/jsx-runtime";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { CodeThemePair, MathConfig, TocItem } from "../types.js";
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
  math?: Required<MathConfig>;
}

export async function compileMdx(body: string, file: string, components: MDXComponents, options: CompileOptions): Promise<CompileResult> {
  const { toc, codeThemes, math } = options;
  const collected: TocItem[] = [];
  const tocOnly: TocItem[] = [];
  const structure: PageStructure = { headings: [], contents: [] };

  const remarkPlugins: NonNullable<MdxCompileOptions["remarkPlugins"]> = [remarkGfm];
  if (math?.enabled) remarkPlugins.push([remarkMath, { singleDollarTextMath: math.singleDollar }]);
  remarkPlugins.push(remarkHeadingControls(tocOnly));

  const rehypePlugins: NonNullable<MdxCompileOptions["rehypePlugins"]> = [rehypeSlug, rehypeStructure(structure), rehypeToc(collected, toc)];
  // KaTeX must run before shiki: remark-math emits math as `<pre><code class="math-display">`,
  // which the highlighter would otherwise claim as a plain code block.
  if (math?.enabled) rehypePlugins.push([rehypeKatex, { output: "htmlAndMathml" }]);
  rehypePlugins.push([rehypeShiki, { themes: codeThemes }]);

  const compiled = await compile(body, {
    outputFormat: "function-body",
    development: false,
    remarkPlugins,
    rehypePlugins,
  });

  const mod = await run(String(compiled), { ...runtime, baseUrl: `file://${file}` });
  const content = createElement(mod.default, { components });

  // TOC-only entries are appended in document order relative to each other; they carry
  // no position in the rendered tree, so they go after the collected headings.
  const items = [...collected, ...tocOnly.filter((item) => item.depth >= toc.minDepth && item.depth <= toc.maxDepth)];
  structure.headings.push(...tocOnly.map((item) => ({ id: item.id, content: item.title, depth: item.depth })));
  return { toc: items, content, structure };
}
