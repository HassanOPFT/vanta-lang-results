"use client";

import { Card, Chip, Spinner } from "@heroui/react";
import NextLink from "next/link";
import { useEffect, useState } from "react";

import { StatCard } from "@/components/stat-card";
import {
  loadExperimentRegistry,
  type ExperimentSummary,
} from "@/lib/experiments";
import { formatPercent } from "@/lib/format";

export default function ExperimentsPage() {
  const [items, setItems] = useState<ExperimentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExperimentRegistry()
      .then(setItems)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm">
        {error}
      </div>
    );
  }

  if (!items) {
    return (
      <div className="flex min-h-[40vh] items-center gap-3 text-muted">
        <Spinner size="sm" />
        Loading experiments…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Experiments
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Annotated harness runs
        </h1>
        <p className="max-w-2xl text-sm text-muted">
          Separate from the main language board. Each experiment ships honest
          pass/fail plus failure debug notes.
        </p>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-muted">No experiments published yet.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {items.map((exp) => (
            <li key={exp.slug}>
              <NextLink
                className="block no-underline"
                href={`/experiments/${exp.slug}`}
              >
                <Card className="h-full cursor-pointer border border-separator bg-surface/80 shadow-none transition-colors hover:border-accent/40">
                  <Card.Content className="flex flex-col gap-4 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-lg font-semibold text-foreground">
                          {exp.title}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {exp.subtitle}
                        </p>
                        <p className="mt-2 font-mono text-xs text-muted">
                          /experiments/{exp.slug}
                        </p>
                      </div>
                      <Chip className="bg-accent/15 text-accent" size="sm">
                        {formatPercent(exp.passRate)}
                      </Chip>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <StatCard
                        label="Langs"
                        value={String(exp.languageCount)}
                      />
                      <StatCard
                        label="Pass"
                        value={`${exp.honestPass}`}
                        hint={`${exp.honestFail} fail`}
                      />
                      <StatCard
                        label="System"
                        value={String(exp.systemFails)}
                      />
                      <StatCard label="Agent" value={String(exp.agentFails)} />
                    </div>
                  </Card.Content>
                </Card>
              </NextLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
