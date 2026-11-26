"use client";

import { useMemo, useState } from "react";

import { PassChip } from "@/components/pass-chip";
import { formatSeconds, formatTokens, shortCaseId } from "@/lib/format";
import type { LanguageDetail } from "@/lib/types";

type Props = {
  languages: LanguageDetail[];
};

type FlatRow = {
  caseId: string;
  lang: LanguageDetail;
  row: LanguageDetail["rows"][number] | null;
  isCaseStart: boolean;
  caseSpan: number;
  caseIndex: number;
};

export function ExperimentCaseCompareTable({ languages }: Props) {
  const [selected, setSelected] = useState<string[]>(() =>
    languages.map((l) => l.condition),
  );

  const active = useMemo(
    () => languages.filter((l) => selected.includes(l.condition)),
    [languages, selected],
  );

  const caseIds = useMemo(() => {
    const set = new Set<string>();
    for (const lang of languages) {
      for (const row of lang.rows) set.add(row.caseId);
    }
    return Array.from(set).sort();
  }, [languages]);

  const flatRows = useMemo(() => {
    const out: FlatRow[] = [];
    caseIds.forEach((caseId, caseIndex) => {
      const span = active.length;
      active.forEach((lang, idx) => {
        out.push({
          caseId,
          lang,
          row: lang.rows.find((r) => r.caseId === caseId) ?? null,
          isCaseStart: idx === 0,
          caseSpan: span,
          caseIndex,
        });
      });
    });
    return out;
  }, [active, caseIds]);

  function toggle(condition: string) {
    setSelected((prev) => {
      if (prev.includes(condition)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== condition);
      }
      return [...prev, condition];
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted">
          Case cell spans languages; metric columns stay aligned.
        </p>
        <div className="flex flex-wrap gap-1">
          {languages.map((lang) => {
            const on = selected.includes(lang.condition);
            return (
              <button
                key={lang.condition}
                type="button"
                className={
                  on
                    ? "rounded-md bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent"
                    : "rounded-md px-3 py-1.5 text-sm text-muted hover:text-foreground"
                }
                onClick={() => toggle(lang.condition)}
              >
                {lang.display}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-separator">
        <table className="min-w-[720px] w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-separator bg-content2/40 text-left text-xs text-muted">
              <th className="px-3 py-2 font-medium">Case</th>
              <th className="px-3 py-2 font-medium">Lang</th>
              <th className="px-3 py-2 font-medium">Result</th>
              <th className="px-3 py-2 font-medium">Turns</th>
              <th className="px-3 py-2 font-medium">Wall</th>
              <th className="px-3 py-2 font-medium">In tok</th>
              <th className="px-3 py-2 font-medium">Out tok</th>
            </tr>
          </thead>
          <tbody>
            {flatRows.map((item) => {
              // Band on every td (not tr) so rowspan + lang rows stay one color.
              const band =
                item.caseIndex % 2 === 0
                  ? "bg-transparent"
                  : "bg-black/[0.035] dark:bg-white/[0.05]";
              const cell = `px-3 py-2 ${band}`;
              return (
                <tr
                  key={`${item.caseId}-${item.lang.condition}`}
                  className={
                    item.isCaseStart
                      ? "border-t border-separator first:border-t-0"
                      : "border-t border-separator/30"
                  }
                >
                  {item.isCaseStart ? (
                    <td
                      rowSpan={item.caseSpan}
                      className={`align-top font-mono text-xs font-medium text-foreground ${cell}`}
                    >
                      {shortCaseId(item.caseId)}
                    </td>
                  ) : null}
                  <td className={`${cell} text-foreground`}>
                    {item.lang.display}
                  </td>
                  <td className={cell}>
                    {item.row ? <PassChip ok={item.row.success} /> : "—"}
                  </td>
                  <td className={`${cell} tabular-nums`}>
                    {item.row ? item.row.turns : "—"}
                  </td>
                  <td className={`${cell} tabular-nums`}>
                    {item.row ? formatSeconds(item.row.wallClockSeconds) : "—"}
                  </td>
                  <td className={`${cell} tabular-nums`}>
                    {item.row ? formatTokens(item.row.inputTokens) : "—"}
                  </td>
                  <td className={`${cell} tabular-nums`}>
                    {item.row ? formatTokens(item.row.outputTokens) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
