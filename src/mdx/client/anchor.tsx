"use client";

import { useEffect, useState } from "react";

export interface AnchorLinkProps {
  id: string;
}

/** Heading anchor: a normal hash link that also copies the absolute URL to the clipboard. */
export function AnchorLink({ id }: AnchorLinkProps) {
  const [announce, setAnnounce] = useState("");

  useEffect(() => {
    if (!announce) return;
    const timer = window.setTimeout(() => setAnnounce(""), 1500);
    return () => window.clearTimeout(timer);
  }, [announce]);

  const copy = (): void => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => setAnnounce("Copied anchor link"))
      .catch(() => setAnnounce(""));
  };

  return (
    <a href={`#${id}`} className="pd-anchor" aria-label="Link to this section" onClick={copy}>
      #
      <span className="pd-visually-hidden" aria-live="polite">
        {announce}
      </span>
    </a>
  );
}
