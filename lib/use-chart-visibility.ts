"use client";

import { useCallback, useEffect, useState } from "react";

import type { ChartId } from "@/lib/insights";

export function useChartVisibility(
  storageKey: string,
  defaults: ChartId[],
): {
  visible: Set<ChartId>;
  toggle: (id: ChartId) => void;
  showAll: () => void;
  hideAll: () => void;
  ready: boolean;
} {
  const [visible, setVisible] = useState<Set<ChartId>>(() => new Set(defaults));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as ChartId[];
        if (Array.isArray(parsed) && parsed.length) {
          setVisible(new Set(parsed));
        }
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(storageKey, JSON.stringify(Array.from(visible)));
  }, [ready, storageKey, visible]);

  const toggle = useCallback((id: ChartId) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const showAll = useCallback(() => setVisible(new Set(defaults)), [defaults]);
  const hideAll = useCallback(() => setVisible(new Set()), []);

  return { visible, toggle, showAll, hideAll, ready };
}
