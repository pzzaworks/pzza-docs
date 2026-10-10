import type { Element, Root } from "hast";
import { toString } from "hast-util-to-string";
import { visit, SKIP } from "unist-util-visit";

export interface StructuredHeading {
  id: string;
  content: string;
  depth: number;
}

export interface StructuredContent {
  /** Nearest preceding heading id. */
  heading?: string;
  content: string;
}

export interface PageStructure {
  headings: StructuredHeading[];
  contents: StructuredContent[];
}

const HEADING = /^h([1-6])$/;
const TEXT_BLOCKS = new Set(["p", "li", "td", "th", "blockquote"]);

function hasBlockChild(node: Element): boolean {
  return node.children.some((child) => child.type === "element" && (TEXT_BLOCKS.has(child.tagName) || child.tagName === "pre"));
}

/**
 * Extracts headings and text blocks for the search index. Runs after
 * rehype-slug (ids) and before the shiki step (code is skipped).
 */
export function rehypeStructure(target: PageStructure) {
  return () => (tree: Root): void => {
    let current: string | undefined;
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "pre") return SKIP;

      const heading = HEADING.exec(node.tagName);
      if (heading) {
        const id = node.properties["id"];
        if (typeof id === "string") {
          current = id;
          target.headings.push({ id, content: toString(node).trim(), depth: Number(heading[1]) });
        }
        return SKIP;
      }

      // Containers (li with nested p, blockquote with p) defer to their children to avoid duplicates.
      if (TEXT_BLOCKS.has(node.tagName) && !hasBlockChild(node)) {
        const content = toString(node).replace(/\s+/g, " ").trim();
        if (content) target.contents.push({ heading: current, content });
        return SKIP;
      }
      return undefined;
    });
  };
}
