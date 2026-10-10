import type { ReactNode } from "react";
import type { ResolvedThemeConfig, SearchConfig, ThemeConfig } from "../types.js";
import { RootProviderClient } from "./client/root-provider.js";
import { ThemeStyles } from "./theme-styles.js";

export interface RootProviderProps {
  children: ReactNode;
  /** Pass `config.theme`. A partial `ThemeConfig` is accepted and resolved with defaults. */
  theme?: ThemeConfig;
  search?: SearchConfig;
}

function resolveTheme(theme: ThemeConfig | undefined): ResolvedThemeConfig {
  return {
    ...theme,
    defaultTheme: theme?.defaultTheme ?? "system",
    hotKey: theme?.hotKey ?? true,
    preset: theme?.preset ?? "mono",
    codeTheme: theme?.codeTheme ?? "pzza",
    density: theme?.density ?? "comfortable",
  };
}

/**
 * Wraps the app with theming and search. Renders the config-driven token
 * overrides on the server and hands only the serialisable bits (default theme,
 * hotkeys, search options) to the client provider.
 */
export function RootProvider({ children, theme, search }: RootProviderProps) {
  const resolved = resolveTheme(theme);
  return (
    <>
      <ThemeStyles theme={resolved} />
      <RootProviderClient defaultTheme={resolved.defaultTheme} themeHotKey={resolved.hotKey} search={search}>
        {children}
      </RootProviderClient>
    </>
  );
}
