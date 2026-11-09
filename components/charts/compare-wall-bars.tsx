"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { colorForIndex } from "@/lib/format";
import type { LanguageSummary } from "@/lib/types";

type CompareWallBarsProps = {
  languages: LanguageSummary[];
};

export function CompareWallBars({ languages }: CompareWallBarsProps) {
  const data = languages.map((l) => ({
    name: l.display,
    meanWallPass: l.meanWallPass ?? 0,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-separator" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit="s" />
          <Tooltip formatter={(value) => [`${value}s`, "Mean wall (passes)"]} />
          <Legend />
          <Bar
            dataKey="meanWallPass"
            name="Mean wall (passes)"
            fill={colorForIndex(0)}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
