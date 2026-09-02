from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator


ContentMedium = Literal["carousel", "single_image", "reel", "story"]
Impact = Literal["high", "medium", "low"]
Goal = Literal[
    "grow_reach",
    "increase_saves_per_reach",
    "increase_share_rate",
    "increase_follow_conversion",
]
PrimaryMetric = Literal["reach", "saves_per_reach", "shares_per_reach", "follow_conversion"]


class ManualMetrics(BaseModel):
    model_config = ConfigDict(extra="forbid")

    impressions: int | None = Field(default=None, ge=0)
    reach: int | None = Field(default=None, ge=0)
    saves: int | None = Field(default=None, ge=0)
    shares: int | None = Field(default=None, ge=0)
    profile_visits: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def require_one_metric(self) -> "ManualMetrics":
        if all(value is None for value in self.model_dump().values()):
            raise ValueError("Provide at least one manual metric.")
        return self


class AnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    creator_name: str = Field(min_length=1, max_length=200)
    content_url: HttpUrl | None = None
    manual_content: str | None = Field(default=None, max_length=20_000)
    platform: Literal["instagram"]
    content_medium: ContentMedium = "carousel"
    target_audience: str = Field(min_length=3, max_length=500)
    goal: Goal
    primary_metric: PrimaryMetric
    brand_tone: list[str] = Field(min_length=1, max_length=10)
    manual_metrics: ManualMetrics | None = None
    connected_account_id: str | None = Field(default=None, min_length=1, max_length=100)

    @field_validator("brand_tone")
    @classmethod
    def validate_brand_tone(cls, values: list[str]) -> list[str]:
        cleaned = [value.strip() for value in values if value.strip()]
        if not cleaned:
            raise ValueError("Select at least one brand tone.")
        return cleaned

    @model_validator(mode="after")
    def validate_goal_metric_pair(self) -> "AnalysisRequest":
        expected = {
            "grow_reach": "reach",
            "increase_saves_per_reach": "saves_per_reach",
            "increase_share_rate": "shares_per_reach",
            "increase_follow_conversion": "follow_conversion",
        }
        if expected[self.goal] != self.primary_metric:
            raise ValueError("The primary metric must match the selected goal.")
        return self


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


class AnalysisResponse(BaseModel):
    analysis_id: str
    status: Literal["completed"]
    provider: str
    sample_data: bool
    observed_facts: list[str]
    assumptions: list[Assumption]
    prioritized_findings: list[Finding]
    seven_day_plan: list[PlanItem] = Field(min_length=7, max_length=7)
    next_experiment: NextExperiment
    limitations: list[str]
    data_provenance: list[str]
    connected_account: "InstagramAccountSummary | None" = None


class InstagramAccountSummary(BaseModel):
    id: str
    instagram_user_id: str
    username: str
    account_type: str | None = None
    status: Literal["connected", "revoked", "expired"]
    scopes: list[str]
    connected_at: str
    updated_at: str
    token_expires_at: str | None = None


class InstagramConfigResponse(BaseModel):
    configured: bool
    provider: Literal["instagram_login"]
    missing: list[str]
    required_scopes: list[str]
    live_verification: Literal["blocked", "available"]


class InstagramConnectResponse(BaseModel):
    authorization_url: str
    state_expires_at: str


class InstagramAccountsResponse(BaseModel):
    accounts: list[InstagramAccountSummary]


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
    database: Literal["ready"]
    provider: Literal["mock"]
    instagram: Literal["configured", "needs_configuration"]
