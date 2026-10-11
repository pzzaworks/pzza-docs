"use client";

import { FileText, Hash, SearchIcon, Text } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { SearchPageRecord, SearchRecord } from "../../types.js";
import { fillLabel } from "../../labels.js";
import { useLabels } from "./labels.js";
import { useSearch } from "./root-provider.js";

interface Hit {
  id: string;
  url: string;
  type: "heading" | "text";
  content: string;
  score: number;
}

interface Group {
  pageUrl: string;
  title: string;
  breadcrumbs: string[];
  /** Score of the page title itself, 0 when only children matched. */
  pageScore: number;
  score: number;
  hits: Hit[];
}

/** One keyboard-selectable row: a group header or one of its hits. */
interface Option {
  id: string;
  url: string;
  kind: "page" | "heading" | "text";
  label: string;
  context?: string;
}

const MAX_GROUPS = 8;
const MAX_HITS = 5;
const SNIPPET_LENGTH = 120;

function scoreText(text: string | undefined, query: string, words: string[]): number {
  if (!text) return 0;
  const value = text.toLowerCase();
  if (value === query) return 10;
  if (value.startsWith(query)) return 6;
  if (value.includes(query)) return 3;
  if (words.length > 1 && words.every((w) => value.includes(w))) return 2;
  return 0;
}

function searchRecords(records: SearchRecord[], rawQuery: string): Group[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];
  const words = query.split(/\s+/).filter(Boolean);
  const pages = new Map<string, SearchPageRecord>();
  for (const record of records) {
    if (record.type === "page") pages.set(record.pageUrl, record);
  }
  const groups = new Map<string, Group>();
  const groupFor = (record: SearchRecord): Group => {
    let group = groups.get(record.pageUrl);
    if (group) return group;
    const page = pages.get(record.pageUrl);
    const title = page?.title ?? (record.type === "page" ? record.title : record.pageTitle);
    group = { pageUrl: record.pageUrl, title, breadcrumbs: record.breadcrumbs, pageScore: 0, score: 0, hits: [] };
    groups.set(record.pageUrl, group);
    return group;
  };

  for (const record of records) {
    if (record.type === "page") {
      const score = scoreText(record.title, query, words) * 100 + scoreText(record.description, query, words) * 5;
      if (score === 0) continue;
      const group = groupFor(record);
      group.pageScore = score;
      group.score = Math.max(group.score, score);
      continue;
    }
    const base = record.type === "heading" ? 40 : 10;
    const score = scoreText(record.content, query, words) * base;
    if (score === 0) continue;
    const group = groupFor(record);
    group.hits.push({ id: record.id, url: record.url, type: record.type, content: record.content, score });
    group.score = Math.max(group.score, score);
  }

  return [...groups.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_GROUPS)
    .map((group) => ({ ...group, hits: group.hits.sort((a, b) => b.score - a.score).slice(0, MAX_HITS) }));
}

function matchRange(text: string, query: string): [number, number] | undefined {
  const lower = text.toLowerCase();
  const full = lower.indexOf(query);
  if (full !== -1) return [full, full + query.length];
  for (const word of query.split(/\s+/).filter(Boolean)) {
    const at = lower.indexOf(word);
    if (at !== -1) return [at, at + word.length];
  }
  return undefined;
}

/** Shortens `text` around the match and wraps the match in `<mark>`. */
function highlight(text: string, query: string, truncate: boolean): ReactNode {
  const range = matchRange(text, query);
  let value = text;
  let offset = 0;
  if (truncate && text.length > SNIPPET_LENGTH) {
    const anchor = range ? range[0] : 0;
    const start = Math.max(0, Math.min(anchor - 30, text.length - SNIPPET_LENGTH));
    const end = Math.min(text.length, start + SNIPPET_LENGTH);
    value = `${start > 0 ? "..." : ""}${text.slice(start, end)}${end < text.length ? "..." : ""}`;
    offset = start - (start > 0 ? 3 : 0);
  }
  if (!range) return value;
  const from = range[0] - offset;
  const to = range[1] - offset;
  if (from < 0 || to > value.length) return value;
  return (
    <>
      {value.slice(0, from)}
      <mark className="pd-search-mark">{value.slice(from, to)}</mark>
      {value.slice(to)}
    </>
  );
}

function flatten(groups: Group[]): Option[] {
  const options: Option[] = [];
  for (const group of groups) {
    options.push({
      id: `page:${group.pageUrl}`,
      url: group.pageUrl,
      kind: "page",
      label: group.title,
      context: group.breadcrumbs.join(" / "),
    });
    for (const hit of group.hits) options.push({ id: hit.id, url: hit.url, kind: hit.type, label: hit.content });
  }
  return options;
}

function optionDomId(index: number): string {
  return `pd-search-option-${index}`;
}

