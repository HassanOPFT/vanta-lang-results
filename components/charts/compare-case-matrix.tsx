"use client";

import { shortCaseId } from "@/lib/format";
import type { LanguageDetail } from "@/lib/types";

type CompareCaseMatrixProps = {
  languages: LanguageDetail[];
};

export function CompareCaseMatrix({ languages }: CompareCaseMatrixProps) {
  const caseIds = Array.from(
    new Set(languages.flatMap((l) => l.rows.map((r) => r.caseId))),
  ).sort();

  const lookup = new Map(
    languages.map((l) => [
      l.condition,
      new Map(l.rows.map((r) => [r.caseId, r.success] as const)),
    ]),
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-separator">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-surface">
            <th className="sticky left-0 z-10 bg-surface px-3 py-2 text-left font-medium">
              Case
            </th>
            {languages.map((l) => (
              <th key={l.condition} className="px-3 py-2 text-center font-medium">
                {l.display}
              </th>
            ))}
            <th className="px-3 py-2 text-center font-medium">Agreement</th>
          </tr>
        </thead>
        <tbody>
          {caseIds.map((caseId) => {
            const outcomes = languages.map(
              (l) => lookup.get(l.condition)?.get(caseId) ?? null,
            );
            const known = outcomes.filter((o) => o !== null);
            const allPass = known.length > 0 && known.every(Boolean);
            const allFail = known.length > 0 && known.every((o) => o === false);
            const agreement = allPass ? "all pass" : allFail ? "all fail" : "split";

            return (
              <tr key={caseId} className="border-t border-separator">
                <td className="sticky left-0 z-10 bg-background px-3 py-2 font-mono text-xs">
                  {shortCaseId(caseId)}
                </td>
                {outcomes.map((ok, i) => (
                  <td key={`${caseId}-${languages[i].condition}`} className="px-3 py-2 text-center">
                    {ok === null ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <span
                        className={
                          ok
                            ? "inline-block rounded px-2 py-0.5 text-xs font-semibold text-success-foreground bg-success/20"
                            : "inline-block rounded px-2 py-0.5 text-xs font-semibold text-danger-foreground bg-danger/20"
                        }
                      >
                        {ok ? "P" : "F"}
                      </span>
                    )}
                  </td>
                ))}
                <td className="px-3 py-2 text-center text-xs text-muted">{agreement}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
