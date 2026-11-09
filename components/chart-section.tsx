import { Card } from "@heroui/react";
import type { ReactNode } from "react";

type ChartSectionProps = {
  title: string;
  description?: string;
  visible: boolean;
  children: ReactNode;
  /** Reserve vertical space so toggling does not collapse the page jumpily. */
  minHeightClass?: string;
};

export function ChartSection({
  title,
  description,
  visible,
  children,
  minHeightClass = "min-h-72",
}: ChartSectionProps) {
  if (!visible) return null;

  return (
    <Card className="border border-separator bg-surface/70 shadow-none">
      <Card.Header className="px-5 pt-5">
        <Card.Title>{title}</Card.Title>
        {description ? (
          <Card.Description>{description}</Card.Description>
        ) : null}
      </Card.Header>
      <Card.Content className={`px-2 pb-5 sm:px-5 ${minHeightClass}`}>
        {children}
      </Card.Content>
    </Card>
  );
}
