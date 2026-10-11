"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLabels } from "./labels.js";

export interface MobileNavProps {
  /** Drawer contents, typically the sidebar. */
  children: ReactNode;
  /** Brand element shown in the drawer top bar, the same logo as the header. */
  brand?: ReactNode;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
}

/**
 * Hamburger button plus an overlay drawer shown below 768px. Closes on
 * navigation, Escape and overlay click; traps focus and marks the rest of the
 * layout inert while open.
 */
export function MobileNav({ children, brand }: MobileNavProps) {
  const labels = useLabels();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const drawer = drawerRef.current;
    const trigger = triggerRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawer) return;
      const items = focusables(drawer);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === first || !drawer.contains(current))) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (current === last || !drawer.contains(current))) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Everything outside the header is inert so screen readers and Tab stay in the drawer.
    const inerted = [...document.querySelectorAll<HTMLElement>(".pd-layout-body")].filter((el) => !el.hasAttribute("inert"));
    inerted.forEach((el) => el.toggleAttribute("inert", true));

    const frame = window.requestAnimationFrame(() => {
      (closeRef.current ?? drawer)?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      inerted.forEach((el) => el.toggleAttribute("inert", false));
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="pd-icon-button pd-mobile-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? labels.closeNavigation : labels.openNavigation}
        aria-expanded={open}
        aria-controls="pd-mobile-drawer"
      >
        {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
      </button>
      {open ? (
        <div className="pd-mobile-overlay" onClick={() => setOpen(false)} role="presentation">
          <div
            id="pd-mobile-drawer"
            ref={drawerRef}
            className="pd-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={labels.navigation}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pd-mobile-drawer-bar">
              {brand}
              <button ref={closeRef} type="button" className="pd-mobile-drawer-close" onClick={() => setOpen(false)} aria-label={labels.closeNavigation}>
                <X size={16} aria-hidden />
              </button>
            </div>
            <div className="pd-mobile-drawer-body">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
