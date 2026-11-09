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

import { colorForIndex, shortCaseId } from "@/lib/format";
import type { LanguageDetail } from "@/lib/types";

type CompareCaseWallsProps = {
  languages: LanguageDetail[];
};

export function CompareCaseWalls({ languages }: CompareCaseWallsProps) {
  const caseIds = Array.from(
    new Set(languages.flatMap((l) => l.rows.map((r) => r.caseId))),
  ).sort();

  const data = caseIds.map((caseId) => {
    const point: Record<string, string | number> = {
      name: shortCaseId(caseId),
    };
    for (const lang of languages) {
      const row = lang.rows.find((r) => r.caseId === caseId);
      point[lang.display] = row ? Math.round(row.wallClockSeconds * 10) / 10 : 0;
    }
    return point;
  });

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 64 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-separator" />
          <XAxis dataKey="name" angle={-40} textAnchor="end" interval={0} height={70} tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 11 }} unit="s" />
          <Tooltip />
          <Legend />
          {languages.map((l, i) => (
            <Bar
              key={l.condition}
              dataKey={l.display}
              fill={colorForIndex(i)}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
