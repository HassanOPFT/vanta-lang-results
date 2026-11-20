import { Card } from "@heroui/react";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  /** When set, the card is a link (e.g. #tools). */
  href?: string;
};

export function StatCard({ label, value, hint, href }: StatCardProps) {
  const body = (
    <Card.Content className="gap-1 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </Card.Content>
  );

  if (href) {
    return (
      <a href={href} className="block no-underline">
        <Card className="h-full border border-separator bg-surface/80 shadow-none transition hover:border-accent/40">
          {body}
        </Card>
      </a>
    );
  }

  return (
    <Card className="border border-separator bg-surface/80 shadow-none">
      {body}
    </Card>
  );
}
