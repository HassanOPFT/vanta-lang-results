"use client";

import { Card, Chip, Spinner } from "@heroui/react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ChartSection } from "@/components/chart-section";
import { ChartToggles } from "@/components/chart-toggles";
import { CaseDifficultyBars } from "@/components/charts/case-difficulty-bars";
import { CompareWallBars } from "@/components/charts/compare-wall-bars";
import { PassRateBars } from "@/components/charts/pass-rate-bars";
import { HardCasesList } from "@/components/hard-cases-list";
import { InsightList } from "@/components/insight-list";
import { StatCard } from "@/components/stat-card";
import {
  loadExperiment,
  loadExperimentFails,
  loadExperimentLanguages,
  toLanguageDetail,
  toLanguageSummaries,
  type ExperimentCluster,
  type ExperimentFail,
  type ExperimentIndex,
} from "@/lib/experiments";
import {
  formatPercent,
  formatSeconds,
  formatTokens,
  shortCaseId,
} from "@/lib/format";
import {
  OVERVIEW_CHARTS,
  caseDifficulty,
  portfolioFindings,
  type ChartId,
} from "@/lib/insights";
import type { LanguageDetail } from "@/lib/types";
import { useChartVisibility } from "@/lib/use-chart-visibility";

const DEFAULT_CHARTS: ChartId[] = ["passRate", "caseDifficulty", "meanWall"];

function classTone(cls?: string): string {
  if (cls === "system")
    return "bg-orange-500/15 text-orange-700 dark:text-orange-300";
  if (cls === "agent") return "bg-sky-500/15 text-sky-800 dark:text-sky-300";
  return "bg-default-100 text-muted";
}

