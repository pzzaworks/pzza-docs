import Link from "next/link";
import type { ReactNode } from "react";

export interface CardsProps {
  children: ReactNode;
  className?: string;
}

/** Responsive grid: one column on mobile, two from 768px. */
export function Cards({ children, className }: CardsProps) {
  return <div className={["pd-cards", className].filter(Boolean).join(" ")}>{children}</div>;
}

export interface CardProps {
  title: ReactNode;
  description?: ReactNode;
  /** Renders the card as a link when provided. */
  href?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Card({ title, description, href, icon, children, className }: CardProps) {
  const classes = ["pd-card", className].filter(Boolean).join(" ");
  const body = (
    <>
      <div className="pd-card-head">
        {icon ? <span className="pd-card-icon">{icon}</span> : null}
        <h3 className="pd-card-title">{title}</h3>
      </div>
      {description ? <p className="pd-card-description">{description}</p> : null}
      {children ? <div className="pd-card-content">{children}</div> : null}
    </>
  );

  if (!href) return <div className={classes}>{body}</div>;

  const external = /^https?:\/\//.test(href);
  if (external) {
    return (
      <a className={classes} href={href} target="_blank" rel="noreferrer noopener">
        {body}
      </a>
    );
  }
  return (
    <Link className={classes} href={href}>
      {body}
    </Link>
  );
}
