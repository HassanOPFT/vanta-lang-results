"use client";

import { MermaidDiagram } from "@/components/mermaid-diagram";
import type { ExperimentReport } from "@/lib/experiments";

type Props = {
  report: ExperimentReport;
};

export function ExperimentReportView({ report }: Props) {
  const flow = report.flows[0];

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          How it works
        </p>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {report.title}
        </h2>
        {report.blurb ? (
          <p className="max-w-2xl text-sm text-muted">{report.blurb}</p>
        ) : null}
      </header>

      {flow ? <MermaidDiagram chart={flow.mermaid} /> : null}
    </section>
  );
}
