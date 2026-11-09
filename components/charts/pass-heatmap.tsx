"use client";

import { shortCaseId } from "@/lib/format";
import { heatmapGrid } from "@/lib/stats";
import type { LanguageDetail } from "@/lib/types";

type PassHeatmapProps = {
  languages: LanguageDetail[];
};

export function PassHeatmap({ languages }: PassHeatmapProps) {
  const grid = heatmapGrid(languages);
  const colTemplate = `minmax(9rem,1.4fr) repeat(${grid.languages.length}, minmax(2.5rem,1fr))`;

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-1 text-xs"
        style={{
          gridTemplateColumns: colTemplate,
          minWidth: `${10 + grid.languages.length * 3}rem`,
        }}
      >
        <div className="px-1 py-1 font-medium text-muted">Case</div>
        {grid.languages.map((l) => (
          <div
            key={l.condition}
            className="truncate px-1 py-1 text-center font-medium"
            title={l.display}
          >
            {l.display}
          </div>
        ))}
        {grid.caseIds.map((caseId) => (
          <div key={caseId} className="contents">
            <div className="truncate px-1 py-1 font-mono text-[11px] text-muted">
              {shortCaseId(caseId)}
            </div>
            {grid.languages.map((l) => {
              const cell = grid.cells.get(`${l.condition}::${caseId}`);
              const ok = cell?.success;
              const title =
                ok == null
                  ? "missing"
                  : `${l.display}: ${ok ? "PASS" : "FAIL"}${
                      cell?.wall != null ? ` · ${Math.round(cell.wall)}s` : ""
                    }`;
              return (
                <div
                  key={`${l.condition}-${caseId}`}
                  title={title}
                  className={`h-7 rounded-sm ${
                    ok == null
                      ? "bg-separator/40"
                      : ok
                        ? "bg-teal-700/85"
                        : "bg-rose-700/85"
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        Teal = honest PASS · Rose = FAIL · Gray = missing. Hover a cell for wall
        time.
      </p>
    </div>
  );
}
