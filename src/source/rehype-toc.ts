import type { Element, Root } from "hast";
import { toString } from "hast-util-to-string";
import { visit } from "unist-util-visit";
import type { TocItem } from "../types.js";

export interface TocOptions {
  minDepth: number;
  maxDepth: number;
}

const HEADING = /^h([1-6])$/;

/** Collects headings within the configured depth range (after rehype-slug assigned ids). */
export function rehypeToc(target: TocItem[], options: TocOptions) {
  return () => (tree: Root): void => {
    visit(tree, "element", (node: Element) => {
      const match = HEADING.exec(node.tagName);
      if (!match) return;
      const depth = Number(match[1]);
      const id = node.properties["id"];
      if (depth < options.minDepth || depth > options.maxDepth || typeof id !== "string") return;
      if (node.properties["dataToc"] === "hide") return;
      target.push({ id, title: toString(node).trim(), depth });
    });
  };
}
