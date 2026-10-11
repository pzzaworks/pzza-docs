"use client";

import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useLabels } from "./labels.js";
import { useSearch } from "./root-provider.js";

/** Header button that opens the search dialog. Shows the platform shortcut once mounted. */
export function SearchTrigger() {
  const { enabled, setOpen } = useSearch();
  const labels = useLabels();
  const [mac, setMac] = useState(true);

  useEffect(() => {
    setMac(/mac|iphone|ipad/i.test(navigator.platform));
  }, []);

  if (!enabled) return null;
  return (
    <button type="button" className="pd-search-trigger" onClick={() => setOpen(true)} aria-label={labels.search}>
      <SearchIcon size={16} aria-hidden />
      <span className="pd-search-trigger-text">{labels.searchShort}</span>
      <kbd className="pd-kbd">{mac ? "⌘" : "Ctrl"}K</kbd>
    </button>
  );
}
