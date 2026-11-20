import { Card } from "@heroui/react";
import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string;
  hint?: ReactNode;
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
      {hint ? (
        typeof hint === "string" ? (
          <p className="text-xs text-muted">{hint}</p>
        ) : (
          <div className="text-xs text-muted">{hint}</div>
        )
      ) : null}
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
