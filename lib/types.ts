export type CaseRow = {
  caseId: string;
  conditionId: string;
  success: boolean;
  rawSuccess: boolean;
  turns: number;
  wallClockSeconds: number;
  hasWallClockSeconds: boolean;
  inputTokens: number;
  outputTokens: number;
  validationIssues: string;
  failureClass?: string;
  failureSummary?: string;
  shouldFixSystem?: string;
  proposedFix?: string;
  backend?: string;
};

export type LanguageSummary = {
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
};

export type LanguageDetail = LanguageSummary & {
  rows: CaseRow[];
};

export type MetricsIndex = {
  updatedAt: string;
  source: string;
  languageCount: number;
  languages: LanguageSummary[];
};
