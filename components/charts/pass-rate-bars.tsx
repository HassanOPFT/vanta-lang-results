"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { LanguageSummary } from "@/lib/types";

type PassRateBarsProps = {
  languages: LanguageSummary[];
};

export function PassRateBars({ languages }: PassRateBarsProps) {
  const data = languages.map((l) => ({
    name: l.display,
    passRate: l.passRate,
    pass: l.honestPass,
    fail: l.honestFail,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-separator" />
          <XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={60} tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
          <Tooltip
            formatter={(value, name) => {
              if (name === "passRate") return [`${value}%`, "Pass rate"];
              return [value, name];
            }}
            labelFormatter={(label) => String(label)}
          />
          <Bar dataKey="passRate" fill="#0f766e" radius={[4, 4, 0, 0]} name="passRate" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
