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
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          How it works
        </p>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {report.title}
        </h2>
        {report.blurb ? (
          <p className="max-w-3xl text-sm text-muted">{report.blurb}</p>
        ) : null}
      </header>

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

      {report.layers?.length ? (
        <CollapsibleSection
          title="Layers (top-down)"
          description="Progressive stack from policy → verify"
          defaultOpen
        >
          <ol className="grid gap-2 sm:grid-cols-2">
            {report.layers.map((layer) => (
              <li
                key={layer.level}
                className="rounded-md border border-separator bg-surface/80 p-3"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  L{layer.level} · {layer.title}
                </p>
                <p className="mt-1 text-sm text-foreground">{layer.body}</p>
              </li>
            ))}
          </ol>
        </CollapsibleSection>
      ) : null}

      {report.flows?.map((flow, idx) => (
        <CollapsibleSection
          key={flow.id}
          title={flow.title}
          description="Mermaid flow"
          defaultOpen={idx === 0}
        >
          <MermaidDiagram chart={flow.mermaid} />
        </CollapsibleSection>
      ))}

      {catalog.length ? (
        <CollapsibleSection
          id="case-catalog"
          title={`Case catalog (${catalog.length})`}
          description="Rule · setup · how it works · EN/AR A/B · short TLDR"
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