/** Command-palette style dialog. Rendered lazily by `RootProvider`; open it with `useSearch().setOpen(true)` or the hotkey. */
export function Search() {
  const labels = useLabels();
  const { open, setOpen, indexUrl } = useSearch();
  const router = useRouter();
  const pathname = usePathname();
  const [records, setRecords] = useState<SearchRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // The index is fetched once, on first open.
  useEffect(() => {
    if (!open || records !== null) return;
    let cancelled = false;
    fetch(indexUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Search index request failed with ${res.status}`);
        return res.json() as Promise<SearchRecord[]>;
      })
      .then((data) => {
        if (!cancelled) setRecords(Array.isArray(data) ? data : []);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : labels.searchError);
      });
    return () => {
      cancelled = true;
    };
  }, [open, records, indexUrl]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelected(0);
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Close after navigation. The dialog mounts lazily on first open, so the
  // effect must ignore its own mount and only react to a real path change.
  const lastPathname = useRef(pathname);
  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    setOpen(false);
  }, [pathname, setOpen]);

  const groups = useMemo(() => (records ? searchRecords(records, deferredQuery) : []), [records, deferredQuery]);
  const options = useMemo(() => flatten(groups), [groups]);
  const stale = deferredQuery !== query;

  useEffect(() => {
    setSelected(0);
  }, [options]);

  useEffect(() => {
    const list = listRef.current;
    const item = list?.querySelector<HTMLElement>(`[data-index="${selected}"]`);
    if (!list || !item) return;
    const listRect = list.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const top = itemRect.top - listRect.top + list.scrollTop;
    const bottom = top + itemRect.height;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }, [selected]);

  if (!open) return null;

  const go = (option: Option | undefined) => {
    if (!option) return;
    setOpen(false);
    router.push(option.url);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const count = options.length;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (count > 0) setSelected((s) => (s + 1) % count);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (count > 0) setSelected((s) => (s - 1 + count) % count);
    } else if (event.key === "Home" && count > 0) {
      event.preventDefault();
      setSelected(0);
    } else if (event.key === "End" && count > 0) {
      event.preventDefault();
      setSelected(count - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(options[selected]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  };

  const trimmed = deferredQuery.trim();
  let status: string | null = null;
  if (error) status = error;
  else if (records === null) status = labels.searchLoading;
  else if (trimmed !== "" && options.length === 0 && !stale) status = fillLabel(labels.searchNoResults, { query: trimmed });

  // Options are numbered globally across groups so aria-activedescendant and the data-index lookup stay simple.
  const offsets: number[] = [];
  groups.reduce((acc, group) => {
    offsets.push(acc);
    return acc + 1 + group.hits.length;
  }, 0);
  const needle = trimmed.toLowerCase();

  return (
    <div className="pd-search-overlay" onClick={() => setOpen(false)} role="presentation">
      <div
        className="pd-search-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={labels.searchDialog}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pd-search-input-row">
          <SearchIcon size={16} className="pd-search-input-icon" aria-hidden />
          <input
            ref={inputRef}
            className="pd-search-input"
            type="search"
            placeholder={labels.searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-expanded={options.length > 0}
            aria-controls="pd-search-results"
            aria-autocomplete="list"
            aria-activedescendant={options[selected] ? optionDomId(selected) : undefined}
          />
          <kbd className="pd-kbd">Esc</kbd>
        </div>
        <p className="pd-search-empty" role="status" aria-live="polite">
          {status}
        </p>
        <ul
          id="pd-search-results"
          ref={listRef}
          className="pd-search-results"
          role="listbox"
          aria-label={labels.searchResults}
          data-stale={stale ? "" : undefined}
        >
          {groups.map((group, gi) => {
            const start = offsets[gi] ?? 0;
            const row = (i: number, kind: Option["kind"], children: ReactNode, extraClass: string) => (
              <li
                id={optionDomId(i)}
                role="option"
                aria-selected={i === selected}
                data-index={i}
                data-selected={i === selected ? "" : undefined}
                data-kind={kind}
                className={`pd-search-item ${extraClass}`}
                onMouseEnter={() => setSelected(i)}
                onClick={() => go(options[i])}
              >
                {children}
              </li>
            );
            return (
              <li key={group.pageUrl} className="pd-search-group" role="presentation">
                <ul role="group" aria-label={group.title}>
                  {row(
                    start,
                    "page",
                    <>
                      <FileText size={16} aria-hidden />
                      <span className="pd-search-item-text">
                        <span className="pd-search-item-title">{highlight(group.title, needle, false)}</span>
                        {group.breadcrumbs.length > 0 ? <span className="pd-search-item-context">{group.breadcrumbs.join(" / ")}</span> : null}
                      </span>
                    </>,
                    "pd-search-group-title",
                  )}
                  {group.hits.map((hit, hi) => (
                    <Fragment key={hit.id}>
                      {row(
                        start + 1 + hi,
                        hit.type,
                        <>
                          {hit.type === "heading" ? <Hash size={14} aria-hidden /> : <Text size={14} aria-hidden />}
                          <span className="pd-search-item-text">
                            <span className="pd-search-item-title">{highlight(hit.content, needle, hit.type === "text")}</span>
                          </span>
                        </>,
                        "pd-search-hit",
                      )}
                    </Fragment>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
