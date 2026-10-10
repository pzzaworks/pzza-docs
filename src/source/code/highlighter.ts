import {
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import type { Root } from "hast";
import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { bundledLanguages, type BundledLanguage } from "shiki/langs";
import type { CodeThemePair } from "../../types.js";
import { pzzaDark, pzzaLight } from "./themes.js";

const DEFAULT_PAIR: CodeThemePair = { light: pzzaLight, dark: pzzaDark };

function pairKey(pair: CodeThemePair): string {
  return `${pair.light.name ?? "light"}|${pair.dark.name ?? "dark"}`;
}

export const FALLBACK_LANGUAGE = "text";
const CACHE_LIMIT = 500;

const highlighters = new Map<string, Promise<HighlighterCore>>();
const languageLoads = new Map<string, Promise<void>>();
const cache = new Map<string, Root>();

const transformers = [
  transformerNotationHighlight({ matchAlgorithm: "v3" }),
  transformerNotationDiff({ matchAlgorithm: "v3" }),
  transformerNotationFocus({ matchAlgorithm: "v3" }),
  transformerNotationWordHighlight({ matchAlgorithm: "v3" }),
];

function isBundledLanguage(lang: string): lang is BundledLanguage {
  return Object.hasOwn(bundledLanguages, lang);
}

/** Maps a fence language to one shiki can load, falling back to plain text. */
export function resolveLanguage(lang: string | undefined): string {
  if (!lang) return FALLBACK_LANGUAGE;
  const lower = lang.toLowerCase();
  return isBundledLanguage(lower) ? lower : FALLBACK_LANGUAGE;
}

/** One highlighter per process; themes load once, grammars load on first use. */
function getHighlighter(pair: CodeThemePair): Promise<HighlighterCore> {
  const key = pairKey(pair);
  let pending = highlighters.get(key);
  if (!pending) {
    pending = createHighlighterCore({
      themes: [pair.light, pair.dark],
      langs: [],
      engine: createJavaScriptRegexEngine(),
    });
    highlighters.set(key, pending);
  }
  return pending;
}

async function ensureLanguage(highlighter: HighlighterCore, lang: string): Promise<void> {
  if (lang === FALLBACK_LANGUAGE || !isBundledLanguage(lang) || highlighter.getLoadedLanguages().includes(lang)) return;
  // Loads are tracked per highlighter so concurrent requests share one import.
  const loadKey = `${highlighter.getLoadedThemes().join("|")}:${lang}`;
  let pending = languageLoads.get(loadKey);
  if (!pending) {
    pending = highlighter.loadLanguage(bundledLanguages[lang]).then(() => {
      languageLoads.delete(loadKey);
    });
    languageLoads.set(loadKey, pending);
  }
  await pending;
}

function remember(key: string, value: Root): void {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, value);
}

/**
 * Highlights `code` with both themes as CSS variables and the notation
 * transformers enabled. Results are cached per language, meta and source.
 */
export async function highlightCode(code: string, lang: string, meta = "", pair: CodeThemePair = DEFAULT_PAIR): Promise<Root> {
  const resolved = resolveLanguage(lang);
  const key = `${pairKey(pair)}:${resolved}:${meta}:${code}`;
  const cached = cache.get(key);
  if (cached) return structuredClone(cached);

  const highlighter = await getHighlighter(pair);
  await ensureLanguage(highlighter, resolved);
  const root = highlighter.codeToHast(code, {
    lang: resolved,
    themes: { light: pair.light.name ?? "light", dark: pair.dark.name ?? "dark" },
    defaultColor: false,
    meta: { __raw: meta },
    transformers,
  });
  remember(key, root);
  return structuredClone(root);
}
