/**
 * Cross-check published JSON vs pipeline CSV and recompute compare KPIs.
 * Exit 1 on mismatch.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "public", "data");
const resultsDir = resolve(root, "..", "vanta-lang-pipeline", "results");

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  return lines
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const cells = parseCsvLine(line);
      const row = {};
      headers.forEach((h, i) => {
        row[h] = cells[i] ?? "";
      });
      return row;
    });
}

function parseCsvLine(line) {
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

function pct(a, b) {
  if (!b) return null;
  return Math.round(((a - b) / b) * 1000) / 10;
}

function loadJson(condition) {
  return JSON.parse(readFileSync(join(dataDir, `${condition}.json`), "utf8"));
}

const failures = [];
function assert(name, cond, detail = "") {
  if (!cond) failures.push(`${name}${detail ? `: ${detail}` : ""}`);
}

const index = JSON.parse(readFileSync(join(dataDir, "index.json"), "utf8"));
assert("index.languageCount", index.languageCount === index.languages.length);

const langs = ["english", "serbian", "amharic", "zulu", "luganda"];
for (const lang of langs) {
  const json = loadJson(lang);
  const csvPath = join(resultsDir, `benchmark_metrics_${lang}.csv`);
  assert(`${lang}.json.exists`, !!json.rows?.length);
  assert(
    `${lang}.summary.pass`,
    json.honestPass === json.rows.filter((r) => r.success).length,
  );
  assert(
    `${lang}.summary.rate`,
    json.passRate ===
      Math.round((json.honestPass / json.rows.length) * 1000) / 10,
  );

  if (existsSync(csvPath)) {
    const csv = parseCsv(readFileSync(csvPath, "utf8"));
    assert(
      `${lang}.csv.rowCount`,
      csv.length === json.rows.length,
      `${csv.length} vs ${json.rows.length}`,
    );
    const csvPass = csv.filter(
      (r) => String(r.success).toLowerCase() === "true",
    ).length;
    assert(
      `${lang}.csv.pass`,
      csvPass === json.honestPass,
      `${csvPass} vs ${json.honestPass}`,
    );
    for (const row of json.rows) {
      const c = csv.find((r) => r.case_id === row.caseId);
      assert(`${lang}.${row.caseId}.present`, !!c);
      if (!c) continue;
      const cSuc = String(c.success).toLowerCase() === "true";
      assert(`${lang}.${row.caseId}.success`, cSuc === row.success);
      assert(
        `${lang}.${row.caseId}.wall`,
        Math.abs(Number(c.wall_clock_seconds) - row.wallClockSeconds) < 1e-6,
      );
      assert(`${lang}.${row.caseId}.turns`, Number(c.turns) === row.turns);
      assert(
        `${lang}.${row.caseId}.input`,
        Number(c.input_tokens) === row.inputTokens,
      );
    }
  } else {
    failures.push(`${lang}.csv.missing`);
  }
}

const en = loadJson("english");
const sr = loadJson("serbian");
const sum = (rows, fn) => rows.reduce((a, r) => a + fn(r), 0);
const enWall = sum(en.rows, (r) => r.wallClockSeconds);
const srWall = sum(sr.rows, (r) => r.wallClockSeconds);
const enTok = sum(en.rows, (r) => r.inputTokens);
const srTok = sum(sr.rows, (r) => r.inputTokens);
const enTurns = sum(en.rows, (r) => r.turns);
const srTurns = sum(sr.rows, (r) => r.turns);

assert("kpi.en.pass", en.honestPass === 21);
assert("kpi.sr.pass", sr.honestPass === 17);
assert("kpi.vs.wallPct", pct(srWall, enWall) === 50);
assert("kpi.vs.tokPct", pct(srTok, enTok) === -35.1);
assert("kpi.vs.turnsPct", pct(srTurns, enTurns) === -21.4);

const c1en = en.rows.find((r) => r.caseId === "case_01_enrol_user");
const c1sr = sr.rows.find((r) => r.caseId === "case_01_enrol_user");
assert(
  "case01.pct",
  pct(c1sr.wallClockSeconds, c1en.wallClockSeconds) === -18.3,
);

console.log(
  JSON.stringify(
    {
      ok: failures.length === 0,
      checkedLangs: langs,
      expectedUi: {
        en: {
          pass: `${en.honestPass}/${en.cases}`,
          rate: en.passRate,
          wallSum: Math.round(enWall),
          tokM: (enTok / 1e6).toFixed(2) + "M",
          turns: enTurns,
          meanWallPass: en.meanWallPass,
        },
        sr: {
          pass: `${sr.honestPass}/${sr.cases}`,
          rate: sr.passRate,
          wallSum: Math.round(srWall),
          tokM: (srTok / 1e6).toFixed(2) + "M",
          turns: srTurns,
          meanWallPass: sr.meanWallPass,
          vs: {
            wall: pct(srWall, enWall),
            tok: pct(srTok, enTok),
            turns: pct(srTurns, enTurns),
          },
        },
      },
      failures,
    },
    null,
    2,
  ),
);

if (failures.length) process.exit(1);
