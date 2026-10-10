"use client";

import { Children, useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

const STORAGE_PREFIX = "pd-code-tabs:";
const SYNC_EVENT = "pd-code-tabs-change";

interface SyncDetail {
  group: string;
  label: string;
}

function readPersisted(group: string): string | undefined {
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + group) ?? undefined;
  } catch {
    return undefined;
  }
}

function writePersisted(group: string, label: string): void {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + group, label);
  } catch {
    // Storage can be unavailable (private mode, blocked). The tab still switches in memory.
  }
}

function parseItems(items: string | string[]): string[] {
  if (Array.isArray(items)) return items;
  try {
    const parsed: unknown = JSON.parse(items);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // Not JSON: treat the string as a single label.
  }
  return [items];
}

export interface CodeTabsProps {
  /** Tab labels in child order; accepts the JSON string emitted by the rehype step. */
  items: string | string[];
  /** When set, the choice is persisted and every CodeTabs with the same group switches together. */
  group?: string;
  defaultIndex?: number;
  /** One code block per label. */
  children: ReactNode;
  className?: string;
}

export function CodeTabs({ items, group, defaultIndex = 0, children, className }: CodeTabsProps) {
  const labels = useMemo(() => parseItems(items), [items]);
  const panels = Children.toArray(children);
  const baseId = useId();
  const [active, setActiveState] = useState(() => Math.min(Math.max(defaultIndex, 0), Math.max(labels.length - 1, 0)));
  const listRef = useRef<HTMLDivElement>(null);

  // Restore the persisted choice after hydration and follow sibling groups.
  useEffect(() => {
    if (!group) return;
    const apply = (label: string) => {
      const index = labels.indexOf(label);
      if (index >= 0) setActiveState(index);
    };
    const stored = readPersisted(group);
    if (stored) apply(stored);
    const onSync = (event: Event) => {
      const detail = (event as CustomEvent<SyncDetail>).detail;
      if (detail.group === group) apply(detail.label);
    };
    window.addEventListener(SYNC_EVENT, onSync);
    return () => window.removeEventListener(SYNC_EVENT, onSync);
  }, [group, labels]);

  const setActive = useCallback(
    (index: number) => {
      setActiveState(index);
      const label = labels[index];
      if (!group || label === undefined) return;
      writePersisted(group, label);
      window.dispatchEvent(new CustomEvent<SyncDetail>(SYNC_EVENT, { detail: { group, label } }));
    },
    [group, labels],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const count = labels.length;
    if (count === 0) return;
    let next = active;
    if (event.key === "ArrowRight") next = (active + 1) % count;
    else if (event.key === "ArrowLeft") next = (active - 1 + count) % count;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = count - 1;
    else return;
    event.preventDefault();
    setActive(next);
    listRef.current?.querySelector<HTMLButtonElement>(`[data-index="${next}"]`)?.focus();
  };

  return (
    <div className={["pd-code-tabs", className].filter(Boolean).join(" ")} data-group={group}>
      <div ref={listRef} role="tablist" className="pd-code-tabs-list" onKeyDown={onKeyDown}>
        {labels.map((label, index) => (
          <button
            key={`${label}-${index}`}
            type="button"
            role="tab"
            id={`${baseId}-tab-${index}`}
            aria-selected={index === active}
            aria-controls={`${baseId}-panel-${index}`}
            tabIndex={index === active ? 0 : -1}
            data-index={index}
            data-state={index === active ? "active" : "inactive"}
            className="pd-code-tab-trigger"
            onClick={() => setActive(index)}
          >
            {label}
          </button>
        ))}
      </div>
      {panels.map((panel, index) => (
        <div
          key={index}
          role="tabpanel"
          id={`${baseId}-panel-${index}`}
          aria-labelledby={`${baseId}-tab-${index}`}
          hidden={index !== active}
          className="pd-code-tab-panel"
        >
          {panel}
        </div>
      ))}
    </div>
  );
}
