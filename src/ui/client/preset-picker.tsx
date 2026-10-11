"use client";

import { useEffect, useState } from "react";
import { presetCss, THEME_PRESET_NAMES, THEME_PRESETS } from "../../theme/presets.js";
import type { ThemePreset } from "../../types.js";

export interface ThemePresetPickerProps {
  /** Presets to offer, in order. Defaults to every built-in preset. */
  presets?: ThemePreset[];
  /** Preset shown as selected before the visitor picks one. Defaults to "mono". */
  defaultPreset?: ThemePreset;
  /** localStorage key that remembers the choice. Pass null to forget it on reload. Defaults to "pd-preset". */
  storageKey?: string | null;
  /** Called after a preset is applied. */
  onChange?: (preset: ThemePreset) => void;
  className?: string;
}

const STYLE_ID = "pd-preset-style";

function isPreset(value: string | null): value is ThemePreset {
  return value !== null && value in THEME_PRESETS;
}

function readStored(key: string | null): ThemePreset | undefined {
  if (!key) return undefined;
  try {
    const value = window.localStorage.getItem(key);
    return isPreset(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Applies the preset's tokens through one `<style>` element after the config styles. */
function applyPreset(name: ThemePreset, defaultPreset: ThemePreset): void {
  let style = document.getElementById(STYLE_ID);
  if (name === defaultPreset) {
    style?.remove();
    document.documentElement.removeAttribute("data-pd-preset");
    return;
  }
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.append(style);
  }
  style.textContent = presetCss(name);
  document.documentElement.setAttribute("data-pd-preset", name);
}

/**
 * Lets visitors switch between built-in presets at runtime. The choice is
 * applied as a `<style>` element and remembered in localStorage, so it
 * survives navigation. Use `theme.preset` in the config for a fixed site-wide
 * choice; this component is for letting readers pick their own.
 */
export function ThemePresetPicker({ presets = THEME_PRESET_NAMES, defaultPreset = "mono", storageKey = "pd-preset", onChange, className }: ThemePresetPickerProps) {
  const [active, setActive] = useState<ThemePreset>(defaultPreset);

  useEffect(() => {
    const stored = readStored(storageKey);
    if (stored && stored !== defaultPreset) {
      applyPreset(stored, defaultPreset);
      setActive(stored);
    }
  }, [defaultPreset, storageKey]);

  const select = (name: ThemePreset) => {
    applyPreset(name, defaultPreset);
    setActive(name);
    if (storageKey) {
      try {
        if (name === defaultPreset) window.localStorage.removeItem(storageKey);
        else window.localStorage.setItem(storageKey, name);
      } catch {
        // Storage can be unavailable in private windows; the choice still applies for this page.
      }
    }
    onChange?.(name);
  };

  return (
    <div className={["pd-preset-picker", className].filter(Boolean).join(" ")} role="radiogroup" aria-label="Theme preset">
      {presets.map((name) => {
        const preset = THEME_PRESETS[name];
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={name === active}
            className="pd-preset-option"
            data-active={name === active ? "" : undefined}
            title={preset.description}
            onClick={() => select(name)}
          >
            <span className="pd-preset-swatch" aria-hidden>
              <span style={{ background: preset.light.background, borderColor: preset.light.border }}>
                <i style={{ background: preset.light.accent }} />
              </span>
              <span style={{ background: preset.dark.background, borderColor: preset.dark.border }}>
                <i style={{ background: preset.dark.accent }} />
              </span>
            </span>
            <span className="pd-preset-name">{name}</span>
          </button>
        );
      })}
    </div>
  );
}
