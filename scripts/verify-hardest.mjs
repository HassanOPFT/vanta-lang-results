import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const index = JSON.parse(
  readFileSync(join(root, "public", "data", "index.json"), "utf8"),
);

const packs = index.languages.map((l) =>
  JSON.parse(
    readFileSync(join(root, "public", "data", `${l.condition}.json`), "utf8"),
  ),
);

const caseIds = packs[0].rows.map((r) => r.caseId);
const difficulty = caseIds
  .map((caseId) => {
    const fails = [];
    let pass = 0;
    for (const p of packs) {
      const row = p.rows.find((r) => r.caseId === caseId);
      if (row?.success) pass += 1;
      else fails.push(p.display);
    }
    const n = packs.length;
    return {
      caseId,
      pass,
      n,
      rate: Math.round((pass / n) * 1000) / 10,
      fails,
    };
  })
  .sort((a, b) => a.rate - b.rate || a.caseId.localeCompare(b.caseId));

console.log(
  JSON.stringify(
    {
      top: difficulty.slice(0, 8).map((d) => ({
        caseId: d.caseId,
        label: `${d.pass}/${d.n} pass (${d.rate}%)`,
        fails: d.fails.join(", "),
      })),
    },
    null,
    2,
  ),
);
