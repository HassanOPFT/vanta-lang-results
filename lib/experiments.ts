export type ExperimentSummary = {
  slug: string;
  title: string;
  subtitle: string;
  updatedAt: string;
  languageCount: number;
  passRate: number;
  honestPass: number;
  honestFail: number;
  systemFails: number;
  agentFails: number;
};

export type ExperimentCluster = {
  caseId: string;
  failCount: number;
  langs: string[];
  dominantRootCause: string;
  failureClass: string;
  failureSummary: string;
  proposedFix: string;
  shouldFixSystem: string;
  examples: Array<{
    condition: string;
    record?: string;
    rootCause?: string;
  }>;
};

export type ExperimentLangSummary = {
  code: string;
  condition: string;
  display: string;
  cases: number;
  honestPass: number;
  honestFail: number;
  passRate: number;
  meanWallPass: number | null;
  meanTurns: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  issueCount: number;
  suite: string;
};

export type ExperimentIndex = {
  slug: string;
  title: string;
  subtitle: string;
  experiment: string;
  harness: string;
  updatedAt: string;
  languageCount: number;
  totalCases: number;
  honestPass: number;
  honestFail: number;
  passRate: number;
  systemFails: number;
  agentFails: number;
  unknownFails: number;
  languages: ExperimentLangSummary[];
  clusters: ExperimentCluster[];
  headlineFindings: string[];
  worktreeHint?: string;
};

export type ExperimentFail = {
  code: string;
  condition: string;
  display: string;
  caseId: string;
  failure_class?: string;
  failure_summary?: string;
  should_fix_system?: string;
  proposed_fix?: string;
  root_cause?: string;
  confidence?: string;
  backend?: string;
  failed_checks?: string;
  bad_kwarg?: string;
  dataclass?: string;
  poison_lang_file?: string;
  record?: string;
  suite?: string;
};

export type ExperimentLangDetail = ExperimentLangSummary & {
  rows: Array<{
    caseId: string;
    conditionId: string;
    success: boolean;
    turns: number;
    wallClockSeconds: number;
    hasWallClockSeconds: boolean;
    inputTokens: number;
    outputTokens: number;
    failureClass?: string;
    failureSummary?: string;
    shouldFixSystem?: string;
    proposedFix?: string;
    rootCause?: string;
    backend?: string;
  }>;
};

export async function loadExperimentRegistry(): Promise<ExperimentSummary[]> {
  const res = await fetch("/experiments/index.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`experiments registry HTTP ${res.status}`);
  return res.json();
}

export async function loadExperiment(slug: string): Promise<ExperimentIndex> {
  const res = await fetch(`/experiments/${slug}/index.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`experiment ${slug} HTTP ${res.status}`);
  return res.json();
}

export async function loadExperimentFails(slug: string): Promise<ExperimentFail[]> {
  const res = await fetch(`/experiments/${slug}/fails.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`experiment fails ${slug} HTTP ${res.status}`);
  return res.json();
}

export async function loadExperimentLang(
  slug: string,
  condition: string,
): Promise<ExperimentLangDetail> {
  const res = await fetch(`/experiments/${slug}/${condition}.json`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`experiment lang ${condition} HTTP ${res.status}`);
  return res.json();
}
