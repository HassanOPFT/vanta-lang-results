"use client";

import { Table } from "@heroui/react";

import { PassChip } from "@/components/pass-chip";
import { formatSeconds, formatTokens, shortCaseId } from "@/lib/format";
import type { CaseRow } from "@/lib/types";

type CaseTableProps = {
  rows: CaseRow[];
};

export function CaseTable({ rows }: CaseTableProps) {
  const showFailure = rows.some(
    (r) => !r.success && (r.failureSummary || r.failureClass),
  );

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content
          aria-label="Case results"
          className={showFailure ? "min-w-[980px]" : "min-w-[720px]"}
        >
          <Table.Header>
            <Table.Column isRowHeader>Case</Table.Column>
            <Table.Column>Result</Table.Column>
            <Table.Column>Turns</Table.Column>
            <Table.Column>Wall</Table.Column>
            <Table.Column>Input tok</Table.Column>
            <Table.Column>Output tok</Table.Column>
            {showFailure ? <Table.Column>Class</Table.Column> : null}
            {showFailure ? <Table.Column>Failure</Table.Column> : null}
            <Table.Column>Issues</Table.Column>
          </Table.Header>
          <Table.Body>
            {rows.map((row) => (
              <Table.Row key={row.caseId}>
                <Table.Cell className="font-mono text-xs">
                  {shortCaseId(row.caseId)}
                </Table.Cell>
                <Table.Cell>
                  <PassChip ok={row.success} />
                </Table.Cell>
                <Table.Cell className="tabular-nums">{row.turns}</Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatSeconds(row.wallClockSeconds)}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatTokens(row.inputTokens)}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatTokens(row.outputTokens)}
                </Table.Cell>
                {showFailure ? (
                  <Table.Cell className="text-xs capitalize text-muted">
                    {row.failureClass || "—"}
                  </Table.Cell>
                ) : null}
                {showFailure ? (
                  <Table.Cell className="max-w-md text-xs text-muted">
                    {row.failureSummary || row.proposedFix || "—"}
                  </Table.Cell>
                ) : null}
                <Table.Cell className="text-xs text-muted">
                  {row.validationIssues || "—"}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
