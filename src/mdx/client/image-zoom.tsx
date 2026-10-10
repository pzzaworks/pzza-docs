"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";

export type ImageZoomProps = ComponentPropsWithoutRef<"img">;

/** Image that opens in a lightbox on click. Escape, the close button and clicking anywhere close it. */
export function ImageZoom({ className, alt, src, ...rest }: ImageZoomProps) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  const label = alt ?? "";
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="pd-image-zoom-trigger"
        onClick={() => setOpen(true)}
        aria-label={label ? `Zoom image: ${label}` : "Zoom image"}
      >
        <img className={["pd-img", className].filter(Boolean).join(" ")} alt={label} src={src} loading="lazy" {...rest} />
      </button>
      {open ? (
        <div className="pd-image-zoom-overlay" role="dialog" aria-modal="true" aria-label="Image" onClick={() => setOpen(false)}>
          <button ref={closeRef} type="button" className="pd-image-zoom-close" aria-label="Close image" onClick={() => setOpen(false)}>
            <X size={18} aria-hidden />
          </button>
          <img className="pd-image-zoom-full" src={src} alt={label} />
        </div>
      ) : null}
    </>
  );
}
