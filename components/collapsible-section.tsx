"use client";

import { useEffect, useState, type ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  /** Extra controls in the header (filters, etc.). */
  actions?: ReactNode;
  defaultOpen?: boolean;
  /** Anchor id for deep links (e.g. #tools). Opens when hash matches. */
  id?: string;
  children: ReactNode;
};

export function CollapsibleSection({
  title,
  description,
  actions,
  defaultOpen = false,
  id,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!id) return;
    const sync = () => {
      if (window.location.hash === `#${id}`) {
        setOpen(true);
        requestAnimationFrame(() => {
          document.getElementById(id)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [id]);

  return (
    <section
      id={id}
      className="flex scroll-mt-20 flex-col gap-3 rounded-lg border border-separator bg-surface/40 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className="mt-1 inline-block text-muted transition-transform"
            style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
            aria-hidden
          >
            ▸
          </span>
          <span>
            <span className="block text-lg font-semibold text-foreground">
              {title}
            </span>
            {description ? (
              <span className="mt-0.5 block text-sm text-muted">
                {description}
              </span>
            ) : null}
          </span>
        </button>
        {actions ? (
          <div
            className="flex flex-wrap gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        ) : null}
      </div>
      {open ? children : null}
    </section>
  );
}
