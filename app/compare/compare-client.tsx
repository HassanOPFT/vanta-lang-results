"use client";

import { Button, Spinner } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChartSection } from "@/components/chart-section";
import { ChartToggles } from "@/components/chart-toggles";
import { CaseDifficultyBars } from "@/components/charts/case-difficulty-bars";
import { CompareCaseMatrix } from "@/components/charts/compare-case-matrix";
import { CompareCaseWalls } from "@/components/charts/compare-case-walls";
import { ComparePassBars } from "@/components/charts/compare-pass-bars";
import { CompareWallBars } from "@/components/charts/compare-wall-bars";
import { MetricRadar } from "@/components/charts/metric-radar";
import { PassHeatmap } from "@/components/charts/pass-heatmap";
import { PctDiffBars } from "@/components/charts/pct-diff-bars";
import { PerCaseMetric } from "@/components/charts/per-case-metric";
import { TotalsPctBars } from "@/components/charts/totals-pct-bars";
import { TurnsWallScatter } from "@/components/charts/turns-wall-scatter";
import { WallBoxPlot } from "@/components/charts/wall-box-plot";
import { WallHistogram } from "@/components/charts/wall-histogram";
import { CompareKpis } from "@/components/compare-kpis";
import { DeltaTable } from "@/components/delta-table";
import { HardCasesList } from "@/components/hard-cases-list";
import { InsightList } from "@/components/insight-list";
import { SummaryStatsTable } from "@/components/summary-stats-table";
import {
  parseCompareSearchParams,
  toCompareSearchParams,
} from "@/lib/compare-url";
import { loadIndex, loadLanguages } from "@/lib/data";
import { colorForIndex, formatPercent } from "@/lib/format";
import {
  COMPARE_CHARTS,
  caseDifficulty,
  compareFindings,
  deltasVsBaseline,
  type ChartId,
} from "@/lib/insights";
import { METRICS, type MetricKey } from "@/lib/metrics";
import type { LanguageDetail, LanguageSummary } from "@/lib/types";

