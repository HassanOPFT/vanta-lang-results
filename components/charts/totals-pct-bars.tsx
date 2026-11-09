"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { METRICS, metricValue, pctDiff, type MetricKey } from "@/lib/metrics";
import type { LanguageDetail } from "@/lib/types";

type TotalsPctBarsProps = {
  languages: LanguageDetail[];
  baselineCondition: string;
  /** Highlight the currently selected metric. */
  focusMetric?: MetricKey;
};

function sumMetric(lang: LanguageDetail, key: MetricKey): number {
  return lang.rows.reduce((a, r) => a + metricValue(r, key), 0);
}

export function TotalsPctBars({
  languages,
  baselineCondition,
  focusMetric,
}: TotalsPctBarsProps) {
  const baseline = languages.find((l) => l.condition === baselineCondition);
  const others = languages.filter((l) => l.condition !== baselineCondition);

  if (!baseline || !others.length) {
    return (
      <p className="text-sm text-muted">
        Need baseline + another language for totals % diff.
      </p>
    );
  }

  // One grouped chart: for each metric, one bar per non-baseline language
  const data = METRICS.map((m) => {
    const baseSum = sumMetric(baseline, m.key);
    const row: Record<string, string | number | null> = {
      metric: m.label,
      key: m.key,
    };
    for (const lang of others) {
      row[lang.display] = pctDiff(sumMetric(lang, m.key), baseSum);
    }
    return row;
  });

  // If only one other language, simple single-series colored bars (EN-vs-SR style)
  if (others.length === 1) {
    const lang = others[0];
    const simple = data.map((d) => ({
      metric: d.metric,
      key: d.key,
      value: d[lang.display] as number | null,
    }));
    return (
      <div className="flex flex-col gap-2">
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={simple}
              margin={{ top: 8, right: 12, left: 4, bottom: 48 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5d1" />
              <XAxis
                dataKey="metric"
                angle={-24}
                textAnchor="end"
                interval={0}
                height={60}
                tick={{ fontSize: 10 }}
              />
              <YAxis unit="%" tick={{ fontSize: 11 }} />
              <ReferenceLine y={0} stroke="#64748b" />
              <Tooltip
                formatter={(v) => [
                  `${v}%`,
                  `${lang.display} vs ${baseline.display}`,
                ]}
              />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {simple.map((d) => (
                  <Cell
                    key={String(d.key)}
                    fill={
                      d.key === focusMetric
                        ? "#0f766e"
                        : (d.value ?? 0) >= 0
                          ? "#c2410c"
                          : "#2563eb"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted">
          Summed over all cases · {lang.display} vs {baseline.display}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 12, left: 4, bottom: 48 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5d1" />
            <XAxis
              dataKey="metric"
              angle={-24}
              textAnchor="end"
              interval={0}
              height={60}
              tick={{ fontSize: 10 }}
            />
            <YAxis unit="%" tick={{ fontSize: 11 }} />
            <ReferenceLine y={0} stroke="#64748b" />
            <Tooltip formatter={(v) => [`${v}%`, ""]} />
            <Legend />
            {others.map((l, i) => (
              <Bar
                key={l.condition}
                dataKey={l.display}
                fill={
                  [
                    "#c2410c",
                    "#0f766e",
                    "#1d4ed8",
                    "#a16207",
                    "#be123c",
                    "#047857",
                  ][i % 6]
                }
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted">
        Summed over all cases · % vs {baseline.display} for each selected
        language
      </p>
    </div>
  );
}
