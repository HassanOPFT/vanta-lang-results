"use client";

import { Button } from "@heroui/react";

import type { ChartId } from "@/lib/insights";

type ChartTogglesProps = {
  options: { id: ChartId; label: string }[];
  visible: Set<ChartId>;
  onToggle: (id: ChartId) => void;
  onShowAll: () => void;
  onHideAll: () => void;
};

export function ChartToggles({
  options,
  visible,
  onToggle,
  onShowAll,
  onHideAll,
}: ChartTogglesProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Charts
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {options.map((opt) => {
          const on = visible.has(opt.id);
          return (
            <Button
              key={opt.id}
              size="sm"
              variant={on ? "primary" : "secondary"}
              onPress={() => onToggle(opt.id)}
            >
              {opt.label}
            </Button>
          );
        })}
        <Button size="sm" variant="ghost" onPress={onShowAll}>
          All
        </Button>
        <Button size="sm" variant="ghost" onPress={onHideAll}>
          None
        </Button>
      </div>
    </div>
  );
}
