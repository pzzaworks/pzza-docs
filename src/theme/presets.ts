import type { ThemeColors, ThemePreset } from "../types.js";

export interface PresetDefinition {
  light: ThemeColors;
  dark: ThemeColors;
}

/** Neutral grays: the default look. */
const mono: PresetDefinition = {
  light: {
    background: "#fafafa",
    surface: "#ffffff",
    surface2: "#f2f2f2",
    surface3: "#e9e9e9",
    foreground: "#111111",
    foreground2: "#3d3d3d",
    mutedForeground: "#707070",
    faintForeground: "#a3a3a3",
    border: "#e4e4e4",
    borderStrong: "#cfcfcf",
    sidebar: "#fafafa",
    ring: "#111111",
    overlay: "rgba(0, 0, 0, 0.4)",
  },
  dark: {
    background: "#0c0c0c",
    surface: "#121212",
    surface2: "#1a1a1a",
    surface3: "#232323",
    foreground: "#ececec",
    foreground2: "#c4c4c4",
    mutedForeground: "#8a8a8a",
    faintForeground: "#5c5c5c",
    border: "#242424",
    borderStrong: "#343434",
    sidebar: "#0c0c0c",
    ring: "#ececec",
    overlay: "rgba(0, 0, 0, 0.6)",
  },
};

/** Cool, slightly blue-tinted grays. */
const slate: PresetDefinition = {
  light: {
    background: "#f8f9fb",
    surface: "#ffffff",
    surface2: "#eff1f5",
    surface3: "#e4e7ed",
    foreground: "#0f1419",
    foreground2: "#3b434f",
    mutedForeground: "#6b7380",
    faintForeground: "#9aa3b0",
    border: "#e2e6ec",
    borderStrong: "#c9cfd8",
    sidebar: "#f8f9fb",
    ring: "#0f1419",
    overlay: "rgba(10, 14, 20, 0.45)",
  },
  dark: {
    background: "#0b0e12",
    surface: "#11151b",
    surface2: "#181d25",
    surface3: "#20262f",
    foreground: "#e6eaf0",
    foreground2: "#c0c7d1",
    mutedForeground: "#8690a0",
    faintForeground: "#596273",
    border: "#222933",
    borderStrong: "#323b47",
    sidebar: "#0b0e12",
    ring: "#e6eaf0",
    overlay: "rgba(0, 0, 0, 0.6)",
  },
};

/** Warm paper and ink grays. */
const warm: PresetDefinition = {
  light: {
    background: "#fbfaf8",
    surface: "#ffffff",
    surface2: "#f3f1ed",
    surface3: "#e9e6e0",
    foreground: "#1a1816",
    foreground2: "#44403b",
    mutedForeground: "#746e67",
    faintForeground: "#a69f97",
    border: "#e6e2db",
    borderStrong: "#d2ccc3",
    sidebar: "#fbfaf8",
    ring: "#1a1816",
    overlay: "rgba(20, 16, 12, 0.45)",
  },
  dark: {
    background: "#0f0e0d",
    surface: "#161412",
    surface2: "#1f1c19",
    surface3: "#282420",
    foreground: "#ebe6df",
    foreground2: "#c6bfb6",
    mutedForeground: "#8f877e",
    faintForeground: "#5f5850",
    border: "#27231f",
    borderStrong: "#383229",
    sidebar: "#0f0e0d",
    ring: "#ebe6df",
    overlay: "rgba(0, 0, 0, 0.6)",
  },
};

/** High contrast: pure white and black with firmer borders. */
const contrast: PresetDefinition = {
  light: {
    background: "#ffffff",
    surface: "#ffffff",
    surface2: "#f0f0f0",
    surface3: "#e0e0e0",
    foreground: "#000000",
    foreground2: "#1f1f1f",
    mutedForeground: "#4a4a4a",
    faintForeground: "#767676",
    border: "#c8c8c8",
    borderStrong: "#8a8a8a",
    sidebar: "#ffffff",
    ring: "#000000",
    overlay: "rgba(0, 0, 0, 0.55)",
  },
  dark: {
    background: "#000000",
    surface: "#000000",
    surface2: "#161616",
    surface3: "#262626",
    foreground: "#ffffff",
    foreground2: "#e8e8e8",
    mutedForeground: "#b4b4b4",
    faintForeground: "#8c8c8c",
    border: "#3a3a3a",
    borderStrong: "#6a6a6a",
    sidebar: "#000000",
    ring: "#ffffff",
    overlay: "rgba(0, 0, 0, 0.7)",
  },
};

export const THEME_PRESETS: Record<ThemePreset, PresetDefinition> = { mono, slate, warm, contrast };
