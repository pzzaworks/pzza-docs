import type { MDXComponents } from "mdx/types";
import { Accordion, Accordions } from "./accordion.js";
import { Callout } from "./callout.js";
import { Card, Cards } from "./cards.js";
import { CodeTabs } from "./client/code-tabs.js";
import { ImageZoom } from "./client/image-zoom.js";
import { Tab, Tabs } from "./client/tabs.js";
import { CodeBlock, Pre } from "./code.js";
import { Anchor, Table } from "./elements.js";
import { File, Files, Folder } from "./files.js";
import { createHeading, Heading } from "./heading.js";
import { InlineTOC } from "./inline-toc.js";
import { Step, Steps } from "./steps.js";
import { TypeTable } from "./type-table.js";

export { Accordion, Accordions } from "./accordion.js";
export type { AccordionProps, AccordionsProps } from "./accordion.js";
export { Callout } from "./callout.js";
export type { CalloutProps, CalloutType } from "./callout.js";
export { Card, Cards } from "./cards.js";
export type { CardProps, CardsProps } from "./cards.js";
export { AnchorLink } from "./client/anchor.js";
export type { AnchorLinkProps } from "./client/anchor.js";
export { CodeTabs } from "./client/code-tabs.js";
export type { CodeTabsProps } from "./client/code-tabs.js";
export { ImageZoom } from "./client/image-zoom.js";
export type { ImageZoomProps } from "./client/image-zoom.js";
export { Tab, Tabs } from "./client/tabs.js";
export type { TabProps, TabsProps } from "./client/tabs.js";
export { CopyButton } from "./client/copy-button.js";
export type { CopyButtonProps } from "./client/copy-button.js";
export { CodeBlock, Pre } from "./code.js";
export type { CodeBlockProps } from "./code.js";
export { Anchor, Image, Table } from "./elements.js";
export { File, Files, Folder } from "./files.js";
export type { FileProps, FilesProps, FolderProps } from "./files.js";
export { createHeading, Heading } from "./heading.js";
export type { HeadingLevel, HeadingProps } from "./heading.js";
export { InlineTOC } from "./inline-toc.js";
export type { InlineTOCProps } from "./inline-toc.js";
export { Step, Steps } from "./steps.js";
export type { StepProps, StepsProps } from "./steps.js";
export { TypeTable } from "./type-table.js";
export type { TypeTableEntry, TypeTableProps } from "./type-table.js";

/**
 * Components mapped into every compiled page. Standard elements get the
 * framework styling and the custom components are available without imports.
 */
export const defaultMdxComponents: MDXComponents = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  a: Anchor,
  pre: Pre,
  table: Table,
  img: ImageZoom,
  Accordion,
  Accordions,
  Callout,
  Card,
  Cards,
  CodeBlock,
  CodeTabs,
  File,
  Files,
  Folder,
  Heading,
  ImageZoom,
  InlineTOC,
  Step,
  Steps,
  Tab,
  Tabs,
  TypeTable,
};
