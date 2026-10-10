import type { ThemeRegistration } from "shiki/core";
import type { CodeThemePair, CodeTokenColors, ResolvedThemeConfig } from "../../types.js";

type Palette = CodeTokenColors;

/**
 * Subdued token themes. The UI around the code is strictly gray, so these are
 * the only hues on the page and are kept low in saturation.
 */
function subduedTheme(name: string, type: "light" | "dark", p: Palette): ThemeRegistration {
  return {
    name,
    type,
    fg: p.plain,
    bg: p.background,
    colors: {
      "editor.background": p.background,
      "editor.foreground": p.plain,
    },
    tokenColors: [
      { scope: ["source", "text"], settings: { foreground: p.plain } },
      { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: p.comment, fontStyle: "italic" } },
      { scope: ["keyword", "storage", "storage.type", "storage.modifier", "keyword.control", "keyword.operator.new", "keyword.operator.expression"], settings: { foreground: p.keyword } },
      { scope: ["keyword.operator", "punctuation", "meta.brace", "punctuation.definition", "punctuation.separator", "punctuation.terminator", "punctuation.accessor"], settings: { foreground: p.punctuation } },
      { scope: ["punctuation.definition.template-expression", "punctuation.section.embedded"], settings: { foreground: p.templatePunctuation } },
      { scope: ["entity.name.function", "support.function", "meta.function-call entity.name.function", "variable.function", "entity.name.method"], settings: { foreground: p.fn } },
      { scope: ["string", "string.quoted", "string.template", "punctuation.definition.string"], settings: { foreground: p.string } },
      { scope: ["string.regexp", "constant.other.character-class", "keyword.operator.quantifier.regexp", "punctuation.definition.group.regexp"], settings: { foreground: p.regex } },
      { scope: ["constant.numeric", "constant.language", "constant.language.boolean", "constant.character", "constant.other", "support.constant"], settings: { foreground: p.number } },
      { scope: ["entity.name.type", "entity.name.class", "entity.name.interface", "entity.name.namespace", "support.type", "support.class", "entity.other.inherited-class", "meta.type"], settings: { foreground: p.type } },
      { scope: ["entity.name.tag", "punctuation.definition.tag", "support.class.component"], settings: { foreground: p.tag } },
      { scope: ["entity.other.attribute-name", "meta.attribute"], settings: { foreground: p.attribute } },
      { scope: ["variable", "variable.other", "variable.parameter", "meta.definition.variable"], settings: { foreground: p.variable } },
      { scope: ["variable.other.property", "variable.other.object.property", "support.variable.property", "meta.object-literal.key", "entity.name.tag.yaml", "support.type.property-name", "support.type.property-name.json", "support.type.property-name.css", "meta.property-name"], settings: { foreground: p.property } },
      { scope: ["markup.heading", "markup.bold"], settings: { foreground: p.keyword, fontStyle: "bold" } },
      { scope: ["markup.italic"], settings: { fontStyle: "italic" } },
      { scope: ["markup.inline.raw", "markup.fenced_code"], settings: { foreground: p.string } },
    ],
  };
}

export const pzzaLight = subduedTheme("pzza-light", "light", {
  plain: "#111111",
  keyword: "#5b4bb5",
  fn: "#2f5fa6",
  string: "#3b7f5c",
  number: "#a8632a",
  type: "#22768a",
  tag: "#a8403a",
  attribute: "#6a6a6a",
  property: "#3d3d3d",
  variable: "#111111",
  comment: "#9a9a9a",
  punctuation: "#6a6a6a",
  regex: "#3b7f5c",
  templatePunctuation: "#5b4bb5",
  background: "#ffffff",
});

export const pzzaDark = subduedTheme("pzza-dark", "dark", {
  plain: "#ececec",
  keyword: "#b4a4f5",
  fn: "#8db4f0",
  string: "#8fc9a6",
  number: "#e0a874",
  type: "#7fc3cf",
  tag: "#e39a93",
  attribute: "#c4c4c4",
  property: "#d8d8d8",
  variable: "#ececec",
  comment: "#6a6a6a",
  punctuation: "#8a8a8a",
  regex: "#8fc9a6",
  templatePunctuation: "#b4a4f5",
  background: "#121212",
});

const LIGHT_PALETTE: Palette = {
  plain: "#111111",
  keyword: "#5b4bb5",
  fn: "#2f5fa6",
  string: "#3b7f5c",
  number: "#a8632a",
  type: "#22768a",
  tag: "#a8403a",
  attribute: "#6a6a6a",
  property: "#3d3d3d",
  variable: "#111111",
  comment: "#9a9a9a",
  punctuation: "#6a6a6a",
  regex: "#3b7f5c",
  templatePunctuation: "#5b4bb5",
  background: "#ffffff",
};

const DARK_PALETTE: Palette = {
  plain: "#ececec",
  keyword: "#b4a4f5",
  fn: "#8db4f0",
  string: "#8fc9a6",
  number: "#e0a874",
  type: "#7fc3cf",
  tag: "#e39a93",
  attribute: "#c4c4c4",
  property: "#d8d8d8",
  variable: "#ececec",
  comment: "#6a6a6a",
  punctuation: "#8a8a8a",
  regex: "#8fc9a6",
  templatePunctuation: "#b4a4f5",
  background: "#121212",
};

/** Default token colors of the bundled themes, exposed for documentation and overrides. */
export const CODE_TOKEN_DEFAULTS: { light: CodeTokenColors; dark: CodeTokenColors } = { light: LIGHT_PALETTE, dark: DARK_PALETTE };

function hashKey(value: unknown): string {
  const json = JSON.stringify(value);
  let hash = 0;
  for (let i = 0; i < json.length; i += 1) hash = (hash * 31 + json.charCodeAt(i)) | 0;
  return (hash >>> 0).toString(36);
}

/**
 * Theme pair for a config: the bundled palettes merged with `code` overrides
 * (named per override set so several sources can coexist in one process), or
 * the custom pair when one is provided.
 */
export function resolveCodeThemes(theme: Pick<ResolvedThemeConfig, "code" | "codeTheme">): CodeThemePair {
  if (theme.codeTheme !== "pzza") return theme.codeTheme;
  if (!theme.code?.light && !theme.code?.dark) return { light: pzzaLight, dark: pzzaDark };
  const suffix = hashKey(theme.code);
  return {
    light: subduedTheme(`pzza-light-${suffix}`, "light", { ...LIGHT_PALETTE, ...theme.code.light }),
    dark: subduedTheme(`pzza-dark-${suffix}`, "dark", { ...DARK_PALETTE, ...theme.code.dark }),
  };
}
