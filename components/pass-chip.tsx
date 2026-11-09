import { Chip } from "@heroui/react";

export function PassChip({ ok }: { ok: boolean }) {
  return (
    <Chip color={ok ? "success" : "danger"} size="sm" variant="soft">
      {ok ? "PASS" : "FAIL"}
    </Chip>
  );
}
