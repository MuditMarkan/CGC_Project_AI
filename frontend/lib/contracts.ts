export type Impact = "high" | "medium" | "low";
export type ContentMedium = "carousel" | "single_image" | "reel" | "story";

export interface AnalysisRequest {
  creator_name: string;
  content_url: string | null;
  manual_content: string | null;
  platform: "instagram";
  content_medium: ContentMedium;
  target_audience: string;
  goal: string;
  primary_metric: string;
  brand_tone: string[];
}

export interface AnalysisResponse {
  analysis_id: string;
  status: "completed";
  provider: string;
  sample_data: boolean;
  observed_facts: string[];
  assumptions: Array<{ text: string; confidence: number }>;
  prioritized_findings: Array<{
    priority: number;
    impact: Impact;
    evidence: string;
    action: string;
  }>;
  seven_day_plan: Array<{
    day: number;
    task: string;
    owner: string;
    expected_output: string;
    success_metric: string;
  }>;
  next_experiment: {
    hypothesis: string;
    primary_metric: string;
    decision_rule: string;
  };
  limitations: string[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    retryable: boolean;
    details: Record<string, unknown>;
  };
}
