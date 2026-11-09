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

import { colorForIndex } from "@/lib/format";
import type { LanguageSummary } from "@/lib/types";

type ComparePassBarsProps = {
  languages: LanguageSummary[];
};

export function ComparePassBars({ languages }: ComparePassBarsProps) {
  const data = languages.map((l) => ({
    name: l.display,
    passRate: l.passRate,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-separator" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
          <Tooltip formatter={(value) => [`${value}%`, "Pass rate"]} />
          <Bar dataKey="passRate" name="Pass rate" radius={[4, 4, 0, 0]}>
            {languages.map((l, i) => (
              <Cell key={l.condition} fill={colorForIndex(i)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
