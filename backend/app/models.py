from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


ContentMedium = Literal["carousel", "single_image", "reel", "story"]
Impact = Literal["high", "medium", "low"]


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
