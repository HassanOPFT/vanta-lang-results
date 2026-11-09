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
import type { CaseRow } from "@/lib/types";

type CaseWallBarsProps = {
  rows: CaseRow[];
};

export function CaseWallBars({ rows }: CaseWallBarsProps) {
  const data = rows.map((r) => ({
    name: shortCaseId(r.caseId),
    wall: Math.round(r.wallClockSeconds * 10) / 10,
    success: r.success,
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 64 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-separator" />
          <XAxis dataKey="name" angle={-40} textAnchor="end" interval={0} height={70} tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 11 }} unit="s" />
          <Tooltip
            formatter={(value) => [`${value}s`, "Wall clock"]}
            labelFormatter={(label) => String(label)}
          />
          <Bar dataKey="wall" radius={[3, 3, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.success ? "#0f766e" : "#be123c"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
