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

export interface InstagramPublicMedia {
  id: string;
  caption: string | null;
  media_type: string | null;
  media_url: string | null;
  permalink: string | null;
  thumbnail_url: string | null;
  timestamp: string | null;
  like_count: number | null;
  comments_count: number | null;
}

export interface InstagramDiscoveryResponse {
  status: "completed";
  provider: "meta_business_discovery";
  sample_data: false;
  target_username: string;
  retrieved_at: string;
  profile: {
    username: string;
    name: string | null;
    biography: string | null;
    profile_picture_url: string | null;
    followers_count: number | null;
    follows_count: number | null;
    media_count: number | null;
    media: InstagramPublicMedia[];
  };
  unavailable_fields: string[];
  limitations: string[];
}
