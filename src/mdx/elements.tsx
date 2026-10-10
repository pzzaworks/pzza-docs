import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { ImageZoom } from "./client/image-zoom.js";

export function Anchor({ href, children, className, ...rest }: ComponentPropsWithoutRef<"a">) {
  const classes = ["pd-link", className].filter(Boolean).join(" ");
  if (!href) {
    return (
      <a className={classes} {...rest}>
        {children}
      </a>
    );
  }
  const internal = href.startsWith("/") || href.startsWith("#");
  if (internal) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={classes} target="_blank" rel="noreferrer noopener" {...rest}>
      {children}
    </a>
  );
}

export function Table({ className, ...rest }: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="pd-table-wrapper">
      <table className={["pd-table", className].filter(Boolean).join(" ")} {...rest} />
    </div>
  );
}

/** Plain image without the lightbox, for callers that opt out of `ImageZoom`. */
export function Image({ className, alt, ...rest }: ComponentPropsWithoutRef<"img">) {
  return <img className={["pd-img", className].filter(Boolean).join(" ")} alt={alt ?? ""} loading="lazy" {...rest} />;
}

export { ImageZoom };
