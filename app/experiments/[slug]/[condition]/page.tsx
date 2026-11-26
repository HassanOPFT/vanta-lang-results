"use client";

import { Spinner } from "@heroui/react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { CaseTable } from "@/components/case-table";
import { CollapsibleSection } from "@/components/collapsible-section";
import { ExperimentCaseBriefs } from "@/components/experiment-case-briefs";
import { StatCard } from "@/components/stat-card";
import { loadExperimentLang, toLanguageDetail } from "@/lib/experiments";
import {
  formatPercent,
  formatSeconds,
  formatTokens,
  shortCaseId,
} from "@/lib/format";
import type { LanguageDetail } from "@/lib/types";

export default function ExperimentLanguagePage() {
  const params = useParams<{ slug: string; condition: string }>();
  const slug = params.slug;
  const condition = params.condition;
  const [data, setData] = useState<LanguageDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !condition) return;
    loadExperimentLang(slug, condition)
      .then((lang) => setData(toLanguageDetail(lang)))
      .catch((err: Error) => setError(err.message));
  }, [slug, condition]);

  const fails = useMemo(() => {
    if (!data) return [];
    return data.rows
      .filter((r) => !r.success)
      .sort((a, b) => b.wallClockSeconds - a.wallClockSeconds);
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
          <NextLink
            className="font-mono no-underline hover:text-foreground"
            href={`/experiments/${slug}`}
          >
            {slug}
          </NextLink>
          <span>/</span>
          <span className="text-foreground">{data.display}</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {data.display}
        </h1>
        <p className="text-sm text-muted">
          {data.honestPass}/{data.cases} PASS · {formatPercent(data.passRate)}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pass / runs"
          value={`${data.honestPass}/${data.cases}`}
        />
        <StatCard label="Fails" value={String(data.honestFail)} />
        <StatCard
          label="Mean wall (pass)"
          value={formatSeconds(data.meanWallPass)}
        />
        <StatCard
          label="Input tokens"
          value={formatTokens(data.totalInputTokens)}
        />
      </div>

      {fails.length ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Fails</h2>
          <ul className="grid gap-2">
            {fails.map((r) => (
              <li
                key={r.caseId}
                className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-mono">
                    {shortCaseId(r.baseCaseId || r.caseId)}
                  </span>
                  {r.arm ? (
                    <span className="text-xs text-muted">{r.arm}</span>
                  ) : null}
                  {r.failureClass ? (
                    <span className="text-xs uppercase tracking-wide text-muted">
                      {r.failureClass}
                    </span>
                  ) : null}
                </div>
                {r.failureSummary ? (
                  <p className="mt-1 text-sm text-foreground">
                    {r.failureSummary}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm">
          All runs PASS in this language.
        </p>
      )}

      <CollapsibleSection
        title={`Case prompts & data (${data.rows.length})`}
        description="Expand a case for setup, how it works, and the exact prompt used"
        defaultOpen
      >
        <ExperimentCaseBriefs rows={data.rows} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Results table"
        description="Turns, wall clock, tokens"
      >
        <CaseTable rows={data.rows} />
      </CollapsibleSection>
    </div>
  );
}
