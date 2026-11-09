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
import { scatterPoints } from "@/lib/stats";
import type { LanguageDetail } from "@/lib/types";

type TokensWallScatterProps = {
  languages: LanguageDetail[];
};

export function TokensWallScatter({ languages }: TokensWallScatterProps) {
  const points = scatterPoints(languages);

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 12, left: 8, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5d1" />
          <XAxis
            type="number"
            dataKey="inputTokens"
            name="Input tokens"
            tick={{ fontSize: 10 }}
            tickFormatter={(v) =>
              v >= 1_000_000
                ? `${(v / 1_000_000).toFixed(1)}M`
                : `${Math.round(v / 1000)}k`
            }
            label={{
              value: "input tokens",
              position: "insideBottom",
              offset: -8,
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
          <ZAxis range={[40, 40]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            formatter={(value, name) => [value, String(name)]}
            labelFormatter={(_, payload) => {
              const p = payload?.[0]?.payload as
                | { lang?: string; caseId?: string; success?: boolean }
                | undefined;
              if (!p) return "";
              return `${p.lang} · ${shortCaseId(p.caseId ?? "")} · ${p.success ? "PASS" : "FAIL"}`;
            }}
          />
          <Legend />
          {languages.map((l, i) => {
            const data = points.filter((p) => p.condition === l.condition);
            return (
              <Scatter
                key={l.condition}
                name={l.display}
                data={data}
                fill={colorForIndex(i)}
                fillOpacity={0.75}
              />
            );
          })}
        </ScatterChart>
      </ResponsiveContainer>
      <p className="mt-1 text-xs text-muted">
        Each point is one case. Clusters high-right = expensive + slow; check
        FAIL outliers.
      </p>
    </div>
  );
}
