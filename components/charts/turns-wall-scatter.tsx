"use client";

import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { colorForIndex, shortCaseId } from "@/lib/format";
import type { LanguageDetail } from "@/lib/types";

type TurnsWallScatterProps = {
  languages: LanguageDetail[];
};

export function TurnsWallScatter({ languages }: TurnsWallScatterProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 12, left: 8, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5d1" />
            <XAxis
              type="number"
              dataKey="turns"
              name="Turns"
              tick={{ fontSize: 11 }}
              label={{
                value: "turns",
                position: "insideBottom",
                offset: -6,
                style: { fontSize: 11 },
              }}
            />
            <YAxis
              type="number"
              dataKey="wall"
              name="Wall (s)"
              unit="s"
              tick={{ fontSize: 11 }}
              label={{
                value: "wall (s)",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 11 },
              }}
            />
            <ZAxis range={[60, 60]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value, name) => [value, String(name)]}
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload as
                  | { lang?: string; caseId?: string; success?: boolean }
                  | undefined;
                if (!p) return "";
                return `${p.lang} · ${shortCaseId(p.caseId ?? "")} · ${
                  p.success ? "PASS" : "FAIL"
                }`;
              }}
            />
            <Legend />
            {languages.map((l, i) => {
              const passes = l.rows
                .filter((r) => r.success)
                .map((r) => ({
                  turns: r.turns,
                  wall: Math.round(r.wallClockSeconds * 10) / 10,
                  caseId: r.caseId,
                  lang: l.display,
                  success: true,
                }));
              const fails = l.rows
                .filter((r) => !r.success)
                .map((r) => ({
                  turns: r.turns,
                  wall: Math.round(r.wallClockSeconds * 10) / 10,
                  caseId: r.caseId,
                  lang: l.display,
                  success: false,
                }));
              return (
                <Scatter
                  key={l.condition}
                  name={l.display}
                  data={[...passes, ...fails]}
                  fill={colorForIndex(i)}
                  fillOpacity={0.85}
                />
              );
            })}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted">
        Each point is one case · hover for PASS/FAIL (failed runs often sit at
        extreme wall/turns)
      </p>
    </div>
  );
}
