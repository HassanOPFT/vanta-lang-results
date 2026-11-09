"use client";

import { Spinner } from "@heroui/react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { CaseTable } from "@/components/case-table";
import { ChartSection } from "@/components/chart-section";
import { ChartToggles } from "@/components/chart-toggles";
import { CaseWallBars } from "@/components/charts/case-wall-bars";
import { InsightList } from "@/components/insight-list";
import { StatCard } from "@/components/stat-card";
import { loadLanguage } from "@/lib/data";
import {
  formatPercent,
  formatSeconds,
  formatTokens,
  shortCaseId,
} from "@/lib/format";
import { compareFindings, type ChartId } from "@/lib/insights";
import type { LanguageDetail } from "@/lib/types";
import { useChartVisibility } from "@/lib/use-chart-visibility";

const LANG_CHARTS: { id: ChartId; label: string }[] = [
  { id: "caseWalls", label: "Wall by case" },
  { id: "caseDifficulty", label: "Token load" },
  { id: "matrix", label: "Case table" },
];

const DEFAULT_CHARTS: ChartId[] = ["caseWalls", "caseDifficulty", "matrix"];

export default function LanguagePage() {
  const params = useParams<{ condition: string }>();
  const condition = params.condition;
  const [data, setData] = useState<LanguageDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { visible, toggle, showAll, hideAll } = useChartVisibility(
    "vanta-lang-charts",
    DEFAULT_CHARTS,
  );

  useEffect(() => {
    if (!condition) return;
    loadLanguage(condition)
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, [condition]);

  const findings = useMemo(() => (data ? compareFindings([data]) : []), [data]);

  const fails = useMemo(() => {
    if (!data) return [];
    return data.rows
      .filter((r) => !r.success)
      .sort((a, b) => b.wallClockSeconds - a.wallClockSeconds);
  }, [data]);

  const tokenChart = useMemo(() => {
    if (!data) return [];
    return data.rows.map((r) => ({
      caseId: r.caseId,
      input: r.inputTokens,
      output: r.outputTokens,
      success: r.success,
    }));
  }, [data]);

  if (error) {
    return (
      <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[40vh] items-center gap-3 text-muted">
        <Spinner size="sm" />
        Loading {condition}…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <NextLink
          className="text-sm text-accent no-underline hover:underline"
          href="/"
        >
          ← Overview
        </NextLink>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Language report
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {data.display}
        </h1>
        <p className="text-muted">
          {data.honestPass}/{data.cases} honest PASS ·{" "}
          {formatPercent(data.passRate)}
        </p>
        <NextLink
          className="w-fit text-sm text-accent no-underline hover:underline"
          href={`/compare?langs=${data.condition}`}
        >
          Compare with other languages →
        </NextLink>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Honest pass"
          value={`${data.honestPass}/${data.cases}`}
        />
        <StatCard label="Honest fail" value={String(data.honestFail)} />
        <StatCard
          label="Mean wall (pass)"
          value={formatSeconds(data.meanWallPass)}
        />
        <StatCard
          label="Input tokens"
          value={formatTokens(data.totalInputTokens)}
        />
      </div>

      <InsightList findings={findings} title="Takeaways" />

      {fails.length ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Failing cases</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {fails.map((r) => (
              <li
                key={r.caseId}
                className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm"
              >
                <span className="font-mono">{shortCaseId(r.caseId)}</span>
                <span className="text-muted">
                  {" "}
                  · {r.turns} turns · {formatSeconds(r.wallClockSeconds)} ·{" "}
                  {formatTokens(r.inputTokens)} in
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm">
          No failing cases in this export.
        </p>
      )}

      <ChartToggles
        options={LANG_CHARTS}
        visible={visible}
        onToggle={toggle}
        onShowAll={showAll}
        onHideAll={hideAll}
      />

      <div className="grid gap-4">
        <ChartSection
          title="Wall clock by case"
          description="Teal = PASS · Rose = FAIL"
          visible={visible.has("caseWalls")}
        >
          <CaseWallBars rows={data.rows} />
        </ChartSection>

        <ChartSection
          title="Token load by case"
          description="Relative input tokens"
          visible={visible.has("caseDifficulty")}
          minHeightClass="min-h-64"
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {tokenChart.map((row) => {
              const max = Math.max(...tokenChart.map((t) => t.input), 1);
              const width = Math.max(4, Math.round((row.input / max) * 100));
              return (
                <div
                  key={row.caseId}
                  className="rounded-md border border-separator p-3"
                >
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-mono text-muted">
                      {shortCaseId(row.caseId)}
                    </span>
                    <span
                      className={row.success ? "text-success" : "text-danger"}
                    >
                      {row.success ? "PASS" : "FAIL"}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-separator/60">
                    <div
                      className="h-full rounded bg-accent"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs tabular-nums text-muted">
                    in {formatTokens(row.input)} · out{" "}
                    {formatTokens(row.output)}
                  </p>
                </div>
              );
            })}
          </div>
        </ChartSection>

        <ChartSection
          title="Case table"
          visible={visible.has("matrix")}
          minHeightClass="min-h-48"
        >
          <CaseTable rows={data.rows} />
        </ChartSection>
      </div>
    </div>
  );
}
