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
import { wallHistogram } from "@/lib/stats";
import type { LanguageDetail } from "@/lib/types";

type WallHistogramProps = {
  languages: LanguageDetail[];
};

export function WallHistogram({ languages }: WallHistogramProps) {
  const data = wallHistogram(languages, 8);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 24 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5d1" />
          <XAxis
            dataKey="bin"
            tick={{ fontSize: 10 }}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={50}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11 }}
            label={{
              value: "cases",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11 },
            }}
          />
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
