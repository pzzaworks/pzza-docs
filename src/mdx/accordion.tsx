import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export interface AccordionsProps {
  children: ReactNode;
  className?: string;
}

export function Accordions({ children, className }: AccordionsProps) {
  return <div className={["pd-accordions", className].filter(Boolean).join(" ")}>{children}</div>;
}

export interface AccordionProps {
  title: ReactNode;
  children: ReactNode;
  /** Expanded on first render. */
  defaultOpen?: boolean;
  className?: string;
}

/** Native details/summary so it works without JavaScript and stays keyboard accessible. */
export function Accordion({ title, children, defaultOpen, className }: AccordionProps) {
  return (
    <details className={["pd-accordion", className].filter(Boolean).join(" ")} open={defaultOpen}>
      <summary className="pd-accordion-trigger">
        <ChevronRight className="pd-accordion-chevron" size={16} aria-hidden />
        <span>{title}</span>
      </summary>
      <div className="pd-accordion-content">{children}</div>
    </details>
  );
}
