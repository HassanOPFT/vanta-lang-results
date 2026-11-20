/**
 * Publish Moodle WS API-track experiment JSON from VANTA/results.
 *
 *   node scripts/publish-moodle-ws-api.mjs
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "..");
const VANTA_ROOT = path.resolve(APP_ROOT, "..", "VANTA");
const VANTA_RESULTS = path.join(VANTA_ROOT, "results");
const OUT = path.join(
  APP_ROOT,
  "public",
  "data",
  "experiments",
  "moodle-ws-api",
);
const REGISTRY = path.join(
  APP_ROOT,
  "public",
  "data",
  "experiments",
  "index.json",
);

/** Live tool list from VANTA harness.moodle_ws.registry. */
function loadTools() {
  const py = `
import json
from harness.moodle_ws.registry import SESSION_TOOL_NAMES, TOOL_SPECS
print(json.dumps([
    {
        "name": t["name"],
        "description": t.get("description") or "",
        "kind": "session" if t["name"] in SESSION_TOOL_NAMES else "moodle",
    }
    for t in TOOL_SPECS
], ensure_ascii=False))
`;
  const raw = execFileSync("python", ["-c", py], {
    cwd: VANTA_ROOT,
    encoding: "utf8",
  });
  return JSON.parse(raw);
}

const SLUG = "moodle-ws-api";
const CONDITIONS = [
  { condition: "english_api", display: "English API", code: "en" },
  { condition: "arabic_api", display: "Arabic API", code: "ar" },
];

/** Cases that fail because stock Moodle has no suitable wsfunction. */
const STOCK_GAP = {
  case_07_create_assignment: {
    summary: "No stock WS to create an assignment with name/intro/due/grade.",
    root: "mod_assign_* is get/grade/submit only; courseformat quick-create cannot set settings.",
  },
  case_09_create_course_section: {
    summary:
      "No stock WS to rename/summarize a section or create named label+assign.",
    root: "core_course_edit_section is visibility/marker/delete only; no activity create-with-fields.",
  },
  case_10_create_book: {
    summary: "No stock WS to create a Book or write chapters.",
    root: "mod_book exposes get/view only.",
  },
  case_11_course_audit_repair: {
    summary:
      "Cannot rename section or create a named label via stock WS (unhide is possible).",
    root: "Same section/label gaps as case 09; edit_module can show a page.",
  },
  case_12_workshop_setup: {
    summary: "No stock WS to create a workshop or set strategy/phase.",
    root: "mod_workshop_* is get/submission/assessment only.",
  },
  case_13_groups_restricted_release: {
    summary:
      "Groups APIs exist; no stock WS to set activity availability JSON.",
    root: "core_course_edit_module does not accept availability.",
  },
  case_16_extra_quiz_attempt: {
    summary: "Cannot delete finished quiz attempts via stock WS (reset path).",
    root: "Overrides/reopen exist; delete finished attempts is UI/report PHP only.",
  },
};

function latestRecord(caseDir, condition) {
  const files = fs
    .readdirSync(caseDir)
    .filter(
      (n) =>
        n.startsWith(`${condition}_openai_direct_api_`) && n.endsWith(".json"),
    )
    .map((n) => path.join(caseDir, n))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0] || null;
}

function mean(nums) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

