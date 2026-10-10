import GithubSlugger from "github-slugger";
import type { PageData, PageTreeNode } from "../types.js";
import { CUSTOM_ID, TOC_HIDE, TOC_ONLY } from "./remark-headings.js";

const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const FENCE = /^\s*(`{3,}|~{3,})/;

/**
 * Markdown for LLM consumption: frontmatter stripped, the title as an H1 when the
 * body has none, and every heading suffixed with its anchor as `[#id]` so
 * agents can deep-link into the rendered page.
 */
export function toMarkdown(page: PageData, body: string): string {
  const slugger = new GithubSlugger();
  const lines = body.split("\n");
  const out: string[] = [];
  let fence: string | undefined;
  let hasH1 = false;

  for (const line of lines) {
    const fenceMatch = FENCE.exec(line);
    if (fenceMatch?.[1]) {
      if (!fence) fence = fenceMatch[1];
      else if (line.trim().startsWith(fence)) fence = undefined;
      out.push(line);
      continue;
    }
    if (fence) {
      out.push(line);
      continue;
    }

    const heading = HEADING.exec(line);
    if (!heading?.[1] || heading[2] === undefined) {
      out.push(line);
      continue;
    }

    let text = heading[2];
    if (TOC_ONLY.test(text)) continue;
    text = text.replace(TOC_HIDE, "");
    const custom = CUSTOM_ID.exec(text);
    text = text.replace(CUSTOM_ID, "").trim();
    const id = custom?.[1] ?? slugger.slug(text);
    if (heading[1].length === 1) hasH1 = true;
    out.push(`${heading[1]} ${text} [#${id}]`);
  }

  const header = hasH1 ? [] : [`# ${page.title}`, "", ...(page.description ? [page.description, ""] : [])];
  return [...header, ...out].join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export interface LlmsTxtOptions {
  title: string;
  description?: string;
  tree: PageTreeNode[];
  /** Maps a page URL to the Markdown route linked from the index. */
  markdownPath: (url: string) => string;
  /** Origin prefixed to every link; links stay relative when unset. */
  siteUrl?: string;
  /** True for URLs backed by a page file; link items are skipped. */
  include: (url: string) => boolean;
  /** Description lookup by page URL. */
  describe: (url: string) => string | undefined;
}

/** `llms.txt`: a Markdown index of the whole tree with one link per page. */
export function toLlmsTxt(options: LlmsTxtOptions): string {
  const lines: string[] = [`# ${options.title}`];
  if (options.description) lines.push("", `> ${options.description}`);

  const line = (name: string, url: string): string => {
    const description = options.describe(url);
    return `- [${name}](${options.siteUrl ?? ""}${options.markdownPath(url)})${description ? `: ${description}` : ""}`;
  };

  const walk = (nodes: PageTreeNode[], depth: number): void => {
    for (const node of nodes) {
      if (node.type === "page") {
        if (!node.external && options.include(node.url)) lines.push(line(node.name, node.url));
      } else if (node.type === "folder") {
        lines.push("", `${"#".repeat(Math.min(depth + 2, 6))} ${node.name}`);
        if (node.description) lines.push("", node.description);
        lines.push("");
        const listedByChild = node.children.some((c) => c.type === "page" && c.url === node.url);
        if (node.url && !listedByChild && options.include(node.url)) lines.push(line(node.name, node.url));
        walk(node.children, depth + 1);
      }
    }
  };

  lines.push("");
  walk(options.tree, 0);
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
