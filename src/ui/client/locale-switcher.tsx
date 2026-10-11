"use client";

import { Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useLabels } from "./labels.js";

export interface LocaleOption {
  /** Locale code, for example "de" or "pt-BR". */
  code: string;
  /** Native display name shown in the menu. */
  label: string;
  /** Short text shown on the trigger. Defaults to the upper-cased code. */
  short?: string;
  /** Flag or other mark rendered before the label. */
  icon?: ReactNode;
  /** Destination of this locale's version of the current page. Omit to handle the change in `onSelect` instead. */
  href?: string;
}

export interface LocaleSwitcherProps {
  locales: LocaleOption[];
  /** Code of the active locale. */
  current: string;
  /** Called with the chosen code. Use it with routing libraries that switch locales programmatically. */
  onSelect?: (code: string) => void;
  className?: string;
}

/**
 * Header menu for changing the language. Styled like the page actions menu;
 * each entry is a link when `href` is given, otherwise a button that calls
 * `onSelect`. Put it in the `headerEnd` slot of `DocsLayout`.
 */
export function LocaleSwitcher({ locales, current, onSelect, className }: LocaleSwitcherProps) {
  const labels = useLabels();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const active = locales.find((locale) => locale.code === current) ?? locales[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    const frame = window.requestAnimationFrame(() => menuRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus());
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.cancelAnimationFrame(frame);
    };
  }, [open]);

  const choose = (code: string) => {
    setOpen(false);
    buttonRef.current?.focus();
    if (code !== current) onSelect?.(code);
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])];
    const index = items.indexOf(document.activeElement as HTMLElement);
    const focusAt = (i: number): void => items[(i + items.length) % items.length]?.focus();
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusAt(index + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusAt(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusAt(0);
        break;
      case "End":
        event.preventDefault();
        focusAt(items.length - 1);
        break;
      case "Escape":
      case "Tab":
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        break;
      default:
        break;
    }
  };

  if (!active) return null;

  return (
    <div ref={rootRef} className={["pd-locale-switcher", className].filter(Boolean).join(" ")}>
      <button
        ref={buttonRef}
        type="button"
        className="pd-locale-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={labels.selectLanguage}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {active.icon ? <span className="pd-locale-icon">{active.icon}</span> : null}
        <span className="pd-locale-short">{active.short ?? active.code.toUpperCase()}</span>
        <ChevronDown size={14} className="pd-locale-chevron" aria-hidden />
      </button>
      {open ? (
        <div id={menuId} ref={menuRef} className="pd-page-actions-menu pd-locale-menu" role="menu" aria-label={labels.selectLanguage} onKeyDown={onMenuKeyDown}>
          {locales.map((locale) => {
            const isActive = locale.code === current;
            const body = (
              <>
                {locale.icon ? <span className="pd-page-actions-item-icon pd-locale-icon">{locale.icon}</span> : null}
                <span className="pd-page-actions-item-label">{locale.label}</span>
                {isActive ? <Check size={14} className="pd-locale-check" aria-hidden /> : null}
              </>
            );
            const shared = { role: "menuitemradio", "aria-checked": isActive, className: "pd-page-actions-item pd-locale-item", lang: locale.code } as const;
            return locale.href ? (
              <Link key={locale.code} href={locale.href} hrefLang={locale.code} onClick={() => choose(locale.code)} {...shared}>
                {body}
              </Link>
            ) : (
              <button key={locale.code} type="button" onClick={() => choose(locale.code)} {...shared}>
                {body}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
