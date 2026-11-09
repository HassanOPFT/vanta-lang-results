import { formatPercent, formatSeconds, formatTokens } from "@/lib/format";
import { pctDiff } from "@/lib/metrics";
import type { LanguageDetail } from "@/lib/types";

type CompareKpisProps = {
  languages: LanguageDetail[];
  baselineCondition: string;
};

function sumWall(l: LanguageDetail) {
  return l.rows.reduce((a, r) => a + r.wallClockSeconds, 0);
}
function sumInput(l: LanguageDetail) {
  return l.rows.reduce((a, r) => a + r.inputTokens, 0);
}
function sumTurns(l: LanguageDetail) {
  return l.rows.reduce((a, r) => a + r.turns, 0);
}

export function CompareKpis({
  languages,
  baselineCondition,
}: CompareKpisProps) {
  const baseline = languages.find((l) => l.condition === baselineCondition);
  if (!languages.length) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {languages.map((l) => {
        const vs =
          baseline && l.condition !== baseline.condition
            ? {
                wall: pctDiff(sumWall(l), sumWall(baseline)),
                tokens: pctDiff(sumInput(l), sumInput(baseline)),
                turns: pctDiff(sumTurns(l), sumTurns(baseline)),
              }
            : null;
        const fails = l.rows
          .filter((r) => !r.success)
          .map((r) => r.caseId.replace(/^case_/, ""));
        return (
          <div
            key={l.condition}
            className="rounded-xl border border-separator bg-surface/70 px-4 py-3"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {l.display}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {l.honestPass}/{l.cases}
              <span className="ml-2 text-base font-medium text-muted">
                {formatPercent(l.passRate)}
              </span>
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-muted">
              <div>
                <dt>Wall sum</dt>
                <dd className="tabular-nums text-foreground">
                  {formatSeconds(sumWall(l))}
                </dd>
              </div>
              <div>
                <dt>Input tok</dt>
                <dd className="tabular-nums text-foreground">
                  {formatTokens(sumInput(l))}
                </dd>
              </div>
              <div>
                <dt>Mean wall (pass)</dt>
                <dd className="tabular-nums text-foreground">
                  {formatSeconds(l.meanWallPass)}
                </dd>
              </div>
              <div>
                <dt>Turns sum</dt>
                <dd className="tabular-nums text-foreground">{sumTurns(l)}</dd>
              </div>
            </dl>
            {vs ? (
              <p className="mt-2 text-xs text-muted">
                vs {baseline?.display}: wall{" "}
                <span className="tabular-nums text-foreground">
                  {vs.wall == null
                    ? "—"
                    : `${vs.wall > 0 ? "+" : ""}${vs.wall}%`}
                </span>
                {" · "}tok{" "}
                <span className="tabular-nums text-foreground">
                  {vs.tokens == null
                    ? "—"
                    : `${vs.tokens > 0 ? "+" : ""}${vs.tokens}%`}
                </span>
                {" · "}turns{" "}
                <span className="tabular-nums text-foreground">
                  {vs.turns == null
                    ? "—"
                    : `${vs.turns > 0 ? "+" : ""}${vs.turns}%`}
                </span>
              </p>
            ) : (
              <p className="mt-2 text-xs text-accent">Baseline</p>
            )}
            {fails.length ? (
              <p className="mt-1 text-[11px] text-danger">
                fails: {fails.slice(0, 4).join(", ")}
                {fails.length > 4 ? ` +${fails.length - 4}` : ""}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-success">no fails</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
