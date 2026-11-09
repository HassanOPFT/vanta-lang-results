import type { CaseRow, LanguageDetail } from "@/lib/types";

export type NumericSummary = {
  n: number;
  mean: number;
  median: number;
  stdev: number;
  min: number;
  max: number;
  p25: number;
  p75: number;
  p90: number;
};

export type LangNumericProfile = {
  condition: string;
  display: string;
  passRate: number;
  honestPass: number;
  honestFail: number;
  cases: number;
  wallAll: NumericSummary;
  wallPass: NumericSummary;
  turns: NumericSummary;
  inputTokens: NumericSummary;
  outputTokens: NumericSummary;
};

function sorted(values: number[]): number[] {
  return [...values].filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
}

function quantile(sortedVals: number[], q: number): number {
  if (!sortedVals.length) return 0;
  if (sortedVals.length === 1) return sortedVals[0];
  const pos = (sortedVals.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sortedVals[base + 1];
  if (next === undefined) return sortedVals[base];
  return sortedVals[base] + rest * (next - sortedVals[base]);
}

export function summarize(values: number[]): NumericSummary {
  const vals = sorted(values);
  const n = vals.length;
  if (!n) {
    return {
      n: 0,
      mean: 0,
      median: 0,
      stdev: 0,
      min: 0,
      max: 0,
      p25: 0,
      p75: 0,
      p90: 0,
    };
  }
  const mean = vals.reduce((a, b) => a + b, 0) / n;
  const variance =
    n > 1 ? vals.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1) : 0;
  return {
    n,
    mean: round(mean),
    median: round(quantile(vals, 0.5)),
    stdev: round(Math.sqrt(variance)),
    min: round(vals[0]),
    max: round(vals[n - 1]),
    p25: round(quantile(vals, 0.25)),
    p75: round(quantile(vals, 0.75)),
    p90: round(quantile(vals, 0.9)),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function profileLanguage(lang: LanguageDetail): LangNumericProfile {
  const walls = lang.rows.map((r) => r.wallClockSeconds);
  const wallsPass = lang.rows
    .filter((r) => r.success)
    .map((r) => r.wallClockSeconds);
  return {
    condition: lang.condition,
    display: lang.display,
    passRate: lang.passRate,
    honestPass: lang.honestPass,
    honestFail: lang.honestFail,
    cases: lang.cases,
    wallAll: summarize(walls),
    wallPass: summarize(wallsPass),
    turns: summarize(lang.rows.map((r) => r.turns)),
    inputTokens: summarize(lang.rows.map((r) => r.inputTokens)),
    outputTokens: summarize(lang.rows.map((r) => r.outputTokens)),
  };
}

export function profileLanguages(
  languages: LanguageDetail[],
): LangNumericProfile[] {
  return languages.map(profileLanguage);
}

export type ScatterPoint = {
  lang: string;
  condition: string;
  caseId: string;
  wall: number;
  inputTokens: number;
  turns: number;
  success: boolean;
};

export function scatterPoints(languages: LanguageDetail[]): ScatterPoint[] {
  return languages.flatMap((l) =>
    l.rows.map((r) => ({
      lang: l.display,
      condition: l.condition,
      caseId: r.caseId,
      wall: round(r.wallClockSeconds),
      inputTokens: r.inputTokens,
      turns: r.turns,
      success: r.success,
    })),
  );
}

export type HistBin = {
  bin: string;
  mid: number;
  [lang: string]: string | number;
};

/** Shared wall-time histogram bins across languages. */
export function wallHistogram(
  languages: LanguageDetail[],
  binCount = 8,
): HistBin[] {
  const all = languages.flatMap((l) => l.rows.map((r) => r.wallClockSeconds));
  if (!all.length) return [];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const width = max === min ? 1 : (max - min) / binCount;
  const bins: HistBin[] = Array.from({ length: binCount }, (_, i) => {
    const lo = min + i * width;
    const hi = lo + width;
    return {
      bin: `${Math.round(lo)}–${Math.round(hi)}s`,
      mid: round(lo + width / 2),
    };
  });

  for (const lang of languages) {
    for (const bin of bins) {
      bin[lang.display] = 0;
    }
    for (const row of lang.rows) {
      let idx = Math.floor((row.wallClockSeconds - min) / width);
      if (idx >= binCount) idx = binCount - 1;
      if (idx < 0) idx = 0;
      const key = lang.display;
      bins[idx][key] = Number(bins[idx][key] ?? 0) + 1;
    }
  }
  return bins;
}

export type HeatCell = {
  caseId: string;
  condition: string;
  display: string;
  success: boolean | null;
  wall: number | null;
};

export function heatmapGrid(languages: LanguageDetail[]): {
  caseIds: string[];
  languages: { condition: string; display: string }[];
  cells: Map<string, HeatCell>;
} {
  const caseIds = Array.from(
    new Set(languages.flatMap((l) => l.rows.map((r) => r.caseId))),
  ).sort();
  const cells = new Map<string, HeatCell>();
  for (const lang of languages) {
    for (const caseId of caseIds) {
      const row: CaseRow | undefined = lang.rows.find(
        (r) => r.caseId === caseId,
      );
      cells.set(`${lang.condition}::${caseId}`, {
        caseId,
        condition: lang.condition,
        display: lang.display,
        success: row ? row.success : null,
        wall: row ? row.wallClockSeconds : null,
      });
    }
  }
  return {
    caseIds,
    languages: languages.map((l) => ({
      condition: l.condition,
      display: l.display,
    })),
    cells,
  };
}

export type RadarRow = {
  metric: string;
  [lang: string]: string | number;
};

/** Normalize metrics 0–100 for radar (higher = better). */
export function radarRows(profiles: LangNumericProfile[]): RadarRow[] {
  if (!profiles.length) return [];
  const maxWall = Math.max(...profiles.map((p) => p.wallPass.median || 1), 1);
  const maxTurns = Math.max(...profiles.map((p) => p.turns.median || 1), 1);
  const maxTok = Math.max(...profiles.map((p) => p.inputTokens.mean || 1), 1);

  const metrics: { key: string; value: (p: LangNumericProfile) => number }[] = [
    { key: "Pass rate", value: (p) => p.passRate },
    {
      key: "Speed score",
      value: (p) => Math.max(0, 100 * (1 - (p.wallPass.median || 0) / maxWall)),
    },
    {
      key: "Low turns",
      value: (p) => Math.max(0, 100 * (1 - (p.turns.median || 0) / maxTurns)),
    },
    {
      key: "Token thrift",
      value: (p) => Math.max(0, 100 * (1 - (p.inputTokens.mean || 0) / maxTok)),
    },
  ];

  return metrics.map((m) => {
    const row: RadarRow = { metric: m.key };
    for (const p of profiles) {
      row[p.display] = round(m.value(p));
    }
    return row;
  });
}
