"use client";

import { Table } from "@heroui/react";

import { PassChip } from "@/components/pass-chip";
import { formatSeconds, formatTokens, shortCaseId } from "@/lib/format";
import type { CaseRow } from "@/lib/types";

type CaseTableProps = {
  rows: CaseRow[];
};

export function CaseTable({ rows }: CaseTableProps) {
  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="Case results" className="min-w-[720px]">
          <Table.Header>
            <Table.Column isRowHeader>Case</Table.Column>
            <Table.Column>Result</Table.Column>
            <Table.Column>Turns</Table.Column>
            <Table.Column>Wall</Table.Column>
            <Table.Column>Input tok</Table.Column>
            <Table.Column>Output tok</Table.Column>
            <Table.Column>Issues</Table.Column>
          </Table.Header>
          <Table.Body>
            {rows.map((row) => (
              <Table.Row key={row.caseId}>
                <Table.Cell className="font-mono text-xs">{shortCaseId(row.caseId)}</Table.Cell>
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
