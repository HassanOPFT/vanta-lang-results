"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { colorForIndex, shortCaseId } from "@/lib/format";
import {
  formatMetric,
  metricDef,
  metricValue,
  type MetricKey,
} from "@/lib/metrics";
import type { LanguageDetail } from "@/lib/types";

type PerCaseMetricProps = {
  languages: LanguageDetail[];
  metric: MetricKey;
};

const LINE_THRESHOLD = 6;

export function PerCaseMetric({ languages, metric }: PerCaseMetricProps) {
  const def = metricDef(metric);
  const caseIds = Array.from(
    new Set(languages.flatMap((l) => l.rows.map((r) => r.caseId))),
  ).sort();

  const data = caseIds.map((caseId) => {
    const point: Record<string, string | number | boolean | null> = {
      name: shortCaseId(caseId),
      caseId,
    };
    for (const lang of languages) {
      const row = lang.rows.find((r) => r.caseId === caseId);
      point[lang.display] = row ? metricValue(row, metric) : null;
      point[`${lang.display}__fail`] = row ? !row.success : false;
    }
    return point;
  });

  const useLines = languages.length > LINE_THRESHOLD;

  return (
    <div className="flex flex-col gap-2">
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {useLines ? (
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, left: 4, bottom: 64 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5d1" />
              <XAxis
                dataKey="name"
                angle={-40}
                textAnchor="end"
                interval={0}
                height={70}
                tick={{ fontSize: 9 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, name) => [
                  formatMetric(
                    typeof value === "number" ? value : null,
                    metric,
                  ),
                  String(name),
                ]}
              />
              <Legend />
              {languages.map((l, i) => (
                <Line
                  key={l.condition}
                  type="monotone"
                  dataKey={l.display}
                  stroke={colorForIndex(i)}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          ) : (
            <BarChart
              data={data}
              margin={{ top: 8, right: 12, left: 4, bottom: 64 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5d1" />
              <XAxis
                dataKey="name"
                angle={-40}
                textAnchor="end"
                interval={0}
                height={70}
                tick={{ fontSize: 9 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, name) => [
                  formatMetric(
                    typeof value === "number" ? value : null,
                    metric,
                  ),
                  String(name),
                ]}
              />
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
          )}
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted">
        Metric: {def.label}
        {useLines
          ? " · line mode (many languages) — toggle fewer langs for grouped bars"
          : " · grouped bars · failed runs still plotted (see heatmap for PASS/FAIL)"}
      </p>
    </div>
  );
}
