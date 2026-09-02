export type Impact = "high" | "medium" | "low";
export type ContentMedium = "carousel" | "single_image" | "reel" | "story";
export type Goal = "grow_reach" | "increase_saves_per_reach" | "increase_share_rate" | "increase_follow_conversion";
export type PrimaryMetric = "reach" | "saves_per_reach" | "shares_per_reach" | "follow_conversion";

export interface ManualMetrics {
  impressions?: number;
  reach?: number;
  saves?: number;
  shares?: number;
  profile_visits?: number;
}

export interface AnalysisRequest {
  creator_name: string;
  content_url: string | null;
  manual_content: string | null;
  platform: "instagram";
  content_medium: ContentMedium;
  target_audience: string;
  goal: Goal;
  primary_metric: PrimaryMetric;
  brand_tone: string[];
  manual_metrics: ManualMetrics | null;
  connected_account_id: string | null;
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
  data_provenance: string[];
  connected_account: InstagramAccountSummary | null;
}

export interface InstagramAccountSummary {
  id: string;
  instagram_user_id: string;
  username: string;
  account_type: string | null;
  status: "connected" | "revoked" | "expired";
  scopes: string[];
  connected_at: string;
  updated_at: string;
  token_expires_at: string | null;
}

export interface InstagramConfigResponse {
  configured: boolean;
  provider: "instagram_login";
  missing: string[];
  required_scopes: string[];
  live_verification: "blocked" | "available";
}

export interface InstagramConnectResponse {
  authorization_url: string;
  state_expires_at: string;
}

export interface InstagramAccountsResponse {
  accounts: InstagramAccountSummary[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    retryable: boolean;
    details: Record<string, unknown>;
  };
}
