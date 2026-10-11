"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SearchConfig, ThemeName, UiLabels } from "../../types.js";
import { LabelsProvider } from "./labels.js";

export interface SearchContextValue {
  enabled: boolean;
  indexUrl: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used inside <RootProvider>");
  return ctx;
}

export interface RootProviderClientProps {
  children: ReactNode;
  defaultTheme?: ThemeName;
  /** Whether the D key toggles the color scheme. */
  themeHotKey?: boolean;
  search?: SearchConfig;
  /** UI strings for the current locale, see `resolveLabels`. */
  labels?: Partial<UiLabels>;
}

// The dialog code (scoring, grouping, list rendering) is only downloaded on the first open.
const SearchDialog = lazy(() => import("./search.js").then((mod) => ({ default: mod.Search })));

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

interface HotkeysProps {
  searchEnabled: boolean;
  searchKey: string;
  themeHotKey: boolean;
  open: boolean;
  toggleSearch: () => void;
}

/** Lives under the theme provider so it can read `useTheme`. Renders nothing. */
function Hotkeys({ searchEnabled, searchKey, themeHotKey, open, toggleSearch }: HotkeysProps) {
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isTypingTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (searchEnabled && (event.metaKey || event.ctrlKey) && key === searchKey) {
        event.preventDefault();
        toggleSearch();
        return;
      }
      if (themeHotKey && !open && key === "d" && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchEnabled, searchKey, themeHotKey, open, toggleSearch, resolvedTheme, setTheme]);

  return null;
}

/**
 * Wraps the app with theming (class strategy, `.dark` on html) and the search
 * dialog. Keyboard shortcuts are registered here so they work on every page.
 * The consumer puts `suppressHydrationWarning` on `<html>` because the theme
 * script sets the class before React hydrates.
 */
export function RootProviderClient({ children, defaultTheme = "system", themeHotKey = true, search, labels }: RootProviderClientProps) {
  const [open, setOpenState] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const enabled = search?.enabled ?? true;
  const indexUrl = search?.indexUrl ?? "/api/search";
  const searchKey = (search?.hotKey ?? "k").toLowerCase();

  const setOpen = useCallback(
    (next: boolean) => {
      const value = enabled && next;
      setOpenState(value);
      if (value) setEverOpened(true);
    },
    [enabled],
  );
  const toggleSearch = useCallback(() => {
    setOpenState((prev) => {
      const next = !prev;
      if (next) setEverOpened(true);
      return next;
    });
  }, []);

  const value = useMemo<SearchContextValue>(() => ({ enabled, indexUrl, open, setOpen }), [enabled, indexUrl, open, setOpen]);

  return (
    <ThemeProvider attribute="class" defaultTheme={defaultTheme} enableSystem disableTransitionOnChange>
      <LabelsProvider labels={labels}>
        <SearchContext.Provider value={value}>
          <Hotkeys searchEnabled={enabled} searchKey={searchKey} themeHotKey={themeHotKey} open={open} toggleSearch={toggleSearch} />
          {children}
          {enabled && everOpened ? (
            <Suspense fallback={null}>
              <SearchDialog />
            </Suspense>
          ) : null}
        </SearchContext.Provider>
      </LabelsProvider>
    </ThemeProvider>
  );
}
