"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { shortCaseId } from "@/lib/format";
import type { CaseDifficulty } from "@/lib/insights";

type CaseDifficultyBarsProps = {
  rows: CaseDifficulty[];
  /** Show only the N hardest (lowest pass rate). */
  limit?: number;
};

export function CaseDifficultyBars({
  rows,
  limit = 12,
}: CaseDifficultyBarsProps) {
  const data = rows.slice(0, limit).map((r) => ({
    name: shortCaseId(r.caseId),
    passRate: r.passRate,
    failCount: r.failCount,
    knownCount: r.knownCount,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 56 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5d1" />
          <XAxis
            dataKey="name"
            angle={-32}
            textAnchor="end"
            interval={0}
            height={64}
            tick={{ fontSize: 10 }}
          />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
          <Tooltip
            formatter={(value, name) => {
              if (name === "passRate")
                return [`${value}%`, "Pass across selected"];
              return [value, String(name)];
            }}
          />
          <Bar dataKey="passRate" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell
                key={d.name}
                fill={
                  d.passRate >= 80
                    ? "#0f766e"
                    : d.passRate >= 50
                      ? "#a16207"
                      : "#be123c"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
