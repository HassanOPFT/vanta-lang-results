"use client";

import { Card, Chip, Spinner } from "@heroui/react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { StatCard } from "@/components/stat-card";
import {
  loadExperiment,
  loadExperimentFails,
  type ExperimentFail,
  type ExperimentIndex,
} from "@/lib/experiments";
import { formatPercent, formatSeconds, shortCaseId } from "@/lib/format";

function classTone(cls?: string): string {
  if (cls === "system") return "bg-orange-500/15 text-orange-700 dark:text-orange-300";
  if (cls === "agent") return "bg-sky-500/15 text-sky-800 dark:text-sky-300";
  return "bg-default-100 text-muted";
}

export default function ExperimentDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [index, setIndex] = useState<ExperimentIndex | null>(null);
  const [fails, setFails] = useState<ExperimentFail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "system" | "agent">("all");

  useEffect(() => {
    if (!slug) return;
    Promise.all([loadExperiment(slug), loadExperimentFails(slug)])
      .then(([idx, f]) => {
        setIndex(idx);
        setFails(f);
      })
      .catch((err: Error) => setError(err.message));
  }, [slug]);

  const visibleFails = useMemo(() => {
    if (filter === "all") return fails;
    return fails.filter((f) => f.failure_class === filter);
  }, [fails, filter]);

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
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <NextLink className="no-underline hover:text-foreground" href="/experiments">
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
            <p className="mt-1 max-w-2xl text-sm text-muted">{index.subtitle}</p>
            {index.worktreeHint ? (
              <p className="mt-2 text-xs text-muted">{index.worktreeHint}</p>
            ) : null}
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
          label="Honest pass"
          value={`${index.honestPass}`}
          hint={`${index.honestFail} fail`}
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
        <StatCard
          label="Pass rate"
          value={formatPercent(index.passRate)}
          hint="honest PASS only"
        />
      </section>

      {index.headlineFindings.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-foreground">Headline findings</h2>
          <ul className="flex flex-col gap-2">
            {index.headlineFindings.map((line) => (
              <li
                key={line}
                className="rounded-lg border border-separator bg-surface/70 px-4 py-3 text-sm text-foreground"
              >
                {line}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Failure clusters</h2>
        <p className="text-sm text-muted">
          Grouped by case across languages — debug notes ship with the push.
        </p>
        <div className="flex flex-col gap-3">
          {index.clusters.map((c) => (
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
                <p className="text-xs text-muted">
                  Affects: {c.langs.join(", ")}
                </p>
              </Card.Content>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Per-language results
            </h2>
            <p className="text-sm text-muted">Sorted by pass rate.</p>
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-separator">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface/90 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Language</th>
                <th className="px-3 py-2 font-medium">Pass</th>
                <th className="px-3 py-2 font-medium">Fail</th>
                <th className="px-3 py-2 font-medium">Rate</th>
                <th className="px-3 py-2 font-medium">Mean wall (pass)</th>
                <th className="px-3 py-2 font-medium">Mean turns</th>
                <th className="px-3 py-2 font-medium">System issues</th>
              </tr>
            </thead>
            <tbody>
              {langsSorted.map((l) => (
                <tr key={l.condition} className="border-t border-separator">
                  <td className="px-3 py-2 font-medium text-foreground">
                    {l.display}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{l.honestPass}</td>
                  <td className="px-3 py-2 tabular-nums">{l.honestFail}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {formatPercent(l.passRate)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {formatSeconds(l.meanWallPass)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{l.meanTurns}</td>
                  <td className="px-3 py-2 tabular-nums">{l.issueCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              All failures ({visibleFails.length})
            </h2>
            <p className="text-sm text-muted">
              Each row includes class, root cause, and proposed fix.
            </p>
          </div>
          <div className="flex gap-1">
            {(["all", "system", "agent"] as const).map((f) => (
              <button
                key={f}
                className={
                  filter === f
                    ? "rounded-md bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent"
                    : "rounded-md px-3 py-1.5 text-sm text-muted hover:text-foreground"
                }
                type="button"
                onClick={() => setFilter(f)}
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
                  <span className="text-sm font-semibold text-foreground">
                    {f.display}
                  </span>
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
                {f.failed_checks ? (
                  <p className="font-mono text-xs text-muted">
                    checks: {f.failed_checks}
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
