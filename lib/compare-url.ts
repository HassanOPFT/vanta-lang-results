import type { ChartId } from "@/lib/insights";
import { DEFAULT_METRIC, isMetricKey, type MetricKey } from "@/lib/metrics";

export const DEFAULT_COMPARE_CHARTS: ChartId[] = [
  "perCase",
  "pctDiff",
  "totals",
  "scatter",
  "heatmap",
  "statsTable",
];

export type CompareUrlState = {
  langs: string[];
  base: string;
  metric: MetricKey;
  charts: ChartId[];
};

const CHART_IDS = new Set<string>([
  "passRate",
  "meanWall",
  "caseWalls",
  "caseDifficulty",
  "deltaTable",
  "matrix",
  "heatmap",
  "histogram",
  "boxplot",
  "scatter",
  "radar",
  "statsTable",
  "perCase",
  "pctDiff",
  "totals",
]);

export function isChartId(value: string): value is ChartId {
  return CHART_IDS.has(value);
}

export function parseCompareSearchParams(
  params: URLSearchParams,
  catalogConditions: string[],
): CompareUrlState {
  const catalog = new Set(catalogConditions);

  const langsRaw = (params.get("langs") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((c) => catalog.has(c));

  const langs =
    langsRaw.length > 0
      ? Array.from(new Set(langsRaw))
      : catalogConditions.slice(0, Math.min(4, catalogConditions.length));

  const baseParam = params.get("base") ?? "";
  const base = langs.includes(baseParam)
    ? baseParam
    : langs.includes("english")
      ? "english"
      : (langs[0] ?? "");

  const metricParam = params.get("metric");
  const metric = isMetricKey(metricParam) ? metricParam : DEFAULT_METRIC;

  const chartsRaw = (params.get("charts") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(isChartId);
  const charts = chartsRaw.length
    ? Array.from(new Set(chartsRaw))
    : [...DEFAULT_COMPARE_CHARTS];

  return { langs, base, metric, charts };
}

export function toCompareSearchParams(state: CompareUrlState): string {
  const sp = new URLSearchParams();
  if (state.langs.length) sp.set("langs", state.langs.join(","));
  if (state.base) sp.set("base", state.base);
  if (state.metric) sp.set("metric", state.metric);
  if (state.charts.length) sp.set("charts", state.charts.join(","));
  return sp.toString();
}
