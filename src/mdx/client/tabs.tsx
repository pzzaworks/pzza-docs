"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

interface TabsContextValue {
  items: string[];
  active: string;
  setActive: (value: string) => void;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

const STORAGE_PREFIX = "pd-tabs:";

function readPersisted(key: string): string | undefined {
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + key) ?? undefined;
  } catch {
    return undefined;
  }
}

function writePersisted(key: string, value: string): void {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, value);
  } catch {
    // Storage can be unavailable (private mode, blocked). The tab still switches in memory.
  }
}

export interface TabsProps {
  /** Tab labels, in order. Each `<Tab value>` must match one of these. */
  items: string[];
  /** Index of the initially selected tab. Defaults to 0. */
  defaultIndex?: number;
  /** When set, the selected tab is remembered in localStorage and shared by every Tabs with the same key. */
  persist?: string;
  children: ReactNode;
  className?: string;
}

export function Tabs({ items, defaultIndex = 0, persist, children, className }: TabsProps) {
  const baseId = useId();
  const fallback = items[defaultIndex] ?? items[0] ?? "";
  const [active, setActiveState] = useState(fallback);
  const listRef = useRef<HTMLDivElement>(null);

  // Restore a persisted choice after hydration so server and client markup match.
  useEffect(() => {
    if (!persist) return;
    const stored = readPersisted(persist);
    if (stored && items.includes(stored)) setActiveState(stored);
  }, [persist, items]);

  const setActive = useCallback(
    (value: string) => {
      setActiveState(value);
      if (persist) writePersisted(persist, value);
    },
    [persist],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = items.indexOf(active);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % items.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;
    event.preventDefault();
    const value = items[next];
    if (value === undefined) return;
    setActive(value);
    const button = listRef.current?.querySelector<HTMLButtonElement>(`[data-value="${CSS.escape(value)}"]`);
    button?.focus();
  };

  const value = useMemo<TabsContextValue>(() => ({ items, active, setActive, baseId }), [items, active, setActive, baseId]);

  return (
    <TabsContext.Provider value={value}>
      <div className={["pd-tabs", className].filter(Boolean).join(" ")}>
        <div ref={listRef} role="tablist" className="pd-tabs-list" onKeyDown={onKeyDown}>
          {items.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              id={`${baseId}-tab-${items.indexOf(item)}`}
              aria-selected={item === active}
              aria-controls={`${baseId}-panel-${items.indexOf(item)}`}
              tabIndex={item === active ? 0 : -1}
              data-value={item}
              data-state={item === active ? "active" : "inactive"}
              className="pd-tab-trigger"
              onClick={() => setActive(item)}
            >
              {item}
            </button>
          ))}
        </div>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabProps {
  /** Must match one of the parent `items`. */
  value: string;
  children: ReactNode;
  className?: string;
}

export function Tab({ value, children, className }: TabProps) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("<Tab> must be rendered inside <Tabs>");
  const index = ctx.items.indexOf(value);
  const selected = ctx.active === value;
  return (
    <div
      role="tabpanel"
      id={`${ctx.baseId}-panel-${index}`}
      aria-labelledby={`${ctx.baseId}-tab-${index}`}
      hidden={!selected}
      className={["pd-tab-panel", className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}
