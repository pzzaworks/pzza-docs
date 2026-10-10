import type { ResolvedThemeConfig, ThemeColors, ThemeDensity } from "../types.js";
import { THEME_PRESETS } from "./presets.js";

/** Token name for every color key. */
export const COLOR_TOKENS: Record<keyof ThemeColors, string> = {
  background: "--pd-background",
  surface: "--pd-surface",
  surface2: "--pd-surface-2",
  surface3: "--pd-surface-3",
  foreground: "--pd-foreground",
  foreground2: "--pd-foreground-2",
  mutedForeground: "--pd-muted-foreground",
  faintForeground: "--pd-faint-foreground",
  border: "--pd-border",
  borderStrong: "--pd-border-strong",
  sidebar: "--pd-sidebar",
  ring: "--pd-ring",
  overlay: "--pd-overlay",
};

/** Spacing tokens per density. "comfortable" matches the stylesheet defaults. */
export const DENSITY_TOKENS: Record<ThemeDensity, Record<string, string>> = {
  comfortable: {
    "--pd-row-height": "28px",
    "--pd-block-gap": "16px",
    "--pd-cell-padding-block": "8px",
    "--pd-cell-padding-inline": "12px",
    "--pd-box-padding-block": "10px",
    "--pd-box-padding-inline": "12px",
    "--pd-card-padding": "14px 16px",
  },
  compact: {
    "--pd-row-height": "24px",
    "--pd-block-gap": "12px",
    "--pd-cell-padding-block": "5px",
    "--pd-cell-padding-inline": "10px",
    "--pd-box-padding-block": "8px",
    "--pd-box-padding-inline": "10px",
    "--pd-card-padding": "10px 12px",
  },
};

export interface ThemeTokens {
  /** Declarations for `:root`. */
  root: Record<string, string>;
  /** Declarations for `.dark`. */
  dark: Record<string, string>;
}

/** Numbers are pixels; strings are used as written. Characters that could break out of a declaration are dropped. */
export function toCssValue(value: number | string): string {
  if (typeof value === "number") return `${value}px`;
  return value.replace(/[;{}]/g, "").trim();
}

function colorDeclarations(colors: Partial<ThemeColors> | undefined, into: Record<string, string>): void {
  if (!colors) return;
  for (const key of Object.keys(COLOR_TOKENS) as (keyof ThemeColors)[]) {
    const value = colors[key];
    if (typeof value === "string" && value.trim() !== "") into[COLOR_TOKENS[key]] = toCssValue(value);
  }
}

/**
 * Resolves the custom properties a theme config needs on top of the stylesheet
 * defaults: the preset (when not "mono") expands to the full color set, then
 * explicit colors, radius, fonts, layout and density are layered on top. Only
 * keys the config actually sets are emitted.
 */
export function resolveThemeTokens(theme: ResolvedThemeConfig): ThemeTokens {
  const root: Record<string, string> = {};
  const dark: Record<string, string> = {};

  if (theme.preset !== "mono") {
    const preset = THEME_PRESETS[theme.preset];
    colorDeclarations(preset.light, root);
    colorDeclarations(preset.dark, dark);
  }
  colorDeclarations(theme.colors?.light, root);
  colorDeclarations(theme.colors?.dark, dark);

  if (theme.radius !== undefined) {
    const radius = toCssValue(theme.radius);
    root["--pd-radius"] = radius;
    root["--pd-radius-sm"] = `max(2px, calc(${radius} - 1px))`;
  }
  if (theme.fonts?.sans) root["--pd-font-sans"] = toCssValue(theme.fonts.sans);
  if (theme.fonts?.mono) root["--pd-font-mono"] = toCssValue(theme.fonts.mono);

  const layout = theme.layout;
  if (layout?.sidebarWidth !== undefined) root["--pd-sidebar-width"] = toCssValue(layout.sidebarWidth);
  if (layout?.tocWidth !== undefined) root["--pd-toc-width"] = toCssValue(layout.tocWidth);
  if (layout?.contentWidth !== undefined) root["--pd-content-width"] = toCssValue(layout.contentWidth);
  if (layout?.headerHeight !== undefined) root["--pd-header-height"] = toCssValue(layout.headerHeight);

  if (theme.density !== "comfortable") Object.assign(root, DENSITY_TOKENS[theme.density]);

  return { root, dark };
}

function block(selector: string, declarations: Record<string, string>): string {
  const entries = Object.entries(declarations);
  if (entries.length === 0) return "";
  return `${selector}{${entries.map(([name, value]) => `${name}:${value}`).join(";")}}`;
}

/** CSS text for a `<style>` element; empty when the config changes nothing. */
export function resolveThemeCss(theme: ResolvedThemeConfig): string {
  const tokens = resolveThemeTokens(theme);
  return [block(":root", tokens.root), block('.dark,[data-theme="dark"]', tokens.dark)].filter(Boolean).join("\n");
}
