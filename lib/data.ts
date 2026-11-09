import type { LanguageDetail, MetricsIndex } from "@/lib/types";

export async function loadIndex(): Promise<MetricsIndex> {
  const res = await fetch("/data/index.json", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load index.json (${res.status})`);
  }
  return res.json() as Promise<MetricsIndex>;
}

export async function loadLanguage(condition: string): Promise<LanguageDetail> {
  const res = await fetch(`/data/${encodeURIComponent(condition)}.json`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to load ${condition}.json (${res.status})`);
  }
  return res.json() as Promise<LanguageDetail>;
}

export async function loadLanguages(conditions: string[]): Promise<LanguageDetail[]> {
  return Promise.all(conditions.map((c) => loadLanguage(c)));
}
