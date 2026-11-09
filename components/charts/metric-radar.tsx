"use client";

import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { colorForIndex } from "@/lib/format";
import { profileLanguages, radarRows } from "@/lib/stats";
import type { LanguageDetail } from "@/lib/types";

type MetricRadarProps = {
  languages: LanguageDetail[];
};

export function MetricRadar({ languages }: MetricRadarProps) {
  const profiles = profileLanguages(languages);
  const data = radarRows(profiles);

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#cbd5d1" />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
          />
          <Tooltip />
          <Legend />
          {languages.map((l, i) => (
            <Radar
              key={l.condition}
              name={l.display}
              dataKey={l.display}
              stroke={colorForIndex(i)}
              fill={colorForIndex(i)}
              fillOpacity={0.18}
              strokeWidth={2}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
      <p className="mt-1 text-xs text-muted">
        Outer = better. Speed / low turns / token thrift are normalized within
        this selection.
      </p>
    </div>
  );
}
