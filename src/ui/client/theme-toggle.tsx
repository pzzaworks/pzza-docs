"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useLabels } from "./labels.js";

export interface ThemeToggleProps {
  className?: string;
}

/** Switches between light and dark. Renders a neutral icon until mounted to avoid hydration mismatches. */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const labels = useLabels();

  useEffect(() => setMounted(true), []);

  const dark = mounted && resolvedTheme === "dark";
  return (
    <button
      type="button"
      className={["pd-icon-button", className].filter(Boolean).join(" ")}
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? labels.switchToLight : labels.switchToDark}
      data-theme-toggle
    >
      {dark ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
    </button>
  );
}
