"use client";

import { Chip } from "@heroui/react";

import { PassChip } from "@/components/pass-chip";
import { formatSeconds, formatTokens, shortCaseId } from "@/lib/format";
import type { CaseRow } from "@/lib/types";

type Props = {
  rows: CaseRow[];
};

export function ExperimentCaseBriefs({ rows }: Props) {
  if (!rows.length) return null;

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <details
          key={`${row.caseId}-${row.conditionId}`}
          className="group rounded-lg border border-separator bg-surface/60 open:bg-surface/90"
        >
          <summary className="cursor-pointer list-none px-3 py-2.5 marker:content-none">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted transition group-open:rotate-90">
                ▸
              </span>
              <span className="font-mono text-xs font-medium text-foreground">
                {shortCaseId(row.baseCaseId || row.caseId)}
              </span>
              {row.arm ? (
                <Chip className="bg-default-100 text-muted" size="sm">
                  {row.arm}
                </Chip>
              ) : null}
              {row.rule ? (
                <Chip className="bg-default-100 text-muted" size="sm">
                  {row.rule}
                </Chip>
              ) : null}
              <PassChip ok={row.success} />
              <span className="text-xs text-muted">
                {row.turns} turns · {formatSeconds(row.wallClockSeconds)} ·{" "}
                {formatTokens(row.inputTokens)} in
              </span>
            </div>
            {row.setup ? (
              <p className="mt-1 pl-5 text-xs text-muted">{row.setup}</p>
            ) : null}
          </summary>

          <div className="space-y-3 border-t border-separator/70 px-3 py-3">
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted">Condition</dt>
                <dd className="font-mono text-xs text-foreground">
                  {row.conditionId}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Model / backend</dt>
                <dd className="text-xs text-foreground">
                  {row.model || "—"} · {row.backend || "—"}
                </dd>
              </div>
              {row.how ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted">How it works</dt>
                  <dd className="text-foreground">{row.how}</dd>
                </div>
              ) : null}
              {!row.success && row.failureSummary ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted">Failure</dt>
                  <dd className="text-foreground">{row.failureSummary}</dd>
                </div>
              ) : null}
            </dl>

            {row.prompt ? (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
                  Prompt
                </p>
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-separator bg-content2/40 p-3 text-xs leading-relaxed text-foreground">
                  {row.prompt}
                </pre>
              </div>
            ) : (
              <p className="text-xs text-muted">
                No prompt stored for this run.
              </p>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
