/**
 * Publish portable metrics JSON from vanta-lang-pipeline/results CSVs.
 * Usage: node scripts/publish-data.mjs
 */
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(__dirname, "..");
const RESULTS_DIR = resolve(APP_ROOT, "..", "vanta-lang-pipeline", "results");
const OUT_DIR = join(APP_ROOT, "public", "data");

const SKIP_STEMS = new Set([
  "benchmark_metrics_am_ha_zu_sq",
  "benchmark_metrics_en_sr",
  "benchmark_metrics_new",
]);

const DISPLAY = {
  albanian: "Albanian",
  amharic: "Amharic",
  arabic: "Arabic",
  burmese: "Burmese",
  chinese_simplified: "Chinese Simplified",
  chinese_traditional: "Chinese Traditional",
  dari: "Dari",
  english: "English",
  hausa: "Hausa",
  hindi: "Hindi",
  igbo: "Igbo",
  indonesian: "Indonesian",
  kinyarwanda: "Kinyarwanda",
  korean: "Korean",
  luganda: "Luganda",
  malayalam: "Malayalam",
  marathi: "Marathi",
  oromo: "Oromo",
  persian: "Persian",
  polish: "Polish",
  russian: "Russian",
  serbian: "Serbian",
  shona: "Shona",
  somali: "Somali",
  swahili: "Swahili",
  swedish: "Swedish",
  telugu: "Telugu",
  twi: "Twi",
  vietnamese: "Vietnamese",
  wolof: "Wolof",
  xhosa: "Xhosa",
  yoruba: "Yoruba",
  zulu: "Zulu",
};

function parseBool(value) {
  const v = String(value).trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

function parseNumber(value) {
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? n : 0;
}

async function readCsv(path) {
  const rows = [];
  const rl = createInterface({
    input: createReadStream(path, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  let headers = null;
  for await (const line of rl) {
    if (!line.trim()) continue;
    const cells = parseCsvLine(line);
    if (!headers) {
      headers = cells;
      continue;
    }
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    rows.push(row);
  }
  return rows;
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
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function titleCase(condition) {
  return condition
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function summarize(condition, cases) {
  const passWalls = cases
    .filter((c) => c.success && c.hasWallClockSeconds)
    .map((c) => c.wallClockSeconds);
  const honestPass = cases.filter((c) => c.success).length;
  const honestFail = cases.length - honestPass;
  const meanWallPass =
    passWalls.length > 0
      ? Math.round(
          (passWalls.reduce((a, b) => a + b, 0) / passWalls.length) * 100,
        ) / 100
      : null;
  const totalInputTokens = cases.reduce((a, c) => a + c.inputTokens, 0);
  const totalOutputTokens = cases.reduce((a, c) => a + c.outputTokens, 0);
  const meanTurns =
    cases.length > 0
      ? Math.round(
          (cases.reduce((a, c) => a + c.turns, 0) / cases.length) * 100,
        ) / 100
      : 0;
  const issueCount = cases.filter((c) => c.validationIssues).length;

  return {
    condition,
    display: DISPLAY[condition] ?? titleCase(condition),
    cases: cases.length,
    honestPass,
    honestFail,
    passRate: cases.length
      ? Math.round((honestPass / cases.length) * 1000) / 10
      : 0,
    meanWallPass,
    meanTurns,
    totalInputTokens,
    totalOutputTokens,
    issueCount,
  };
}

function toCaseRow(raw) {
  return {
    caseId: String(raw.case_id || "").trim(),
    conditionId: String(raw.condition_id || "").trim(),
    success: parseBool(raw.success),
    rawSuccess: parseBool(raw.raw_success),
    turns: parseNumber(raw.turns),
    wallClockSeconds: parseNumber(raw.wall_clock_seconds),
    hasWallClockSeconds: parseBool(raw.has_wall_clock_seconds),
    inputTokens: parseNumber(raw.input_tokens),
    outputTokens: parseNumber(raw.output_tokens),
    validationIssues: String(raw.validation_issues || "").trim(),
    failureClass: String(raw.failure_class || "").trim(),
    failureSummary: String(raw.failure_summary || "").trim(),
    shouldFixSystem: String(raw.should_fix_system || "").trim(),
    proposedFix: String(raw.proposed_fix || "").trim(),
    backend: String(raw.backend || "").trim(),
  };
}

async function main() {
  if (!existsSync(RESULTS_DIR)) {
    const fallback = join(OUT_DIR, "index.json");
    if (existsSync(fallback)) {
      console.warn(
        `Missing results dir: ${RESULTS_DIR}\nUsing committed ${fallback} (Vercel / offline build).`,
      );
      return;
    }
    console.error(`Missing results dir: ${RESULTS_DIR}`);
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const files = readdirSync(RESULTS_DIR)
    .filter((f) => f.startsWith("benchmark_metrics_") && f.endsWith(".csv"))
    .filter((f) => !SKIP_STEMS.has(f.replace(/\.csv$/, "")))
    .sort();

  const languages = [];
  for (const file of files) {
    const condition = file
      .replace(/^benchmark_metrics_/, "")
      .replace(/\.csv$/, "");
    const rawRows = await readCsv(join(RESULTS_DIR, file));
    const cases = rawRows.map(toCaseRow).filter((r) => r.caseId);
    if (!cases.length) continue;
    const summary = summarize(condition, cases);
    languages.push(summary);
    writeFileSync(
      join(OUT_DIR, `${condition}.json`),
      JSON.stringify({ ...summary, rows: cases }, null, 2),
      "utf8",
    );
  }

  languages.sort(
    (a, b) => b.passRate - a.passRate || a.display.localeCompare(b.display),
  );

  const index = {
    updatedAt: new Date().toISOString(),
    source: "vanta-lang-pipeline/results",
    languageCount: languages.length,
    languages,
  };
  writeFileSync(
    join(OUT_DIR, "index.json"),
    JSON.stringify(index, null, 2),
    "utf8",
  );
  console.log(`Published ${languages.length} languages → ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
