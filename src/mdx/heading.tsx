import type { ComponentPropsWithoutRef } from "react";
import { AnchorLink } from "./client/anchor.js";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type HeadingProps = ComponentPropsWithoutRef<"h1"> & {
  /** Defaults to 2. */
  as?: HeadingLevel;
};

/** Heading with a hover anchor link when it has an id (assigned by rehype-slug). Clicking the anchor copies the URL. */
export function Heading({ as = 2, id, className, children, ...rest }: HeadingProps) {
  const Tag = `h${as}` as const;
  return (
    <Tag id={id} className={["pd-heading", className].filter(Boolean).join(" ")} {...rest}>
      {children}
      {id ? <AnchorLink id={id} /> : null}
    </Tag>
  );
}

export function createHeading(level: HeadingLevel) {
  const Component = (props: Omit<HeadingProps, "as">) => <Heading as={level} {...props} />;
  Component.displayName = `Heading${level}`;
  return Component;
}
