"use client";

import { Table } from "@heroui/react";

import { formatPercent, formatSeconds, formatTokens } from "@/lib/format";
import type { LangDelta } from "@/lib/insights";

type DeltaTableProps = {
  rows: LangDelta[];
  baselineLabel: string;
};

export function DeltaTable({ rows, baselineLabel }: DeltaTableProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted">
        Deltas relative to{" "}
        <span className="font-medium text-foreground">{baselineLabel}</span>
      </p>
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Baseline deltas" className="min-w-[640px]">
            <Table.Header>
              <Table.Column isRowHeader>Language</Table.Column>
              <Table.Column>Pass rate</Table.Column>
              <Table.Column>Δ pass</Table.Column>
              <Table.Column>Mean wall</Table.Column>
              <Table.Column>Δ wall</Table.Column>
              <Table.Column>Input tok</Table.Column>
              <Table.Column>× tokens</Table.Column>
            </Table.Header>
            <Table.Body>
              {rows.map((r) => (
                <Table.Row key={r.condition}>
                  <Table.Cell>{r.display}</Table.Cell>
                  <Table.Cell className="tabular-nums">
                    {formatPercent(r.passRate)}
                  </Table.Cell>
                  <Table.Cell
                    className={`tabular-nums ${
                      r.deltaPassRate > 0
                        ? "text-success"
                        : r.deltaPassRate < 0
                          ? "text-danger"
                          : "text-muted"
                    }`}
                  >
                    {r.deltaPassRate > 0 ? "+" : ""}
                    {r.deltaPassRate} pp
                  </Table.Cell>
                  <Table.Cell className="tabular-nums">
                    {formatSeconds(r.meanWallPass)}
                  </Table.Cell>
                  <Table.Cell className="tabular-nums text-muted">
                    {r.deltaWall == null
                      ? "—"
                      : `${r.deltaWall > 0 ? "+" : ""}${r.deltaWall}s`}
                  </Table.Cell>
                  <Table.Cell className="tabular-nums">
                    {formatTokens(r.totalInputTokens)}
                  </Table.Cell>
                  <Table.Cell className="tabular-nums text-muted">
                    {r.tokenRatio == null ? "—" : `${r.tokenRatio}×`}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}
