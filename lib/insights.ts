import {
  formatPercent,
  formatSeconds,
  formatTokens,
  shortCaseId,
} from "@/lib/format";
import type { LanguageDetail, LanguageSummary } from "@/lib/types";

export type InsightFinding = {
  id: string;
  title: string;
  detail: string;
  tone: "positive" | "warning" | "neutral";
};

export type CaseDifficulty = {
  caseId: string;
  passCount: number;
  failCount: number;
  knownCount: number;
  passRate: number;
  failingLanguages: string[];
};

export type LangDelta = {
  condition: string;
  display: string;
  passRate: number;
  deltaPassRate: number;
  meanWallPass: number | null;
  deltaWall: number | null;
  totalInputTokens: number;
  tokenRatio: number | null;
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function caseDifficulty(languages: LanguageDetail[]): CaseDifficulty[] {
  const caseIds = Array.from(
    new Set(languages.flatMap((l) => l.rows.map((r) => r.caseId))),
  ).sort();

  return caseIds
    .map((caseId) => {
      const outcomes = languages.map((l) => {
        const row = l.rows.find((r) => r.caseId === caseId);
        return row ? { display: l.display, success: row.success } : null;
      });
      const known = outcomes.filter(
        (o): o is { display: string; success: boolean } => o != null,
      );
      const passCount = known.filter((o) => o.success).length;
      const failCount = known.length - passCount;
      return {
        caseId,
        passCount,
        failCount,
        knownCount: known.length,
        passRate: known.length ? round1((passCount / known.length) * 100) : 0,
        failingLanguages: known.filter((o) => !o.success).map((o) => o.display),
      };
    })
    .sort((a, b) => a.passRate - b.passRate || b.failCount - a.failCount);
}

export function portfolioFindings(
  languages: LanguageSummary[],
): InsightFinding[] {
  if (!languages.length) return [];

  const ranked = [...languages].sort((a, b) => b.passRate - a.passRate);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const avg = round1(
    ranked.reduce((a, l) => a + l.passRate, 0) / ranked.length,
  );
  const belowAvg = ranked.filter((l) => l.passRate < avg - 5);
  const incomplete = ranked.filter((l) => l.cases < 26);

  const walls = ranked
    .filter((l) => l.meanWallPass != null)
    .sort((a, b) => (a.meanWallPass ?? 0) - (b.meanWallPass ?? 0));
  const fastest = walls[0];
  const slowest = walls[walls.length - 1];

  const findings: InsightFinding[] = [
    {
      id: "leader",
      title: `${best.display} leads on honest pass rate`,
      detail: `${best.honestPass}/${best.cases} cases (${formatPercent(best.passRate)}). Portfolio average is ${formatPercent(avg)}.`,
      tone: "positive",
    },
    {
      id: "laggard",
      title: `${worst.display} is the weakest export`,
      detail: `${worst.honestPass}/${worst.cases} (${formatPercent(worst.passRate)}) — ${round1(best.passRate - worst.passRate)} pp behind the leader.`,
      tone: "warning",
    },
  ];

  if (fastest && slowest && fastest.condition !== slowest.condition) {
    findings.push({
      id: "speed",
      title: `${fastest.display} is fastest on passing cases`,
      detail: `Mean wall ${formatSeconds(fastest.meanWallPass)} vs ${slowest.display} at ${formatSeconds(slowest.meanWallPass)}.`,
      tone: "neutral",
    });
  }

  if (belowAvg.length) {
    findings.push({
      id: "below-avg",
      title: `${belowAvg.length} language(s) sit clearly below average`,
      detail: `${belowAvg.map((l) => `${l.display} (${formatPercent(l.passRate)})`).join(", ")}.`,
      tone: "warning",
    });
  }

  if (incomplete.length) {
    findings.push({
      id: "incomplete",
      title: `${incomplete.length} export(s) are incomplete (<26 cases)`,
      detail: incomplete.map((l) => `${l.display}: ${l.cases}/26`).join(" · "),
      tone: "warning",
    });
  }

  const tokenHeavy = [...ranked].sort(
    (a, b) => b.totalInputTokens - a.totalInputTokens,
  )[0];
  findings.push({
    id: "tokens",
    title: `${tokenHeavy.display} burned the most input tokens`,
    detail: `${formatTokens(tokenHeavy.totalInputTokens)} input · ${tokenHeavy.honestPass}/${tokenHeavy.cases} pass.`,
    tone: "neutral",
  });

  return findings;
}

export function compareFindings(
  languages: LanguageDetail[],
  baselineCondition?: string | null,
): InsightFinding[] {
  if (!languages.length) return [];

  const ranked = [...languages].sort((a, b) => b.passRate - a.passRate);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const difficulty = caseDifficulty(languages);
  const hardest = difficulty.filter((c) => c.failCount > 0).slice(0, 3);
  const universalFail = difficulty.filter(
    (c) => c.failCount === c.knownCount && c.knownCount > 0,
  );
  const universalPass = difficulty.filter(
    (c) => c.passCount === c.knownCount && c.knownCount > 0,
  );
  const split = difficulty.filter((c) => c.failCount > 0 && c.passCount > 0);

  const findings: InsightFinding[] = [
    {
      id: "spread",
      title:
        languages.length === 1
          ? `${best.display}: ${formatPercent(best.passRate)} honest pass`
          : `Spread is ${round1(best.passRate - worst.passRate)} pp between ${best.display} and ${worst.display}`,
      detail:
        languages.length === 1
          ? `${best.honestPass}/${best.cases} cases · mean wall on passes ${formatSeconds(best.meanWallPass)}.`
          : `Best ${best.display} ${formatPercent(best.passRate)} · worst ${worst.display} ${formatPercent(worst.passRate)}.`,
      tone: best.passRate - worst.passRate > 15 ? "warning" : "neutral",
    },
  ];

  if (languages.length > 1) {
    findings.push({
      id: "agreement",
      title: `${universalPass.length} cases all PASS · ${universalFail.length} all FAIL · ${split.length} split`,
      detail:
        split.length > 0
          ? `Split cases are the interesting ones — languages disagree on difficulty.`
          : `Selected languages mostly agree on outcomes.`,
      tone: split.length > 5 ? "warning" : "positive",
    });
  }

  if (hardest.length) {
    findings.push({
      id: "hard-cases",
      title: `Hardest among selection: ${hardest.map((c) => shortCaseId(c.caseId)).join(", ")}`,
      detail: hardest
        .map(
          (c) =>
            `${shortCaseId(c.caseId)} fails in ${c.failingLanguages.join("/") || "—"} (${formatPercent(c.passRate)} pass)`,
        )
        .join(" · "),
      tone: "warning",
    });
  }

  const baseline =
    languages.find((l) => l.condition === baselineCondition) ??
    languages.find((l) => l.condition === "english") ??
    null;

  if (baseline && languages.length > 1) {
    const others = languages.filter((l) => l.condition !== baseline.condition);
    const ahead = others.filter((l) => l.passRate > baseline.passRate);
    const behind = others.filter((l) => l.passRate < baseline.passRate);
    findings.push({
      id: "vs-baseline",
      title: `Vs ${baseline.display} (${formatPercent(baseline.passRate)})`,
      detail:
        [
          ahead.length
            ? `ahead: ${ahead.map((l) => `${l.display} +${round1(l.passRate - baseline.passRate)}pp`).join(", ")}`
            : null,
          behind.length
            ? `behind: ${behind.map((l) => `${l.display} ${round1(l.passRate - baseline.passRate)}pp`).join(", ")}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ") || "No deltas.",
      tone: behind.length > ahead.length ? "warning" : "positive",
    });
  }

  const efficient = [...languages]
    .filter((l) => l.honestPass > 0)
    .map((l) => ({
      ...l,
      tokensPerPass: l.totalInputTokens / l.honestPass,
    }))
    .sort((a, b) => a.tokensPerPass - b.tokensPerPass);

  if (efficient.length >= 2) {
    const bestEff = efficient[0];
    const worstEff = efficient[efficient.length - 1];
    findings.push({
      id: "efficiency",
      title: `${bestEff.display} is most token-efficient per PASS`,
      detail: `${formatTokens(Math.round(bestEff.tokensPerPass))} input/pass vs ${worstEff.display} at ${formatTokens(Math.round(worstEff.tokensPerPass))}.`,
      tone: "neutral",
    });
  }

  return findings;
}

export function deltasVsBaseline(
  languages: LanguageDetail[],
  baselineCondition: string,
): LangDelta[] {
  const baseline = languages.find((l) => l.condition === baselineCondition);
  if (!baseline) return [];

  return languages.map((l) => ({
    condition: l.condition,
    display: l.display,
    passRate: l.passRate,
    deltaPassRate: round1(l.passRate - baseline.passRate),
    meanWallPass: l.meanWallPass,
    deltaWall:
      l.meanWallPass != null && baseline.meanWallPass != null
        ? round1(l.meanWallPass - baseline.meanWallPass)
        : null,
    totalInputTokens: l.totalInputTokens,
    tokenRatio:
      baseline.totalInputTokens > 0
        ? round1(l.totalInputTokens / baseline.totalInputTokens)
        : null,
  }));
}

export type ChartId =
  | "passRate"
  | "meanWall"
  | "caseWalls"
  | "caseDifficulty"
  | "deltaTable"
  | "matrix"
  | "heatmap"
  | "histogram"
  | "boxplot"
  | "scatter"
  | "radar"
  | "statsTable"
  | "perCase"
  | "pctDiff"
  | "totals";

/** Dashboard-style compare sections (EN-vs-SR inspired) + optional extras. */
export const COMPARE_CHARTS: { id: ChartId; label: string }[] = [
  { id: "perCase", label: "Per-case metric" },
  { id: "pctDiff", label: "% vs baseline" },
  { id: "totals", label: "Totals % diff" },
  { id: "scatter", label: "Turns vs wall" },
  { id: "heatmap", label: "Outcome heatmap" },
  { id: "statsTable", label: "Summary stats" },
  { id: "passRate", label: "Pass rate" },
  { id: "histogram", label: "Wall histogram" },
  { id: "boxplot", label: "Wall distribution" },
  { id: "radar", label: "Profile radar" },
  { id: "caseDifficulty", label: "Hardest cases" },
  { id: "meanWall", label: "Mean wall bars" },
  { id: "deltaTable", label: "Vs baseline table" },
  { id: "caseWalls", label: "Wall by case" },
  { id: "matrix", label: "Pass matrix" },
];

export const OVERVIEW_CHARTS: { id: ChartId; label: string }[] = [
  { id: "passRate", label: "Pass rate ranking" },
  { id: "meanWall", label: "Speed (mean wall)" },
  { id: "caseDifficulty", label: "Hardest cases" },
];
