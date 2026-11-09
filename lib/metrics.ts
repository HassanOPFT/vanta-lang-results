import type { CaseRow } from "@/lib/types";

export type MetricKey =
  | "wall_clock_seconds"
  | "turns"
  | "input_tokens"
  | "output_tokens"
  | "total_tokens";

export type MetricDef = {
  key: MetricKey;
  label: string;
  decimals: number;
  unit?: string;
  /** Higher is worse for %diff coloring (cost-like). */
  higherIsWorse: boolean;
};

export const METRICS: MetricDef[] = [
  {
    key: "wall_clock_seconds",
    label: "Wall clock (s)",
    decimals: 1,
    unit: "s",
    higherIsWorse: true,
  },
  { key: "turns", label: "Turns", decimals: 0, higherIsWorse: true },
  {
    key: "input_tokens",
    label: "Input tokens",
    decimals: 0,
    higherIsWorse: true,
  },
  {
    key: "output_tokens",
    label: "Output tokens",
    decimals: 0,
    higherIsWorse: true,
  },
  {
    key: "total_tokens",
    label: "Total tokens",
    decimals: 0,
    higherIsWorse: true,
  },
];

export const DEFAULT_METRIC: MetricKey = "wall_clock_seconds";

export function isMetricKey(
  value: string | null | undefined,
): value is MetricKey {
  return METRICS.some((m) => m.key === value);
}

export function metricDef(key: MetricKey): MetricDef {
  return METRICS.find((m) => m.key === key) ?? METRICS[0];
}

export function metricValue(row: CaseRow, key: MetricKey): number {
  switch (key) {
    case "wall_clock_seconds":
      return row.wallClockSeconds;
    case "turns":
      return row.turns;
    case "input_tokens":
      return row.inputTokens;
    case "output_tokens":
      return row.outputTokens;
    case "total_tokens":
      return row.inputTokens + row.outputTokens;
    default:
      return 0;
  }
}

export function formatMetric(
  value: number | null | undefined,
  key: MetricKey,
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const def = metricDef(key);
  if (
    key === "input_tokens" ||
    key === "output_tokens" ||
    key === "total_tokens"
  ) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
    return String(Math.round(value));
  }
  if (def.decimals === 0) return String(Math.round(value));
  return (
    Math.round(value * 10 ** def.decimals) /
    10 ** def.decimals
  ).toString();
}

/** (lang − baseline) / baseline * 100 */
export function pctDiff(
  value: number | null,
  baseline: number | null,
): number | null {
  if (
    value == null ||
    baseline == null ||
    !Number.isFinite(value) ||
    !Number.isFinite(baseline)
  ) {
    return null;
  }
  if (baseline === 0) return null;
  return Math.round(((value - baseline) / baseline) * 1000) / 10;
}
