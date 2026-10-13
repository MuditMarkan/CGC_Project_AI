from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


ContentMedium = Literal["carousel", "single_image", "reel", "story"]
Impact = Literal["high", "medium", "low"]


class ManualInsights(BaseModel):
    model_config = ConfigDict(extra="forbid")

    impressions: int | None = Field(default=None, ge=0)
    reach: int | None = Field(default=None, ge=0)
    saves: int | None = Field(default=None, ge=0)
    shares: int | None = Field(default=None, ge=0)
    profile_visits: int | None = Field(default=None, ge=0)


class AnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    creator_name: str = Field(min_length=1, max_length=200)
    content_url: HttpUrl | None = None
    manual_content: str | None = Field(default=None, max_length=20_000)
    platform: Literal["instagram"]
    content_medium: ContentMedium = "carousel"
    target_audience: str = Field(min_length=3, max_length=500)
    goal: str = Field(min_length=1, max_length=100)
    primary_metric: str = Field(min_length=1, max_length=100)
    brand_tone: list[str] = Field(min_length=1, max_length=10)
    manual_insights: ManualInsights | None = None

    @field_validator("brand_tone")
    @classmethod
    def validate_brand_tone(cls, values: list[str]) -> list[str]:
        cleaned = [value.strip() for value in values if value.strip()]
        if not cleaned:
            raise ValueError("Select at least one brand tone.")
        return cleaned


class Assumption(BaseModel):
    text: str
    confidence: float = Field(ge=0, le=1)


class Finding(BaseModel):
    priority: int = Field(ge=1)
    impact: Impact
    evidence: str
    action: str


class PlanItem(BaseModel):
    day: int = Field(ge=1, le=7)
    task: str
    owner: str
    expected_output: str
    success_metric: str


class NextExperiment(BaseModel):
    hypothesis: str
    primary_metric: str
    decision_rule: str


class CalculatedMetrics(BaseModel):
    saves_per_reach_pct: float | None
    shares_per_reach_pct: float | None
    profile_visits_per_reach_pct: float | None


class AnalysisResponse(BaseModel):
    analysis_id: str
    status: Literal["completed"]
    provider: str
    sample_data: bool
    submitted_insights: ManualInsights | None
    calculated_metrics: CalculatedMetrics
    observed_facts: list[str]
    assumptions: list[Assumption]
    prioritized_findings: list[Finding]
    seven_day_plan: list[PlanItem] = Field(min_length=7, max_length=7)
    next_experiment: NextExperiment
    limitations: list[str]


class ErrorDetail(BaseModel):
    code: str
    message: str
    retryable: bool
    details: dict[str, object]


class ErrorBody(BaseModel):
    error: ErrorDetail


class HealthResponse(BaseModel):
    status: Literal["ok"]
    api: Literal["ready"]
    database: Literal["not_required_for_m0"]
    provider: Literal["mock"]


class InstagramDiscoveryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    target: str = Field(min_length=1, max_length=500)


class InstagramPublicMedia(BaseModel):
    id: str
    caption: str | None = None
    media_type: str | None = None
    media_url: str | None = None
    permalink: str | None = None
    thumbnail_url: str | None = None
    timestamp: str | None = None
    like_count: int | None = None
    comments_count: int | None = None


class InstagramPublicProfile(BaseModel):
    username: str
    name: str | None = None
    biography: str | None = None
    profile_picture_url: str | None = None
    followers_count: int | None = None
    follows_count: int | None = None
    media_count: int | None = None
    media: list[InstagramPublicMedia]


class InstagramDiscoveryResponse(BaseModel):
    status: Literal["completed"]
    provider: Literal["meta_business_discovery"]
    sample_data: Literal[False]
    target_username: str
    retrieved_at: str
    profile: InstagramPublicProfile
    unavailable_fields: list[str]
    limitations: list[str]
