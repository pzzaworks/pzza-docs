import type { ThemeColors, ThemePreset } from "../types.js";

export interface PresetDefinition {
  /** One-line description shown by pickers and docs. */
  description: string;
  light: ThemeColors;
  dark: ThemeColors;
}

/** Neutral grays: the default look. */
const mono: PresetDefinition = {
  description: "Neutral grays with no tint.",
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
    accent: "#111111",
    accentForeground: "#fafafa",
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
    accent: "#ececec",
    accentForeground: "#0c0c0c",
  },
};

/** Cool, slightly blue-tinted grays. */
const slate: PresetDefinition = {
  description: "Cool, slightly blue-tinted grays.",
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
    accent: "#0f1419",
    accentForeground: "#f8f9fb",
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
    accent: "#e6eaf0",
    accentForeground: "#0b0e12",
  },
};

/** Warm paper and ink grays. */
const warm: PresetDefinition = {
  description: "Warm paper and ink grays.",
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
    accent: "#1a1816",
    accentForeground: "#fbfaf8",
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
    accent: "#ebe6df",
    accentForeground: "#0f0e0d",
  },
};

/** High contrast: pure white and black with firmer borders. */
const contrast: PresetDefinition = {
  description: "Pure white and black with firmer borders.",
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
    accent: "#000000",
    accentForeground: "#ffffff",
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
    accent: "#ffffff",
    accentForeground: "#000000",
  },
};

/** Blue-tinted surfaces with a blue accent. */
const ocean: PresetDefinition = {
  description: "Blue-tinted surfaces with a blue accent.",
  light: {
    background: "#f7f9fc",
    surface: "#ffffff",
    surface2: "#edf2f8",
    surface3: "#e1e8f1",
    foreground: "#0e1620",
    foreground2: "#334155",
    mutedForeground: "#64748b",
    faintForeground: "#94a3b8",
    border: "#e0e7ef",
    borderStrong: "#c7d2df",
    sidebar: "#f7f9fc",
    ring: "#2563eb",
    overlay: "rgba(8, 16, 30, 0.45)",
    accent: "#2563eb",
    accentForeground: "#ffffff",
  },
  dark: {
    background: "#0a0f17",
    surface: "#0f1621",
    surface2: "#161f2c",
    surface3: "#1e2937",
    foreground: "#e4ebf5",
    foreground2: "#b9c5d6",
    mutedForeground: "#7f8ea3",
    faintForeground: "#52607a",
    border: "#1f2a3a",
    borderStrong: "#2d3b4f",
    sidebar: "#0a0f17",
    ring: "#60a5fa",
    overlay: "rgba(0, 0, 0, 0.6)",
    accent: "#60a5fa",
    accentForeground: "#0a0f17",
  },
};

/** Violet-tinted surfaces with a violet accent. */
const dusk: PresetDefinition = {
  description: "Violet-tinted surfaces with a violet accent.",
  light: {
    background: "#faf9fc",
    surface: "#ffffff",
    surface2: "#f2f0f7",
    surface3: "#e8e4f0",
    foreground: "#17121f",
    foreground2: "#3f3650",
    mutedForeground: "#6f6682",
    faintForeground: "#a097b2",
    border: "#e6e2ee",
    borderStrong: "#cfc8db",
    sidebar: "#faf9fc",
    ring: "#7c3aed",
    overlay: "rgba(14, 10, 22, 0.45)",
    accent: "#7c3aed",
    accentForeground: "#ffffff",
  },
  dark: {
    background: "#0e0b14",
    surface: "#14101c",
    surface2: "#1c1726",
    surface3: "#261f32",
    foreground: "#ece8f3",
    foreground2: "#c3bbd1",
    mutedForeground: "#8d849e",
    faintForeground: "#5c536d",
    border: "#241e30",
    borderStrong: "#352d44",
    sidebar: "#0e0b14",
    ring: "#a78bfa",
    overlay: "rgba(0, 0, 0, 0.6)",
    accent: "#a78bfa",
    accentForeground: "#0e0b14",
  },
};

/** Green-tinted surfaces with a green accent. */
const forest: PresetDefinition = {
  description: "Green-tinted surfaces with a green accent.",
  light: {
    background: "#f8faf8",
    surface: "#ffffff",
    surface2: "#eef3ee",
    surface3: "#e2eae3",
    foreground: "#101a13",
    foreground2: "#334238",
    mutedForeground: "#65736a",
    faintForeground: "#96a39a",
    border: "#e0e8e2",
    borderStrong: "#c6d3c9",
    sidebar: "#f8faf8",
    ring: "#15803d",
    overlay: "rgba(8, 18, 12, 0.45)",
    accent: "#15803d",
    accentForeground: "#ffffff",
  },
  dark: {
    background: "#0a100c",
    surface: "#0f1711",
    surface2: "#162018",
    surface3: "#1e2a21",
    foreground: "#e5efe8",
    foreground2: "#b8c8bd",
    mutedForeground: "#7e9285",
    faintForeground: "#51625a",
    border: "#1f2b23",
    borderStrong: "#2e3d33",
    sidebar: "#0a100c",
    ring: "#4ade80",
    overlay: "rgba(0, 0, 0, 0.6)",
    accent: "#4ade80",
    accentForeground: "#0a100c",
  },
};

