/**
 * Compare pipeline CSVs vs latest VALIDATION.json per language code.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

const TUM = join("c:/Users/Hassan Mustafa/Desktop/TUM");
const RUNS = join(TUM, "vanta-benchmark-runs");
const RESULTS = join(TUM, "vanta-lang-pipeline", "results");
const QUEUE = join(TUM, "vanta-lang-pipeline", "state", "queue.json");

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = parseLine(lines[0]);
  return lines
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const cells = parseLine(line);
      const row = {};
      headers.forEach((h, i) => {
        row[h] = cells[i] ?? "";
      });
      return row;
    });
}

function parseLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

const byCode = {};
for (const d of readdirSync(RUNS)) {
  const m = d.match(/^([a-z0-9_]+)-(\d{8}-\d{6})$/);
  if (!m) continue;
  const prev = byCode[m[1]];
  if (!prev || m[2] > prev.stamp) {
    byCode[m[1]] = { stamp: m[2], dir: join(RUNS, d) };
  }
}

const queue = JSON.parse(readFileSync(QUEUE, "utf8"));
const mismatches = [];
const matched = [];
const missingVal = [];

for (const lang of queue.languages) {
  const code = lang.code;
  const cond = lang.condition;
  if (!cond || String(lang.status || "").startsWith("skipped")) continue;

  const csvPath = join(RESULTS, `benchmark_metrics_${cond}.csv`);
  let csvPass = null;
  let csvN = null;
  if (existsSync(csvPath)) {
    const rows = parseCsv(readFileSync(csvPath, "utf8"));
    csvN = rows.length;
    csvPass = rows.filter(
      (r) => String(r.success).toLowerCase() === "true",
    ).length;
  }

  const latest = byCode[code];
  let valPass = null;
  let valN = null;
  let suite = null;
  if (latest) {
    suite = basename(latest.dir);
    const vp = join(latest.dir, "VALIDATION.json");
    if (existsSync(vp)) {
      const v = JSON.parse(readFileSync(vp, "utf8"));
      valPass = v.honest_pass;
      valN = v.records ?? v.expected_cases;
    }
  }

  const row = {
    code,
    cond,
    status: lang.status,
    csvPass,
    csvN,
    valPass,
    valN,
    suite,
  };
  if (valPass == null) missingVal.push(row);
  else if (csvPass !== valPass || csvN !== valN) mismatches.push(row);
  else matched.push(row);
}

console.log(
  JSON.stringify(
    {
      matched: matched.length,
      mismatches: mismatches.length,
      missingVal: missingVal.length,
      mismatchRows: mismatches,
      missingRows: missingVal,
    },
    null,
    2,
  ),
);
