"use client";

import {
  CartesianGrid,
  ComposedChart,
  ErrorBar,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { colorForIndex } from "@/lib/format";
import { profileLanguages } from "@/lib/stats";
import type { LanguageDetail } from "@/lib/types";

type WallBoxPlotProps = {
  languages: LanguageDetail[];
};

/**
 * Compact distribution view: median dot + IQR whiskers (p25–p75) and min/max range.
 * Gives a statistical “feel” without a heavy boxplot library.
 */
export function WallBoxPlot({ languages }: WallBoxPlotProps) {
  const profiles = profileLanguages(languages);
  const data = profiles.map((p, i) => ({
    name: p.display,
    median: p.wallAll.median,
    iqr: [
      p.wallAll.median - p.wallAll.p25,
      p.wallAll.p75 - p.wallAll.median,
    ] as [number, number],
    range: [
      p.wallAll.median - p.wallAll.min,
      p.wallAll.max - p.wallAll.median,
    ] as [number, number],
    fill: colorForIndex(i),
    p25: p.wallAll.p25,
    p75: p.wallAll.p75,
    min: p.wallAll.min,
    max: p.wallAll.max,
    mean: p.wallAll.mean,
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 12, right: 12, left: 0, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5d1" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            unit="s"
            label={{
              value: "wall (s)",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11 },
            }}
          />
          <ZAxis range={[120, 120]} />
          <Tooltip
            formatter={(_value, _name, item) => {
              const p = item?.payload as (typeof data)[number] | undefined;
              if (!p) return ["—", ""];
              return [
                `med ${p.median}s · mean ${p.mean}s · IQR ${p.p25}–${p.p75} · range ${p.min}–${p.max}`,
                p.name,
              ];
            }}
          />
          <Scatter dataKey="median" fill="#0f766e">
            <ErrorBar
              dataKey="range"
              width={8}
              strokeWidth={1.5}
              stroke="#94a3b8"
              direction="y"
            />
            <ErrorBar
              dataKey="iqr"
              width={14}
              strokeWidth={3}
              stroke="#0f766e"
              direction="y"
            />
          </Scatter>
        </ComposedChart>
      </ResponsiveContainer>
      <p className="mt-1 text-xs text-muted">
        Dot = median wall · thick bar = IQR (p25–p75) · thin whisker = min–max
        (all cases).
      </p>
    </div>
  );
}
