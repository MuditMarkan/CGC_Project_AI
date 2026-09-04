import type { AnalysisResponse } from "./contracts";

const STORAGE_KEY = "cgc.latest-analysis.v2";

function isAnalysisResponse(value: unknown): value is AnalysisResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AnalysisResponse>;
  return (
    typeof candidate.analysis_id === "string" &&
    candidate.status === "completed" &&
    Array.isArray(candidate.prioritized_findings) &&
    Array.isArray(candidate.seven_day_plan) &&
    candidate.seven_day_plan.length === 7 &&
    !!candidate.calculated_metrics &&
    !!candidate.next_experiment
  );
}

export function saveLatestAnalysis(result: AnalysisResponse) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {
    // The inline result still works when browser storage is unavailable.
  }
}

export function loadLatestAnalysis(): AnalysisResponse | null {
  try {
    const serialized = window.sessionStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;
    const parsed: unknown = JSON.parse(serialized);
    return isAnalysisResponse(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearLatestAnalysis() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing else needs to be cleared when browser storage is unavailable.
  }
}