/** Warm sand surfaces with an orange accent. */
const ember: PresetDefinition = {
  description: "Warm sand surfaces with an orange accent.",
  light: {
    background: "#fcfaf7",
    surface: "#ffffff",
    surface2: "#f6f1ea",
    surface3: "#ede5da",
    foreground: "#1c1510",
    foreground2: "#4a3d33",
    mutedForeground: "#7a6b5e",
    faintForeground: "#ab9d90",
    border: "#ece4da",
    borderStrong: "#d7cabb",
    sidebar: "#fcfaf7",
    ring: "#ea580c",
    overlay: "rgba(22, 14, 8, 0.45)",
    accent: "#ea580c",
    accentForeground: "#ffffff",
  },
  dark: {
    background: "#110d0a",
    surface: "#17120e",
    surface2: "#201913",
    surface3: "#2a2119",
    foreground: "#f0e9e2",
    foreground2: "#cbc0b5",
    mutedForeground: "#978a7d",
    faintForeground: "#635749",
    border: "#2a221b",
    borderStrong: "#3c3129",
    sidebar: "#110d0a",
    ring: "#fb923c",
    overlay: "rgba(0, 0, 0, 0.6)",
    accent: "#fb923c",
    accentForeground: "#110d0a",
  },
};

/** Rose-tinted surfaces with a crimson accent. */
const rose: PresetDefinition = {
  description: "Rose-tinted surfaces with a crimson accent.",
  light: {
    background: "#fcf9fa",
    surface: "#ffffff",
    surface2: "#f6eff2",
    surface3: "#ede3e7",
    foreground: "#1c1116",
    foreground2: "#4a3640",
    mutedForeground: "#7a6670",
    faintForeground: "#ab979f",
    border: "#ecdfe4",
    borderStrong: "#d8c5cd",
    sidebar: "#fcf9fa",
    ring: "#e11d48",
    overlay: "rgba(22, 8, 14, 0.45)",
    accent: "#e11d48",
    accentForeground: "#ffffff",
  },
  dark: {
    background: "#120b0e",
    surface: "#181013",
    surface2: "#211719",
    surface3: "#2b1f23",
    foreground: "#f1e8eb",
    foreground2: "#cdbec4",
    mutedForeground: "#988790",
    faintForeground: "#645258",
    border: "#2c2025",
    borderStrong: "#3f2f36",
    sidebar: "#120b0e",
    ring: "#fb7185",
    overlay: "rgba(0, 0, 0, 0.6)",
    accent: "#fb7185",
    accentForeground: "#120b0e",
  },
};

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
  accent: "--pd-accent",
  accentForeground: "--pd-accent-foreground",
};

/** Numbers are pixels; strings are used as written. Characters that could break out of a declaration are dropped. */
export function toCssValue(value: number | string): string {
  if (typeof value === "number") return `${value}px`;
  return value.replace(/[;{}]/g, "").trim();
}

export function colorDeclarations(colors: Partial<ThemeColors> | undefined, into: Record<string, string>): void {
  if (!colors) return;
  for (const key of Object.keys(COLOR_TOKENS) as (keyof ThemeColors)[]) {
    const value = colors[key];
    if (typeof value === "string" && value.trim() !== "") into[COLOR_TOKENS[key]] = toCssValue(value);
  }
}

export function block(selector: string, declarations: Record<string, string>): string {
  const entries = Object.entries(declarations);
  if (entries.length === 0) return "";
  return `${selector}{${entries.map(([name, value]) => `${name}:${value}`).join(";")}}`;
}

/** CSS text that applies a preset's full colour set to `:root` and `.dark`. */
export function presetCss(name: ThemePreset): string {
  const preset = THEME_PRESETS[name];
  const root: Record<string, string> = {};
  const dark: Record<string, string> = {};
  colorDeclarations(preset.light, root);
  colorDeclarations(preset.dark, dark);
  return [block(":root", root), block('.dark,[data-theme="dark"]', dark)].join("\n");
}

export const THEME_PRESETS: Record<ThemePreset, PresetDefinition> = { mono, slate, warm, contrast, ocean, dusk, forest, ember, rose };

/** Preset names in display order. */
export const THEME_PRESET_NAMES = Object.keys(THEME_PRESETS) as ThemePreset[];
