import { formatPercent, shortCaseId } from "@/lib/format";
import type { CaseDifficulty } from "@/lib/insights";

type HardCasesListProps = {
  rows: CaseDifficulty[];
  limit?: number;
};

export function HardCasesList({ rows, limit = 8 }: HardCasesListProps) {
  const hard = rows.filter((r) => r.failCount > 0).slice(0, limit);
  if (!hard.length) {
    return (
      <p className="text-sm text-muted">No failing cases in this selection.</p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {hard.map((r, i) => (
        <li
          key={r.caseId}
          className="flex flex-col gap-0.5 rounded-lg border border-separator px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <span className="mr-2 text-xs text-muted">#{i + 1}</span>
            <span className="font-mono text-sm">{shortCaseId(r.caseId)}</span>
          </div>
          <div className="text-sm text-muted">
            <span className="tabular-nums text-foreground">
              {r.passCount}/{r.knownCount} pass ({formatPercent(r.passRate)})
            </span>
            {r.failingLanguages.length ? (
              <span> · fails: {r.failingLanguages.join(", ")}</span>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
