/**
 * Recompute summary stats with the same formulas as lib/stats.ts + lib/format.ts
 * and assert they match the live UI numbers we captured.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "public", "data");
const failures = [];
const assert = (n, c, d = "") => {
  if (!c) failures.push(`${n}${d ? `: ${d}` : ""}`);
};

function load(condition) {
  return JSON.parse(readFileSync(join(dataDir, `${condition}.json`), "utf8"));
}

function pct(a, b) {
  if (!b) return null;
  return Math.round(((a - b) / b) * 1000) / 10;
}

function round(n) {
  return Math.round(n * 100) / 100;
}

function sorted(values) {
  return [...values].filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
}

function quantile(sortedVals, q) {
  if (!sortedVals.length) return 0;
  if (sortedVals.length === 1) return sortedVals[0];
  const pos = (sortedVals.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sortedVals[base + 1];
  if (next === undefined) return sortedVals[base];
  return sortedVals[base] + rest * next;
  // BUG CHECK: real code is sortedVals[base] + rest * (next - sortedVals[base])
}

function summarize(values) {
  const vals = sorted(values);
  const n = vals.length;
  if (!n) {
    return { n: 0, mean: 0, median: 0, stdev: 0, p90: 0 };
  }
  const mean = vals.reduce((a, b) => a + b, 0) / n;
  const variance =
    n > 1 ? vals.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1) : 0;
  return {
    n,
    mean: round(mean),
    median: round(quantileCorrect(vals, 0.5)),
    stdev: round(Math.sqrt(variance)),
    p90: round(quantileCorrect(vals, 0.9)),
  };
}

function quantileCorrect(sortedVals, q) {
  if (!sortedVals.length) return 0;
  if (sortedVals.length === 1) return sortedVals[0];
  const pos = (sortedVals.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sortedVals[base + 1];
  if (next === undefined) return sortedVals[base];
  return sortedVals[base] + rest * (next - sortedVals[base]);
}

function formatSeconds(value) {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value >= 100) return `${Math.round(value)}s`;
  return `${Math.round(value * 10) / 10}s`;
}

function formatTokens(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

const langs = ["english", "serbian", "amharic"];
const packs = Object.fromEntries(langs.map((l) => [l, load(l)]));
const sum = (rows, fn) => rows.reduce((a, r) => a + fn(r), 0);

// KPI cards
assert("en.pass", packs.english.honestPass === 21);
assert("sr.pass", packs.serbian.honestPass === 17);
assert("am.pass", packs.amharic.honestPass === 24);
assert(
  "en.wall",
  Math.round(sum(packs.english.rows, (r) => r.wallClockSeconds)) === 3725,
);
assert(
  "sr.wall",
  Math.round(sum(packs.serbian.rows, (r) => r.wallClockSeconds)) === 5587,
);
assert(
  "am.wall",
  Math.round(sum(packs.amharic.rows, (r) => r.wallClockSeconds)) === 1904,
);
assert("en.turns", sum(packs.english.rows, (r) => r.turns) === 603);
assert("sr.turns", sum(packs.serbian.rows, (r) => r.turns) === 474);
assert("am.turns", sum(packs.amharic.rows, (r) => r.turns) === 609);

assert(
  "sr.vs",
  pct(
    sum(packs.serbian.rows, (r) => r.wallClockSeconds),
    sum(packs.english.rows, (r) => r.wallClockSeconds),
  ) === 50 &&
    pct(
      sum(packs.serbian.rows, (r) => r.inputTokens),
      sum(packs.english.rows, (r) => r.inputTokens),
    ) === -35.1 &&
    pct(
      sum(packs.serbian.rows, (r) => r.turns),
      sum(packs.english.rows, (r) => r.turns),
    ) === -21.4,
);
assert(
  "am.vs",
  pct(
    sum(packs.amharic.rows, (r) => r.wallClockSeconds),
    sum(packs.english.rows, (r) => r.wallClockSeconds),
  ) === -48.9 &&
    pct(
      sum(packs.amharic.rows, (r) => r.inputTokens),
      sum(packs.english.rows, (r) => r.inputTokens),
    ) === 3.9 &&
    pct(
      sum(packs.amharic.rows, (r) => r.turns),
      sum(packs.english.rows, (r) => r.turns),
    ) === 1,
);

const uiFmt = {
  english: ["143s", "82.1s", "438s", "190s", "19", "2.21M", "1.4k"],
  serbian: ["215s", "73.2s", "630s", "257s", "18", "1.43M", "1.2k"],
  amharic: ["73.2s", "60.1s", "95.4s", "59.1s", "21", "2.30M", "1.5k"],
};

const computedFmt = {};
for (const lang of langs) {
  const p = packs[lang];
  const wall = summarize(p.rows.map((r) => r.wallClockSeconds));
  const turns = summarize(p.rows.map((r) => r.turns));
  const input = summarize(p.rows.map((r) => r.inputTokens));
  const output = summarize(p.rows.map((r) => r.outputTokens));
  const row = [
    formatSeconds(wall.mean),
    formatSeconds(wall.median),
    formatSeconds(wall.p90),
    formatSeconds(wall.stdev),
    String(Math.round(turns.median)),
    formatTokens(input.mean),
    formatTokens(output.mean),
  ];
  computedFmt[lang] = { raw: wall, turnsMedian: turns.median, row };
  const exp = uiFmt[lang];
  for (let i = 0; i < exp.length; i += 1) {
    assert(
      `${lang}.fmt[${i}]`,
      row[i] === exp[i],
      `got ${row[i]} expected ${exp[i]}`,
    );
  }
}

// Outcome split EN+SR
{
  let allPass = 0;
  let allFail = 0;
  let split = 0;
  for (const id of packs.english.rows.map((r) => r.caseId)) {
    const a = packs.english.rows.find((r) => r.caseId === id).success;
    const b = packs.serbian.rows.find((r) => r.caseId === id).success;
    if (a && b) allPass += 1;
    else if (!a && !b) allFail += 1;
    else split += 1;
  }
  assert(
    "split",
    allPass === 17 && allFail === 5 && split === 4,
    `${allPass}/${allFail}/${split}`,
  );
}

console.log(
  JSON.stringify({ ok: failures.length === 0, computedFmt, failures }, null, 2),
);
if (failures.length) process.exit(1);
