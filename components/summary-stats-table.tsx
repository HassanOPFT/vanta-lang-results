"use client";

import { Table } from "@heroui/react";

import { formatPercent, formatSeconds, formatTokens } from "@/lib/format";
import { profileLanguages } from "@/lib/stats";
import type { LanguageDetail } from "@/lib/types";

type SummaryStatsTableProps = {
  languages: LanguageDetail[];
};

export function SummaryStatsTable({ languages }: SummaryStatsTableProps) {
  const rows = profileLanguages(languages);

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content
          aria-label="Summary statistics"
          className="min-w-[900px]"
        >
          <Table.Header>
            <Table.Column isRowHeader>Language</Table.Column>
            <Table.Column>Pass %</Table.Column>
            <Table.Column>Wall mean</Table.Column>
            <Table.Column>Wall median</Table.Column>
            <Table.Column>Wall p90</Table.Column>
            <Table.Column>Wall σ</Table.Column>
            <Table.Column>Turns med</Table.Column>
            <Table.Column>Input mean</Table.Column>
            <Table.Column>Out mean</Table.Column>
          </Table.Header>
          <Table.Body>
            {rows.map((r) => (
              <Table.Row key={r.condition}>
                <Table.Cell>{r.display}</Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatPercent(r.passRate)}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatSeconds(r.wallAll.mean)}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatSeconds(r.wallAll.median)}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatSeconds(r.wallAll.p90)}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatSeconds(r.wallAll.stdev)}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {r.turns.median}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatTokens(Math.round(r.inputTokens.mean))}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatTokens(Math.round(r.outputTokens.mean))}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
