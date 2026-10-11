import type { Element, ElementContent, Parent, Root, RootContent } from "hast";
import { toString } from "hast-util-to-string";
import { visit } from "unist-util-visit";
import { highlightCode } from "./code/highlighter.js";
import type { CodeThemePair } from "../types.js";
import { parseCodeMeta, type CodeMeta } from "./code/meta.js";
import { convertCommands, PACKAGE_MANAGERS } from "./code/package-manager.js";

const PACKAGE_INSTALL_LANGS = new Set(["package-install", "npm"]);
const PACKAGE_MANAGER_GROUP = "package-manager";
const MERMAID_LANG = "mermaid";

function languageOf(code: Element): string | undefined {
  const className = code.properties["className"];
  const list = Array.isArray(className) ? className : typeof className === "string" ? [className] : [];
  for (const cls of list) {
    const match = /^language-(.+)$/.exec(String(cls));
    if (match?.[1]) return match[1];
  }
  return undefined;
}

function metaOf(code: Element): string | undefined {
  const value = code.data && "meta" in code.data ? code.data.meta : undefined;
  return typeof value === "string" ? value : undefined;
}

function isElement(node: RootContent | ElementContent | undefined, tagName?: string): node is Element {
  return node?.type === "element" && (tagName === undefined || node.tagName === tagName);
}

function hasClass(node: Element, name: string): boolean {
  // Shiki writes `class`, hast parsers write `className`; accept both shapes.
  const value = node.properties["class"] ?? node.properties["className"];
  if (Array.isArray(value)) return value.some((cls) => String(cls) === name);
  return typeof value === "string" && value.split(/\s+/).includes(name);
}

/**
 * Source as the reader sees it: notation comments are already gone and removed
 * diff lines are skipped, so this is what the copy button should write.
 */
function cleanSource(pre: Element): string {
  const code = pre.children.find((child): child is Element => isElement(child, "code"));
  if (!code) return toString(pre);
  const lines: string[] = [];
  for (const child of code.children) {
    if (!isElement(child) || !hasClass(child, "line")) continue;
    if (hasClass(child, "diff") && hasClass(child, "remove")) continue;
    lines.push(toString(child));
  }
  return lines.join("\n");
}

interface HighlightedBlock {
  lang: string;
  source: string;
  meta: CodeMeta;
  rawMeta: string;
}

async function highlightBlock({ lang, source, meta, rawMeta }: HighlightedBlock, themes?: CodeThemePair): Promise<Element | undefined> {
  const highlighted = await highlightCode(source, lang, rawMeta, themes);
  const pre = highlighted.children.find((child): child is Element => isElement(child, "pre"));
  if (!pre) return undefined;

  const props = pre.properties;
  props["dataLang"] = lang;
  if (meta.title) props["dataTitle"] = meta.title;
  if (meta.tab !== undefined) props["dataTab"] = meta.tab === true ? (meta.title ?? lang) : meta.tab;
  if (meta.tabGroup) props["dataTabGroup"] = meta.tabGroup;
  if (meta.noCopy) props["dataNoCopy"] = "";
  if (meta.lineNumbers) props["dataLineNumbers"] = "";
  props["dataLineStart"] = meta.lineStart;
  props["dataCode"] = cleanSource(pre);
  return pre;
}

/** A `mermaid` fence becomes the client-rendered diagram component instead of a highlighted block. */
function mermaidDiagram(source: string, meta: CodeMeta): Element {
  return {
    type: "element",
    tagName: "Mermaid",
    properties: { chart: source, ...(meta.title ? { title: meta.title } : {}) },
    children: [],
  };
}

function codeTabs(pres: Element[], group: string | undefined): Element {
  const labels = pres.map((pre) => String(pre.properties["dataTab"] ?? pre.properties["dataLang"] ?? ""));
  return {
    type: "element",
    tagName: "CodeTabs",
    properties: { items: JSON.stringify(labels), ...(group ? { group } : {}) },
    children: pres,
  };
}

/** Expands a `package-install` fence into one bash block per package manager. */
async function packageInstallTabs(body: string, meta: CodeMeta, themes?: CodeThemePair): Promise<Element | undefined> {
  const pres: Element[] = [];
  for (const pm of PACKAGE_MANAGERS) {
    const pre = await highlightBlock(
      {
        lang: "bash",
        source: convertCommands(body, pm),
        meta: { ...meta, tab: pm, tabGroup: PACKAGE_MANAGER_GROUP, lineNumbers: false },
        rawMeta: "",
      },
      themes,
    );
    if (!pre) return undefined;
    pres.push(pre);
  }
  return codeTabs(pres, PACKAGE_MANAGER_GROUP);
}

function isBlankText(node: RootContent | ElementContent): boolean {
  return node.type === "text" && node.value.trim() === "";
}

function isTabbedPre(node: RootContent | ElementContent): node is Element {
  return isElement(node, "pre") && node.properties["dataTab"] !== undefined;
}

/** Merges runs of adjacent tabbed `pre` siblings into a single CodeTabs element. */
function mergeTabbedSiblings(parent: Parent): void {
  const children = parent.children;
  let index = 0;
  while (index < children.length) {
    const first = children[index];
    if (!first || !isTabbedPre(first)) {
      index += 1;
      continue;
    }
    const pres: Element[] = [first];
    let end = index + 1;
    while (end < children.length) {
      const next = children[end];
      if (!next) break;
      if (isTabbedPre(next)) {
        pres.push(next);
        end += 1;
      } else if (isBlankText(next) && isTabbedPre(children[end + 1] ?? { type: "text", value: "x" })) {
        end += 1;
      } else {
        break;
      }
    }
    const group = pres.map((pre) => pre.properties["dataTabGroup"]).find((value) => typeof value === "string");
    children.splice(index, end - index, codeTabs(pres, typeof group === "string" ? group : undefined));
    index += 1;
  }
}

/**
 * Replaces `<pre><code>` blocks with shiki output. Both themes are emitted as
 * CSS variables (`--shiki-light` / `--shiki-dark`) so the stylesheet decides
 * which one applies. Meta values are exposed as data attributes for the `Pre`
 * component, and tabbed blocks are grouped into `CodeTabs`.
 */
export interface RehypeShikiOptions {
  /** Theme pair used for the dual-theme output. Defaults to the bundled subdued themes. */
  themes?: CodeThemePair;
}

export function rehypeShiki(options: RehypeShikiOptions = {}) {
  return async (tree: Root): Promise<void> => {
    const jobs: Promise<void>[] = [];

    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "pre" || !parent || typeof index !== "number") return;
      const code = node.children.find((child): child is Element => isElement(child, "code"));
      if (!code) return;

      const rawLang = languageOf(code) ?? "text";
      const rawMeta = metaOf(code) ?? "";
      const meta = parseCodeMeta(rawMeta);
      const source = toString(code).replace(/\n$/, "");

      if (rawLang === MERMAID_LANG) {
        parent.children[index] = mermaidDiagram(source, meta);
        return;
      }

      const job = PACKAGE_INSTALL_LANGS.has(rawLang)
        ? packageInstallTabs(source, meta, options.themes)
        : highlightBlock({ lang: rawLang, source, meta, rawMeta }, options.themes);

      jobs.push(
        job.then((replacement) => {
          if (replacement) parent.children[index] = replacement;
        }),
      );
    });

    await Promise.all(jobs);

    visit(tree, (node) => {
      if ("children" in node && node.type !== "element") mergeTabbedSiblings(node);
      else if (node.type === "element" && node.tagName !== "CodeTabs") mergeTabbedSiblings(node);
    });
  };
}
