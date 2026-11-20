"use client";

import { useEffect, useId, useState } from "react";

type Props = {
  chart: string;
  className?: string;
};

/** Client-side Mermaid render for experiment report flows. */
export function MermaidDiagram({ chart, className }: Props) {
  const reactId = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "neutral",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        });
        const id = `mmd-${reactId}-${Math.random().toString(36).slice(2, 8)}`;
        const { svg: rendered } = await mermaid.render(id, chart.trim());
        if (!cancelled) {
          setError(null);
          setSvg(rendered);
        }
      } catch (err) {
        if (!cancelled) {
          setSvg(null);
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [chart, reactId]);

  if (error) {
    return (
      <pre className="overflow-x-auto rounded-lg border border-separator bg-content2/40 p-3 text-xs text-muted">
        {chart.trim()}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="rounded-lg border border-dashed border-separator p-6 text-sm text-muted">
        Rendering diagram…
      </div>
    );
  }

  return (
    <div
      className={
        className ??
        "overflow-x-auto rounded-lg border border-separator bg-content1 p-3"
      }
      // Mermaid returns trusted SVG from our static chart strings.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