export function CompareClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [catalog, setCatalog] = useState<LanguageSummary[]>([]);
  const [details, setDetails] = useState<LanguageDetail[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryFilter, setQueryFilter] = useState("");
  const [ready, setReady] = useState(false);
  const requestId = useRef(0);

  const catalogConditions = useMemo(
    () => catalog.map((l) => l.condition),
    [catalog],
  );

  const urlState = useMemo(
    () => parseCompareSearchParams(searchParams, catalogConditions),
    [searchParams, catalogConditions],
  );

  const selected = urlState.langs;
  const baseline = urlState.base;
  const metric = urlState.metric;
  const visible = useMemo(() => new Set(urlState.charts), [urlState.charts]);

  const writeUrl = useCallback(
    (
      patch: Partial<{
        langs: string[];
        base: string;
        metric: MetricKey;
        charts: ChartId[];
      }>,
    ) => {
      const next = {
        langs: patch.langs ?? selected,
        base: patch.base ?? baseline,
        metric: patch.metric ?? metric,
        charts: patch.charts ?? urlState.charts,
      };
      if (next.base && next.langs.length && !next.langs.includes(next.base)) {
        next.base = next.langs.includes("english") ? "english" : next.langs[0];
      }
      const qs = toCompareSearchParams(next);
      router.replace(qs ? `/compare?${qs}` : "/compare", { scroll: false });
    },
    [selected, baseline, metric, urlState.charts, router],
  );

  useEffect(() => {
    loadIndex()
      .then((index) => {
        setCatalog(index.languages);
        // Normalize URL once catalog is known (fills defaults into shareable URL).
        const parsed = parseCompareSearchParams(
          searchParams,
          index.languages.map((l) => l.condition),
        );
        const qs = toCompareSearchParams(parsed);
        const current = searchParams.toString();
        if (qs !== current) {
          router.replace(`/compare?${qs}`, { scroll: false });
        }
        setReady(true);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingCatalog(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !selected.length) {
      if (ready && !selected.length) setDetails([]);
      return;
    }
    const id = ++requestId.current;
    setRefreshing(true);
    const handle = window.setTimeout(() => {
      loadLanguages(selected)
        .then((rows) => {
          if (id !== requestId.current) return;
          const order = new Map(selected.map((c, i) => [c, i]));
          rows.sort(
            (a, b) =>
              (order.get(a.condition) ?? 0) - (order.get(b.condition) ?? 0),
          );
          setDetails(rows);
        })
        .catch((err: Error) => {
          if (id === requestId.current) setError(err.message);
        })
        .finally(() => {
          if (id === requestId.current) setRefreshing(false);
        });
    }, 200);
    return () => window.clearTimeout(handle);
  }, [selected, ready]);

  const findings = useMemo(
    () => compareFindings(details, baseline),
    [details, baseline],
  );
  const difficulty = useMemo(() => caseDifficulty(details), [details]);
  const deltas = useMemo(
    () => (baseline ? deltasVsBaseline(details, baseline) : []),
    [details, baseline],
  );
  const summaries = useMemo(
    () => details.map(({ rows: _r, ...s }) => s),
    [details],
  );
  const baselineLabel =
    details.find((d) => d.condition === baseline)?.display ?? baseline;

  const filteredCatalog = useMemo(() => {
    const q = queryFilter.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (l) =>
        l.display.toLowerCase().includes(q) ||
        l.condition.toLowerCase().includes(q),
    );
  }, [catalog, queryFilter]);

  function toggleLang(condition: string) {
    const next = selected.includes(condition)
      ? selected.filter((c) => c !== condition)
      : [...selected, condition];
    writeUrl({ langs: next });
  }

  function toggleChart(id: ChartId) {
    const set = new Set(urlState.charts);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    writeUrl({ charts: Array.from(set) });
  }

  if (loadingCatalog) {
    return (
      <div className="flex min-h-[40vh] items-center gap-3 text-muted">
        <Spinner size="sm" />
        Loading languages…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Shareable dashboard
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Language comparison
        </h1>
        <p className="max-w-3xl text-muted">
          Same idea as the English vs Serbian dashboard — KPIs, per-case metric,
          % vs baseline, totals, scatter — but for any set of languages. Filters
          live in the URL so you can share the exact view.
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-xl border border-separator bg-surface/50 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-muted">
              Languages ({selected.length}/{catalog.length})
            </label>
            <input
              type="search"
              placeholder="Filter languages…"
              value={queryFilter}
              onChange={(e) => setQueryFilter(e.target.value)}
              className="w-64 max-w-full rounded-md border border-separator bg-background px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-muted">
              Metric
              <select
                aria-label="Metric"
                className="rounded-md border border-separator bg-background px-2 py-1.5 text-foreground"
                value={metric}
                onChange={(e) =>
                  writeUrl({ metric: e.target.value as MetricKey })
                }
              >
                {METRICS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-muted">
              Baseline
              <select
                aria-label="Baseline language"
                className="rounded-md border border-separator bg-background px-2 py-1.5 text-foreground"
                value={baseline}
                onChange={(e) => writeUrl({ base: e.target.value })}
                disabled={!selected.length}
              >
                {selected.map((c) => {
                  const lang = catalog.find((l) => l.condition === c);
                  return (
                    <option key={c} value={c}>
                      {lang?.display ?? c}
                    </option>
                  );
                })}
              </select>
            </label>
            <Button
              size="sm"
              variant="secondary"
              onPress={() =>
                writeUrl({ langs: catalog.map((l) => l.condition) })
              }
            >
              All
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={() =>
                writeUrl({
                  langs: catalog
                    .filter((l) => ["english", "serbian"].includes(l.condition))
                    .map((l) => l.condition),
                  base: "english",
                })
              }
            >
              EN + SR
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={() => writeUrl({ langs: [] })}
            >
              Clear
            </Button>
          </div>
        </div>

        <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
          {filteredCatalog.map((lang) => {
            const checked = selected.includes(lang.condition);
            const colorIdx = catalog.findIndex(
              (c) => c.condition === lang.condition,
            );
            return (
              <button
                key={lang.condition}
                type="button"
                aria-pressed={checked}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                  checked
                    ? "border-accent/40 bg-accent/15 text-foreground"
                    : "border-separator text-muted hover:text-foreground"
                }`}
                onClick={() => toggleLang(lang.condition)}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: checked
                      ? colorForIndex(colorIdx)
                      : "#94a3b8",
                  }}
                />
                {lang.display}
                <span className="tabular-nums text-xs opacity-70">
                  {formatPercent(lang.passRate)}
                </span>
              </button>
            );
          })}
          {!filteredCatalog.length ? (
            <p className="text-sm text-muted">
              No languages match “{queryFilter}”.
            </p>
          ) : null}
        </div>
        <p className="text-xs text-muted">
          URL encodes langs, baseline, metric, and visible charts — copy the
          address bar to share.
          {refreshing ? " · updating…" : ""}
        </p>
      </section>

      {!selected.length ? (
        <p className="text-sm text-muted">
          Select languages to build the dashboard.
        </p>
      ) : !details.length && refreshing ? (
        <div className="flex min-h-40 items-center gap-3 text-muted">
          <Spinner size="sm" />
          Loading selection…
        </div>
      ) : (
        <div
          className={`flex flex-col gap-10 ${refreshing ? "opacity-80" : ""}`}
        >
          <CompareKpis languages={details} baselineCondition={baseline} />

          <InsightList findings={findings} title="Takeaways" />

          <ChartToggles
            options={COMPARE_CHARTS}
            visible={visible}
            onToggle={toggleChart}
            onShowAll={() =>
              writeUrl({ charts: COMPARE_CHARTS.map((c) => c.id) })
            }
            onHideAll={() => writeUrl({ charts: [] })}
          />

          <div className="grid gap-6">
            <ChartSection
              title={`Per case: ${METRICS.find((m) => m.key === metric)?.label ?? metric}`}
              description="Grouped bars (≤6 langs) or lines (many langs) — metric from the control above"
              visible={visible.has("perCase")}
              minHeightClass="min-h-[420px]"
            >
              <PerCaseMetric languages={details} metric={metric} />
            </ChartSection>

            <ChartSection
              title={`% difference vs ${baselineLabel} (per case)`}
              description="Positive = language used more of the selected metric than baseline"
              visible={visible.has("pctDiff")}
              minHeightClass="min-h-[540px]"
            >
              <PctDiffBars
                languages={details}
                baselineCondition={baseline}
                metric={metric}
              />
            </ChartSection>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartSection
                title="Totals: % difference vs baseline"
                description="Summed across all cases"
                visible={visible.has("totals")}
              >
                <TotalsPctBars
                  languages={details}
                  baselineCondition={baseline}
                  focusMetric={metric}
                />
              </ChartSection>
              <ChartSection
                title="Turns vs wall clock"
                description="Each point is one run · ✕ = fail"
                visible={visible.has("scatter")}
              >
                <TurnsWallScatter languages={details} />
              </ChartSection>
            </div>

            <ChartSection
              title="Outcome heatmap"
              description="Quick scan of PASS/FAIL across the selection"
              visible={visible.has("heatmap")}
              minHeightClass="min-h-0"
            >
              <PassHeatmap languages={details} />
            </ChartSection>

            <ChartSection
              title="Summary statistics"
              visible={visible.has("statsTable")}
              minHeightClass="min-h-0"
            >
              <SummaryStatsTable languages={details} />
            </ChartSection>

            <ChartSection title="Pass rate" visible={visible.has("passRate")}>
              <ComparePassBars languages={summaries} />
            </ChartSection>

            <ChartSection
              title="Wall histogram"
              visible={visible.has("histogram")}
            >
              <WallHistogram languages={details} />
            </ChartSection>

            <ChartSection
              title="Wall distribution"
              visible={visible.has("boxplot")}
            >
              <WallBoxPlot languages={details} />
            </ChartSection>

            <ChartSection title="Profile radar" visible={visible.has("radar")}>
              <MetricRadar languages={details} />
            </ChartSection>

            <ChartSection
              title="Hardest cases"
              visible={visible.has("caseDifficulty")}
              minHeightClass="min-h-80"
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <CaseDifficultyBars rows={difficulty} limit={10} />
                <HardCasesList rows={difficulty} limit={6} />
              </div>
            </ChartSection>

            <ChartSection
              title="Mean wall on passes"
              visible={visible.has("meanWall")}
            >
              <CompareWallBars languages={summaries} />
            </ChartSection>

            <ChartSection
              title="Vs baseline table"
              visible={visible.has("deltaTable")}
              minHeightClass="min-h-0"
            >
              {baseline ? (
                <DeltaTable rows={deltas} baselineLabel={baselineLabel} />
              ) : null}
            </ChartSection>

            <ChartSection
              title="Wall by case (grouped)"
              visible={visible.has("caseWalls")}
              minHeightClass="min-h-96"
            >
              <CompareCaseWalls languages={details} />
            </ChartSection>

            <ChartSection
              title="Pass matrix"
              visible={visible.has("matrix")}
              minHeightClass="min-h-0"
            >
              <CompareCaseMatrix languages={details} />
            </ChartSection>
          </div>
        </div>
      )}
    </div>
  );
}
