"use client";

import { Chip } from "@heroui/react";

import { CollapsibleSection } from "@/components/collapsible-section";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import type { ExperimentReport } from "@/lib/experiments";

type Props = {
  report: ExperimentReport;
};

function cellTone(value: string) {
  if (value === "PASS") return "bg-success/15 text-success";
  if (value === "FAIL") return "bg-danger/15 text-danger";
  return "bg-default-100 text-muted";
}

export function ExperimentReportView({ report }: Props) {
  const catalog = report.caseCatalog || [];

  return (
    <section className="flex flex-col gap-4">
      {report.blurb ? (
        <p className="max-w-3xl text-sm text-muted">{report.blurb}</p>
      ) : null}

      {report.resultsHeadline?.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {report.resultsHeadline.map((line) => (
            <li
              key={line}
              className="rounded-md border border-separator bg-surface/60 px-3 py-2 text-sm text-foreground"
            >
              {line}
            </li>
          ))}
        </ul>
      ) : null}

      {report.flows?.[0] ? (
        <CollapsibleSection title="Flow" description="Seed → agent → verify">
          <MermaidDiagram chart={report.flows[0].mermaid} />
        </CollapsibleSection>
      ) : null}

      {catalog.length ? (
        <CollapsibleSection
          id="case-catalog"
          title={`Cases (${catalog.length})`}
          description="Setup · how · EN/AR (A/B = policy forks)"
          defaultOpen
        >
          <div className="overflow-x-auto rounded-md border border-separator">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Rule</th>
                  <th className="px-3 py-2 font-medium">Case</th>
                  <th className="px-3 py-2 font-medium">Setup</th>
                  <th className="px-3 py-2 font-medium">How</th>
                  <th className="px-3 py-2 font-medium">EN A</th>
                  <th className="px-3 py-2 font-medium">EN B</th>
                  <th className="px-3 py-2 font-medium">AR A</th>
                  <th className="px-3 py-2 font-medium">AR B</th>
                  <th className="px-3 py-2 font-medium">TLDR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator/60">
                {catalog.map((row) => (
                  <tr key={row.caseId} className="align-top">
                    <td className="px-3 py-2 font-medium text-foreground">
                      {row.rule}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-muted">
                      {row.caseId.replace(/^vu_edu_/, "")}
                    </td>
                    <td className="max-w-[14rem] px-3 py-2 text-muted">
                      {row.setup}
                    </td>
                    <td className="max-w-[16rem] px-3 py-2 text-foreground">
                      {row.how}
                    </td>
                    {(["enA", "enB", "arA", "arB"] as const).map((k) => (
                      <td key={k} className="px-3 py-2">
                        <Chip className={cellTone(row[k])} size="sm">
                          {row[k]}
                        </Chip>
                      </td>
                    ))}
                    <td className="max-w-[18rem] px-3 py-2 text-muted">
                      {row.tldr}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      ) : null}
    </section>
  );
}
