"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { colorForIndex, shortCaseId } from "@/lib/format";
import { metricDef, metricValue, pctDiff, type MetricKey } from "@/lib/metrics";
import type { LanguageDetail } from "@/lib/types";

type PctDiffBarsProps = {
  languages: LanguageDetail[];
  baselineCondition: string;
  metric: MetricKey;
};

export function PctDiffBars({
  languages,
  baselineCondition,
  metric,
}: PctDiffBarsProps) {
  const baseline = languages.find((l) => l.condition === baselineCondition);
  const others = languages.filter((l) => l.condition !== baselineCondition);
  const def = metricDef(metric);

  if (!baseline || !others.length) {
    return (
      <p className="text-sm text-muted">
        Pick a baseline and at least one other language to see % differences.
      </p>
    );
  }

  const caseIds = Array.from(
    new Set(languages.flatMap((l) => l.rows.map((r) => r.caseId))),
  ).sort();

  const data = caseIds.map((caseId) => {
    const baseRow = baseline.rows.find((r) => r.caseId === caseId);
    const baseVal = baseRow ? metricValue(baseRow, metric) : null;
    const point: Record<string, string | number | null> = {
      name: shortCaseId(caseId),
    };
    for (const lang of others) {
      const row = lang.rows.find((r) => r.caseId === caseId);
      const val = row ? metricValue(row, metric) : null;
      point[lang.display] = pctDiff(val, baseVal);
    }
    return point;
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="h-[520px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5d1" />
            <XAxis type="number" unit="%" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 10 }}
            />
            <ReferenceLine x={0} stroke="#64748b" />
            <Tooltip formatter={(value) => [`${value}%`, ""]} />
            <Legend />
            {others.map((l) => {
              const colorIdx = languages.findIndex(
                (x) => x.condition === l.condition,
              );
              return (
                <Bar
                  key={l.condition}
                  dataKey={l.display}
                  fill={colorForIndex(colorIdx)}
                  radius={[0, 2, 2, 0]}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted">
        Positive = language needed more {def.label.toLowerCase()} than{" "}
        {baseline.display}. Formula: (lang − baseline) / baseline.
      </p>
    </div>
  );
}