function buildLang(meta) {
  const caseDirs = fs
    .readdirSync(VANTA_RESULTS)
    .filter(
      (n) =>
        n.startsWith("case_") &&
        fs.statSync(path.join(VANTA_RESULTS, n)).isDirectory(),
    )
    .sort();

  const rows = [];
  for (const caseId of caseDirs) {
    const caseDir = path.join(VANTA_RESULTS, caseId);
    const recordPath = latestRecord(caseDir, meta.condition);
    if (!recordPath) continue;
    const data = JSON.parse(fs.readFileSync(recordPath, "utf8"));
    const success = data?.outcome?.success === true;
    const metrics = data.metrics || {};
    const gap = STOCK_GAP[caseId];
    const row = {
      caseId,
      conditionId: meta.condition,
      success,
      rawSuccess: success,
      turns: Number(metrics.turns || 0),
      wallClockSeconds: Number(metrics.wall_clock_seconds || 0),
      hasWallClockSeconds: metrics.wall_clock_seconds != null,
      inputTokens: Number(metrics.input_tokens || 0),
      outputTokens: Number(metrics.output_tokens || 0),
      validationIssues: "",
      record: recordPath,
      backend: data.backend || "openai_direct_api",
    };
    if (!success && gap) {
      row.failureClass = "system";
      row.failureSummary = gap.summary;
      row.rootCause = gap.root;
      row.shouldFixSystem =
        "yes — requires Moodle core/plugin WS, not agent prompt";
      row.proposedFix =
        "Keep STOCK_GAP on API track; use browser for these cases, or add a local Moodle plugin WS.";
    }
    rows.push(row);
  }

  const passRows = rows.filter((r) => r.success);
  const failRows = rows.filter((r) => !r.success);
  return {
    code: meta.code,
    condition: meta.condition,
    display: meta.display,
    suite: VANTA_RESULTS,
    cases: rows.length,
    honestPass: passRows.length,
    honestFail: failRows.length,
    passRate: rows.length
      ? Math.round((passRows.length / rows.length) * 1000) / 10
      : 0,
    meanWallPass: mean(passRows.map((r) => r.wallClockSeconds)),
    meanTurns: Math.round(mean(rows.map((r) => r.turns)) * 100) / 100 || 0,
    totalInputTokens: rows.reduce((s, r) => s + r.inputTokens, 0),
    totalOutputTokens: rows.reduce((s, r) => s + r.outputTokens, 0),
    issueCount: failRows.length,
    rows,
  };
}

function clustersFromFails(fails) {
  const byCase = new Map();
  for (const f of fails) {
    if (!byCase.has(f.caseId)) byCase.set(f.caseId, []);
    byCase.get(f.caseId).push(f);
  }
  return [...byCase.entries()].map(([caseId, items]) => {
    const first = items[0];
    return {
      caseId,
      failCount: items.length,
      langs: items.map((i) => i.display),
      dominantRootCause: first.root_cause || first.failure_summary || "",
      failureClass: first.failure_class || "system",
      failureSummary: first.failure_summary || "",
      proposedFix: first.proposed_fix || "",
      shouldFixSystem: first.should_fix_system || "yes",
      examples: items.map((i) => ({
        condition: i.condition,
        record: i.record,
        rootCause: i.root_cause,
      })),
    };
  });
}

