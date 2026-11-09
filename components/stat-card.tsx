import { Card } from "@heroui/react";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card className="border border-separator bg-surface/80 shadow-none">
      <Card.Content className="gap-1 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </Card.Content>
    </Card>
  );
}
