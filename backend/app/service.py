from __future__ import annotations

import hashlib
import json
import uuid

from .models import AnalysisRequest, AnalysisResponse


TASKS = (
    "Rewrite the opening hook around one concrete outcome.",
    "Create a proof-first alternative for the first three seconds.",
    "Reduce the call to action to one clear next step.",
    "Publish the strongest variant in the audience's active window.",
    "Respond to high-intent comments and record recurring questions.",
    "Compare saves and retention against the recorded baseline.",
    "Document the result and choose whether to keep, revise, or stop.",
)


def _analysis_id(request: AnalysisRequest) -> str:
    canonical = json.dumps(request.model_dump(mode="json"), sort_keys=True, separators=(",", ":"))
    digest = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"cgc-m0:{digest}"))


def build_analysis(request: AnalysisRequest) -> AnalysisResponse:
    source_fact = (
        "The creator supplied content manually."
        if request.manual_content
        else "A public content URL was supplied; M0 records the URL but does not retrieve it."
    )
    medium = request.content_medium.replace("_", " ")
    return AnalysisResponse.model_validate(
        {
            "analysis_id": _analysis_id(request),
            "status": "completed",
            "provider": "mock",
            "sample_data": True,
            "observed_facts": [
                f"The request targets Instagram and uses {request.primary_metric} as the primary metric.",
                f"The selected content medium is {medium}.",
                source_fact,
            ],
            "assumptions": [
                {
                    "text": f"The content is intended for {request.target_audience}.",
                    "confidence": 0.5,
                }
            ],
            "prioritized_findings": [
                {
                    "priority": 1,
                    "impact": "high",
                    "evidence": "Sample data only; live content retrieval is not enabled in M0.",
                    "action": "Open with one concrete audience outcome in the first sentence.",
                },
                {
                    "priority": 2,
                    "impact": "medium",
                    "evidence": "The request has one primary metric and a focused audience.",
                    "action": "Use one call to action that maps directly to the primary metric.",
                },
                {
                    "priority": 3,
                    "impact": "medium",
                    "evidence": "A seven-day comparison needs a recorded starting point.",
                    "action": "Capture the current baseline before publishing a variant.",
                },
            ],
            "seven_day_plan": [
                {
                    "day": index,
                    "task": task,
                    "owner": "content_owner",
                    "expected_output": "Two hook variants" if index == 1 else "One recorded action",
                    "success_metric": request.primary_metric,
                }
                for index, task in enumerate(TASKS, start=1)
            ],
            "next_experiment": {
                "hypothesis": f"A concrete outcome-led hook will increase {request.primary_metric}.",
                "primary_metric": request.primary_metric,
                "decision_rule": (
                    f"Keep the variant only if the measured {request.primary_metric} value improves against the recorded baseline."
                ),
            },
            "limitations": [
                "Mock response; no live Instagram content was retrieved or analyzed.",
                "Recommendations are hypotheses, not guarantees of reach or growth.",
                "No social account credentials, scraping, posting, or database are used in M0.",
            ],
        }
    )
