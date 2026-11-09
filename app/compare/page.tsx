import { Suspense } from "react";
import { Spinner } from "@heroui/react";

import { CompareClient } from "./compare-client";

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-3 text-muted">
          <Spinner size="sm" />
          Loading compare…
        </div>
      }
    >
      <CompareClient />
    </Suspense>
  );
}
