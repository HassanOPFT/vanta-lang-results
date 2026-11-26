"use client";

import { Card, Chip, Spinner } from "@heroui/react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { CollapsibleSection } from "@/components/collapsible-section";
import { ExperimentCaseCompareTable } from "@/components/experiment-case-compare-table";
import { ExperimentReportView } from "@/components/experiment-report";
import { StatCard } from "@/components/stat-card";
import {
  loadExperiment,
  loadExperimentFails,
  loadExperimentLanguages,
  toLanguageDetail,
  type ExperimentFail,
  type ExperimentIndex,
} from "@/lib/experiments";
import {
  formatPercent,
  formatSeconds,
  formatTokens,
  shortCaseId,
} from "@/lib/format";
import type { LanguageDetail } from "@/lib/types";

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
  const [failFilter, setFailFilter] = useState<"all" | "system" | "agent">(
    "all",
  );

  useEffect(() => {
    if (!slug) return;
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
      .catch((err: Error) => setError(err.message));
  }, [slug]);

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

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
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
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {index.title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              {index.subtitle}
            </p>
          </div>
          <Chip className="bg-accent/15 text-accent" size="sm">
            {formatPercent(index.passRate)}
          </Chip>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pass / runs"
          value={`${index.honestPass}/${index.totalCases}`}
        />
        <StatCard label="Pass rate" value={formatPercent(index.passRate)} />
        <StatCard label="Languages" value={String(index.languageCount)} />
        <StatCard
          label="Fails"
          value={`${index.agentFails + index.systemFails}`}
          hint={`${index.agentFails} agent · ${index.systemFails} system`}
        />
      </section>

      {index.report ? <ExperimentReportView report={index.report} /> : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Languages</h2>
        <div className="grid gap-3 sm:grid-cols-2">
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

      {index.tools?.length ? (
        <CollapsibleSection
          id="tools"
          title={`Tools (${index.tools.length})`}
          description="Harness helpers and Moodle wsfunctions"
        >
          <ul className="divide-y divide-separator/60 rounded-md border border-separator">
            {index.tools.map((tool) => (
              <li
                key={tool.name}
                className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-baseline sm:gap-4"
              >
                <div className="flex min-w-0 shrink-0 items-center gap-2 sm:w-72">
                  <span className="font-mono text-xs font-medium text-foreground">
                    {tool.name}
                  </span>
                  <Chip
                    size="sm"
                    className={
                      tool.kind === "session"
                        ? "bg-accent/15 text-accent"
                        : "bg-default-100 text-muted"
                    }
                  >
                    {tool.kind === "session" ? "helper" : "ws"}
                  </Chip>
                </div>
                <p className="min-w-0 text-sm text-muted">{tool.description}</p>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      ) : null}

      <CollapsibleSection
        title={`Failures (${visibleFails.length})`}
        description="Annotated system vs agent notes"
        actions={
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
        }
      >
        {visibleFails.length === 0 ? (
          <p className="text-sm text-muted">No failures in this filter.</p>
        ) : (
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
        )}
      </CollapsibleSection>

      {details.length > 0 ? (
        <CollapsibleSection
          title="Full case metrics"
          description="Compare EN/AR runs side by side"
        >
          <ExperimentCaseCompareTable languages={details} />
        </CollapsibleSection>
      ) : null}
    </div>
  );
}
