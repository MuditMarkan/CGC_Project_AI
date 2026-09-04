export type Impact = "high" | "medium" | "low";
export type ContentMedium = "carousel" | "single_image" | "reel" | "story";

export interface ManualInsights {
  impressions: number | null;
  reach: number | null;
  saves: number | null;
  shares: number | null;
  profile_visits: number | null;
}

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
  manual_insights: ManualInsights | null;
}

export interface AnalysisResponse {
  analysis_id: string;
  status: "completed";
  provider: string;
  sample_data: boolean;
  submitted_insights: ManualInsights | null;
  calculated_metrics: {
    saves_per_reach_pct: number | null;
    shares_per_reach_pct: number | null;
    profile_visits_per_reach_pct: number | null;
  };
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