export default function ExperimentDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [index, setIndex] = useState<ExperimentIndex | null>(null);
  const [details, setDetails] = useState<LanguageDetail[]>([]);
  const [fails, setFails] = useState<ExperimentFail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [failFilter, setFailFilter] = useState<"all" | "system" | "agent">(
    "all",
  );
  const { visible, toggle, showAll, hideAll } = useChartVisibility(
    "vanta-experiment-charts",
    DEFAULT_CHARTS,
  );

  useEffect(() => {
    if (!slug) return;
    setLoadingDetails(true);
    loadExperiment(slug)
      .then(async (idx) => {
        setIndex(idx);
        const [langs, f] = await Promise.all([
          loadExperimentLanguages(
            slug,
            idx.languages.map((l) => l.condition),
          ),
          loadExperimentFails(slug),
        ]);
        setDetails(langs.map(toLanguageDetail));
        setFails(f);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingDetails(false));
  }, [slug]);

  const summaries = useMemo(
    () => (index ? toLanguageSummaries(index.languages) : []),
    [index],
  );
  const findings = useMemo(
    () => (summaries.length ? portfolioFindings(summaries) : []),
    [summaries],
  );
  const difficulty = useMemo(() => caseDifficulty(details), [details]);
  const visibleFails = useMemo(() => {
    if (failFilter === "all") return fails;
    return fails.filter((f) => f.failure_class === failFilter);
  }, [fails, failFilter]);

  if (error) {
    return (
      <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm">
        {error}
      </div>
    );
  }

  if (!index) {
    return (
      <div className="flex min-h-[40vh] items-center gap-3 text-muted">
        <Spinner size="sm" />
        Loading {slug}…
      </div>
    );
  }

  const langsSorted = [...index.languages].sort(
    (a, b) => b.passRate - a.passRate || a.display.localeCompare(b.display),
  );
  const best = langsSorted[0];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <NextLink
            className="no-underline hover:text-foreground"
            href="/experiments"
          >
            Experiments
          </NextLink>
          <span>/</span>
          <span className="font-mono text-foreground">{index.slug}</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Experiment report
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {index.title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted">{index.subtitle}</p>
            <p className="mt-2 text-xs text-muted">
              Updated {new Date(index.updatedAt).toLocaleString()}
              {index.worktreeHint ? ` · ${index.worktreeHint}` : ""}
            </p>
          </div>
          <Chip className="bg-accent/15 text-accent" size="sm">
            {formatPercent(index.passRate)} portfolio
          </Chip>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Languages"
          value={String(index.languageCount)}
          hint={`${index.totalCases} cases`}
        />
        <StatCard
          label="Honest PASS / cases"
          value={`${index.honestPass}/${index.totalCases}`}
        />
        <StatCard
          label="Pass rate"
          value={formatPercent(index.passRate)}
          hint={
            best
              ? `Leader ${best.display} ${formatPercent(best.passRate)}`
              : undefined
          }
        />
        <StatCard
          label="System fails"
          value={String(index.systemFails)}
          hint="harness / seed / API"
        />
        <StatCard
          label="Agent fails"
          value={String(index.agentFails)}
          hint="task incomplete"
        />
      </section>

      <InsightList findings={findings} title="What this experiment says" />

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
          <PassRateBars languages={summaries} />
        </ChartSection>

        <ChartSection
          title="Speed on passing cases"
          description="Mean wall clock among honest PASS rows"
          visible={visible.has("meanWall")}
        >
          <CompareWallBars languages={summaries} />
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
        <h2 className="text-lg font-semibold text-foreground">Languages</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {langsSorted.map((lang) => (
            <NextLink
              key={lang.condition}
              className="no-underline"
              href={`/experiments/${index.slug}/${lang.condition}`}
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

      <FailureClusters clusters={index.clusters} />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              All failures ({visibleFails.length})
            </h2>
            <p className="text-sm text-muted">
              Annotated system vs agent notes shipped with this experiment.
            </p>
          </div>
          <div className="flex gap-1">
            {(["all", "system", "agent"] as const).map((f) => (
              <button
                key={f}
                className={
                  failFilter === f
                    ? "rounded-md bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent"
                    : "rounded-md px-3 py-1.5 text-sm text-muted hover:text-foreground"
                }
                type="button"
                onClick={() => setFailFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {visibleFails.map((f) => (
            <Card
              key={`${f.condition}-${f.caseId}-${f.record || ""}`}
              className="border border-separator bg-surface/80 shadow-none"
            >
              <Card.Content className="flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <NextLink
                    className="text-sm font-semibold text-foreground no-underline hover:text-accent"
                    href={`/experiments/${index.slug}/${f.condition}`}
                  >
                    {f.display}
                  </NextLink>
                  <span className="font-mono text-xs text-muted">
                    {shortCaseId(f.caseId)}
                  </span>
                  <Chip className={classTone(f.failure_class)} size="sm">
                    {f.failure_class || "unknown"}
                  </Chip>
                  {f.root_cause ? (
                    <Chip className="bg-default-100 text-muted" size="sm">
                      {f.root_cause}
                    </Chip>
                  ) : null}
                </div>
                <p className="text-sm text-foreground">{f.failure_summary}</p>
                {f.proposed_fix ? (
                  <p className="text-sm text-muted">
                    <span className="font-medium text-foreground">Fix: </span>
                    {f.proposed_fix}
                  </p>
                ) : null}
              </Card.Content>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function FailureClusters({ clusters }: { clusters: ExperimentCluster[] }) {
  if (!clusters.length) return null;
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Failure clusters
        </h2>
        <p className="text-sm text-muted">
          Grouped by case across languages — debug notes for harness fixes.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {clusters.map((c) => (
          <Card
            key={c.caseId}
            className="border border-separator bg-surface/80 shadow-none"
          >
            <Card.Content className="flex flex-col gap-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-medium text-foreground">
                  {c.caseId}
                </span>
                <Chip className={classTone(c.failureClass)} size="sm">
                  {c.failureClass}
                </Chip>
                <Chip className="bg-default-100 text-muted" size="sm">
                  {c.failCount} langs
                </Chip>
                <Chip className="bg-default-100 text-muted" size="sm">
                  {c.dominantRootCause}
                </Chip>
              </div>
              <p className="text-sm text-foreground">{c.failureSummary}</p>
              <p className="text-sm text-muted">
                <span className="font-medium text-foreground">Fix: </span>
                {c.proposedFix}
              </p>
              <p className="text-xs text-muted">Affects: {c.langs.join(", ")}</p>
            </Card.Content>
          </Card>
        ))}
      </div>
    </section>
  );
}
