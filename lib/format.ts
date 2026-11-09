export function formatSeconds(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value >= 100) return `${Math.round(value)}s`;
  return `${Math.round(value * 10) / 10}s`;
}

export function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

export function formatPercent(value: number): string {
  return `${value}%`;
}

export function shortCaseId(caseId: string): string {
  return caseId.replace(/^case_/, "").replace(/_/g, " ");
}

/** Stable palette for N selected languages (not purple-heavy). */
export const LANG_COLORS = [
  "#0f766e",
  "#c2410c",
  "#1d4ed8",
  "#a16207",
  "#be123c",
  "#047857",
  "#7c2d12",
  "#0369a1",
  "#4d7c0f",
  "#9f1239",
];

export function colorForIndex(index: number): string {
  return LANG_COLORS[index % LANG_COLORS.length];
}
