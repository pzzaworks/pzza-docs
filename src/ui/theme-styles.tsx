import { resolveThemeCss } from "../theme/css.js";
import type { ResolvedThemeConfig } from "../types.js";

export interface ThemeStylesProps {
  theme: ResolvedThemeConfig;
}

/**
 * Emits the custom property overrides a theme config needs as a static
 * `<style>` element. Rendered on the server, so the first paint already has
 * the final tokens and no client JavaScript is involved.
 */
export function ThemeStyles({ theme }: ThemeStylesProps) {
  const css = resolveThemeCss(theme);
  if (!css) return null;
  // The text is generated from config values with declaration delimiters stripped.
  return <style data-pd-theme="" dangerouslySetInnerHTML={{ __html: css }} />;
}
