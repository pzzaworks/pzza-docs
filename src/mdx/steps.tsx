import type { ReactNode } from "react";

export interface StepsProps {
  children: ReactNode;
  className?: string;
}

/** Numbered vertical list with a left rail. Each child should be a `<Step>`. */
export function Steps({ children, className }: StepsProps) {
  return <div className={["pd-steps", className].filter(Boolean).join(" ")}>{children}</div>;
}

export interface StepProps {
  children: ReactNode;
  className?: string;
}

export function Step({ children, className }: StepProps) {
  return <div className={["pd-step", className].filter(Boolean).join(" ")}>{children}</div>;
}
