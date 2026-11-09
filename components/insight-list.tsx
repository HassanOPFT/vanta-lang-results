import type { InsightFinding } from "@/lib/insights";

const TONE: Record<InsightFinding["tone"], string> = {
  positive: "border-l-success bg-success/10",
  warning: "border-l-warning bg-warning/10",
  neutral: "border-l-accent bg-accent/10",
};

type InsightListProps = {
  findings: InsightFinding[];
  title?: string;
};

export function InsightList({
  findings,
  title = "Key insights",
}: InsightListProps) {
  if (!findings.length) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <ul className="flex flex-col gap-2">
        {findings.map((f) => (
          <li
            key={f.id}
            className={`rounded-r-lg border border-separator border-l-4 px-4 py-3 ${TONE[f.tone]}`}
          >
            <p className="font-medium text-foreground">{f.title}</p>
            <p className="mt-0.5 text-sm text-muted">{f.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
