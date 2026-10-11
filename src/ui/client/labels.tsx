"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_LABELS } from "../../labels.js";
import type { UiLabels } from "../../types.js";

const LabelsContext = createContext<UiLabels>(DEFAULT_LABELS);

export interface LabelsProviderProps {
  /** Overrides merged over the English defaults. */
  labels?: Partial<UiLabels>;
  children: ReactNode;
}

export function LabelsProvider({ labels, children }: LabelsProviderProps) {
  const value = useMemo<UiLabels>(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);
  return <LabelsContext.Provider value={value}>{children}</LabelsContext.Provider>;
}

/** The UI strings for the current locale. Outside a provider the English defaults are returned. */
export function useLabels(): UiLabels {
  return useContext(LabelsContext);
}
