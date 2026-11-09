"use client";

import { Card, Chip, Spinner } from "@heroui/react";
import NextLink from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ChartSection } from "@/components/chart-section";
import { ChartToggles } from "@/components/chart-toggles";
import { CaseDifficultyBars } from "@/components/charts/case-difficulty-bars";
import { CompareWallBars } from "@/components/charts/compare-wall-bars";
import { PassRateBars } from "@/components/charts/pass-rate-bars";
import { HardCasesList } from "@/components/hard-cases-list";
import { InsightList } from "@/components/insight-list";
import { StatCard } from "@/components/stat-card";
import { loadIndex, loadLanguages } from "@/lib/data";
import { formatPercent, formatSeconds, formatTokens } from "@/lib/format";
import {
  OVERVIEW_CHARTS,
  caseDifficulty,
  portfolioFindings,
  type ChartId,
} from "@/lib/insights";
import type { LanguageDetail, MetricsIndex } from "@/lib/types";
import { useChartVisibility } from "@/lib/use-chart-visibility";

const DEFAULT_CHARTS: ChartId[] = ["passRate", "caseDifficulty", "meanWall"];

export default function OverviewPage() {
  const [index, setIndex] = useState<MetricsIndex | null>(null);
  const [details, setDetails] = useState<LanguageDetail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const { visible, toggle, showAll, hideAll } = useChartVisibility(
    "vanta-overview-charts",
    DEFAULT_CHARTS,
  );

  useEffect(() => {
    loadIndex()
      .then(async (data) => {
        setIndex(data);
        const langs = await loadLanguages(
          data.languages.map((l) => l.condition),
        );
        setDetails(langs);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingDetails(false));
  }, []);

  const findings = useMemo(
    () => (index ? portfolioFindings(index.languages) : []),
    [index],
  );
  const difficulty = useMemo(() => caseDifficulty(details), [details]);

  if (error) {
    return (
      <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm">
        {error}. Run <code className="font-mono">npm run publish-data</code>{" "}
        first.
      </div>
    );
  }

  if (!index) {
    return (
      <div className="flex min-h-[40vh] items-center gap-3 text-muted">
        <Spinner size="sm" />
        Building report…
      </div>
    );
  }

  const totalPass = index.languages.reduce((a, l) => a + l.honestPass, 0);
  const totalCases = index.languages.reduce((a, l) => a + l.cases, 0);
  const best = index.languages[0];
  const avgPass =
    index.languages.length > 0
      ? Math.round(
          (index.languages.reduce((a, l) => a + l.passRate, 0) /
            index.languages.length) *
            10,
        ) / 10
      : 0;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Report
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Language benchmark insights
        </h1>
        <p className="max-w-2xl text-muted">
          Honest PASS metrics across finished exports. Read the findings first,
          then open charts you care about — or drill into a language / compare
          set.
        </p>
        <p className="text-xs text-muted">
          Updated {new Date(index.updatedAt).toLocaleString()} · {index.source}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Languages" value={String(index.languageCount)} />
        <StatCard
          label="Honest PASS / cases"
          value={`${totalPass}/${totalCases}`}
          hint="across all exports"
        />
        <StatCard label="Avg pass rate" value={formatPercent(avgPass)} />
        <StatCard
          label="Leader"
          value={best ? best.display : "—"}
          hint={
            best
              ? `${formatPercent(best.passRate)} · ${best.honestPass}/${best.cases}`
              : undefined
          }
        />
      </div>

      <InsightList findings={findings} title="What this portfolio says" />

      <ChartToggles
        options={OVERVIEW_CHARTS}
        visible={visible}
        onToggle={toggle}
        onShowAll={showAll}
        onHideAll={hideAll}
      />

      <div className="grid gap-4">
        <ChartSection
          title="Pass rate ranking"
          description="Higher is better · honest PASS only"
          visible={visible.has("passRate")}
        >
          <PassRateBars languages={index.languages} />
        </ChartSection>

        <ChartSection
          title="Speed on passing cases"
          description="Mean wall clock among honest PASS rows"
          visible={visible.has("meanWall")}
        >
          <CompareWallBars languages={index.languages} />
        </ChartSection>

        <ChartSection
          title="Hardest cases across languages"
          description="Lowest cross-language pass rate first"
          visible={visible.has("caseDifficulty")}
          minHeightClass="min-h-80"
        >
          {loadingDetails ? (
            <div className="flex h-72 items-center gap-2 text-muted">
              <Spinner size="sm" />
              Loading case difficulty…
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <CaseDifficultyBars rows={difficulty} />
              <HardCasesList rows={difficulty} />
            </div>
          )}
        </ChartSection>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Languages</h2>
          <NextLink
            className="text-sm text-accent no-underline hover:underline"
            href="/compare"
          >
            Open comparison report →
          </NextLink>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {index.languages.map((lang) => (
            <NextLink
              key={lang.condition}
              className="no-underline"
              href={`/lang/${lang.condition}`}
            >
              <Card className="h-full border border-separator bg-surface/80 shadow-none transition hover:border-accent/40">
                <Card.Content className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">
                        {lang.display}
                      </p>
                      <p className="font-mono text-xs text-muted">
                        {lang.condition}
                      </p>
                    </div>
                    <Chip
                      size="sm"
                      variant="soft"
                      color={lang.passRate >= 80 ? "success" : "warning"}
                    >
                      {formatPercent(lang.passRate)}
                    </Chip>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-xs text-muted">
                    <div>
                      <dt>Pass / fail</dt>
                      <dd className="tabular-nums text-foreground">
                        {lang.honestPass} / {lang.honestFail}
                      </dd>
                    </div>
                    <div>
                      <dt>Mean wall (pass)</dt>
                      <dd className="tabular-nums text-foreground">
                        {formatSeconds(lang.meanWallPass)}
                      </dd>
                    </div>
                    <div>
                      <dt>Mean turns</dt>
                      <dd className="tabular-nums text-foreground">
                        {lang.meanTurns}
                      </dd>
                    </div>
                    <div>
                      <dt>Input tokens</dt>
                      <dd className="tabular-nums text-foreground">
                        {formatTokens(lang.totalInputTokens)}
                      </dd>
                    </div>
                  </dl>
                </Card.Content>
              </Card>
            </NextLink>
          ))}
        </div>
      </section>
    </div>
  );
}
