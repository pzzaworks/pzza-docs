import GithubSlugger from "github-slugger";
import type { Heading, Root, Text } from "mdast";
import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";
import type { TocItem } from "../types.js";

export const CUSTOM_ID = /\s*\[#([^\]\s]+)\]\s*$/;
export const TOC_HIDE = /\s*\[!toc\]\s*$/i;
export const TOC_ONLY = /\s*\[toc\]\s*$/i;

interface HeadingData {
  hProperties?: Record<string, unknown>;
}

function lastText(node: Heading): Text | undefined {
  const last = node.children[node.children.length - 1];
  return last?.type === "text" ? last : undefined;
}

function stripSuffix(node: Heading, pattern: RegExp): RegExpExecArray | undefined {
  const text = lastText(node);
  if (!text) return undefined;
  const match = pattern.exec(text.value);
  if (!match) return undefined;
  text.value = text.value.slice(0, match.index).replace(/\s+$/, "");
  return match;
}

/**
 * Heading controls parsed before slugging:
 * - `## Title [#custom-id]` sets the anchor id
 * - `## Title [!toc]` renders the heading but hides it from the TOC
 * - `## Title [toc]` adds a TOC entry without rendering the heading
 */
export function remarkHeadingControls(tocOnly: TocItem[]) {
  return () => (tree: Root): void => {
    const slugger = new GithubSlugger();
    const removals: { parent: { children: unknown[] }; index: number }[] = [];

    visit(tree, "heading", (node: Heading, index, parent) => {
      const data = (node.data ??= {}) as HeadingData;
      const props = (data.hProperties ??= {});

      const customId = stripSuffix(node, CUSTOM_ID)?.[1];
      if (customId) props["id"] = customId;

      if (stripSuffix(node, TOC_HIDE)) props["dataToc"] = "hide";

      if (stripSuffix(node, TOC_ONLY) && parent && typeof index === "number") {
        const title = toString(node).trim();
        const id = typeof props["id"] === "string" ? props["id"] : slugger.slug(title);
        tocOnly.push({ id, title, depth: node.depth });
        removals.push({ parent, index });
      }
    });

    // Remove TOC-only headings last so visit indexes stay valid.
    for (const { parent, index } of removals.reverse()) parent.children.splice(index, 1);
  };
}