function main() {
  const committedIndex = path.join(OUT, "index.json");
  if (!fs.existsSync(VANTA_RESULTS)) {
    if (fs.existsSync(committedIndex)) {
      console.warn(
        `Missing VANTA results: ${VANTA_RESULTS}\nUsing committed ${committedIndex} (Vercel / offline build).`,
      );
      return;
    }
    throw new Error(`VANTA results not found: ${VANTA_RESULTS}`);
  }
  fs.mkdirSync(OUT, { recursive: true });

  const langs = CONDITIONS.map(buildLang);
  const fails = [];
  for (const lang of langs) {
    for (const row of lang.rows) {
      if (row.success) continue;
      fails.push({
        code: lang.code,
        condition: lang.condition,
        display: lang.display,
        caseId: row.caseId,
        failure_class: row.failureClass || "system",
        failure_summary: row.failureSummary || "API case failed",
        should_fix_system: row.shouldFixSystem || "",
        proposed_fix: row.proposedFix || "",
        root_cause: row.rootCause || "",
        confidence: "high",
        backend: row.backend,
        record: row.record,
        suite: lang.suite,
      });
    }
    fs.writeFileSync(
      path.join(OUT, `${lang.condition}.json`),
      JSON.stringify(lang, null, 2) + "\n",
    );
  }

  const honestPass = langs.reduce((s, l) => s + l.honestPass, 0);
  const honestFail = langs.reduce((s, l) => s + l.honestFail, 0);
  const totalCases = honestPass + honestFail;
  const systemFails = fails.filter((f) => f.failure_class === "system").length;
  const agentFails = fails.filter((f) => f.failure_class === "agent").length;
  const passRate =
    totalCases > 0 ? Math.round((honestPass / totalCases) * 1000) / 10 : 0;

  const tools = loadTools();
  const sessionTools = tools.filter((t) => t.kind === "session").length;
  const moodleTools = tools.filter((t) => t.kind === "moodle").length;

  const report = {
    title: "Moodle WS API track",
    blurb:
      "Same 26 cases, no browser — agent uses stock Moodle wsfunctions (+ file mocks). Verifiers unchanged.",
    layers: [],
    flows: [
      {
        id: "high",
        title: "Experiment loop",
        mermaid: `flowchart LR
  A[Case seed in Moodle] --> B[Prompt: english_api / arabic_api]
  B --> C[Agent + Moodle WS tools]
  C --> E[Independent verify]
  E --> F{PASS / FAIL}
  F -->|stock gap| G[STOCK_GAP system fail]
  F -->|agent error| H[Agent fail]`,
      },
    ],
    resultsHeadline: [],
    toolCount: {
      total: tools.length,
      session: sessionTools,
      moodleWs: moodleTools,
    },
    stockGapCases: Object.keys(STOCK_GAP),
  };

  const index = {
    slug: SLUG,
    title: "Moodle WS API track",
    subtitle: "EN+AR · stock wsfunctions · no browser",
    experiment: "moodle-ws-api",
    harness: "moodle_ws_tools_v1",
    updatedAt: new Date().toISOString(),
    source: VANTA_RESULTS,
    worktreeHint: "VANTA feature/moodle-ws-tools · openai_direct_api",
    languageCount: langs.length,
    totalCases,
    honestPass,
    honestFail,
    passRate,
    systemFails,
    agentFails,
    unknownFails: fails.length - systemFails - agentFails,
    tools,
    toolCount: tools.length,
    languages: langs.map(
      ({
        code,
        condition,
        display,
        cases,
        honestPass,
        honestFail,
        passRate,
        meanWallPass,
        meanTurns,
        totalInputTokens,
        totalOutputTokens,
        issueCount,
        suite,
      }) => ({
        code,
        condition,
        display,
        cases,
        honestPass,
        honestFail,
        passRate,
        meanWallPass,
        meanTurns,
        totalInputTokens,
        totalOutputTokens,
        issueCount,
        suite,
      }),
    ),
    clusters: clustersFromFails(fails),
    headlineFindings: report.resultsHeadline,
    report,
  };

  fs.writeFileSync(
    path.join(OUT, "index.json"),
    JSON.stringify(index, null, 2) + "\n",
  );
  fs.writeFileSync(
    path.join(OUT, "fails.json"),
    JSON.stringify(fails, null, 2) + "\n",
  );
  fs.writeFileSync(
    path.join(OUT, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );

  let registry = [];
  if (fs.existsSync(REGISTRY)) {
    registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  }
  const summary = {
    slug: SLUG,
    title: index.title,
    subtitle: index.subtitle,
    updatedAt: index.updatedAt,
    languageCount: index.languageCount,
    passRate: index.passRate,
    honestPass: index.honestPass,
    honestFail: index.honestFail,
    systemFails: index.systemFails,
    agentFails: index.agentFails,
  };
  registry = [summary, ...registry.filter((e) => e.slug !== SLUG)];
  fs.writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + "\n");

  console.log(
    `published ${SLUG}: ${honestPass}/${totalCases} pass (${passRate}%) langs=${langs.length} tools=${tools.length}`,
  );
}

main();
