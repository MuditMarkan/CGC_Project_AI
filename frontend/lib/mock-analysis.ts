import type { AnalysisRequest, AnalysisResponse } from "./contracts";

const tasks = [
  "Rewrite the opening hook around one concrete outcome.",
  "Create a proof-first alternative for the first three seconds.",
  "Reduce the call to action to one clear next step.",
  "Publish the strongest variant in the audience's active window.",
  "Respond to high-intent comments and record recurring questions.",
  "Compare saves and retention against the recorded baseline.",
  "Document the result and choose whether to keep, revise, or stop.",
];

export function createMockAnalysis(input: AnalysisRequest): AnalysisResponse {
  return {
    analysis_id: "00000000-0000-4000-8000-000000000001",
    status: "completed",
    provider: "mock",
    sample_data: true,
    observed_facts: [
      `The request targets Instagram and uses ${input.primary_metric} as the primary metric.`,
      `The selected content medium is ${input.content_medium.replace("_", " ")}.`,
      input.manual_content
        ? "The creator supplied content manually."
        : "A public content URL was supplied; M0 does not retrieve it.",
    ],
    assumptions: [
      {
        text: `The content is intended for ${input.target_audience}.`,
        confidence: 0.5,
      },
    ],
    prioritized_findings: [
      {
        priority: 1,
        impact: "high",
        evidence: "Sample data only; live content retrieval is not enabled in M0.",
        action: "Open with one concrete audience outcome in the first sentence.",
      },
      {
        priority: 2,
        impact: "medium",
        evidence: "The request has one primary metric and a focused audience.",
        action: "Use one call to action that maps directly to the primary metric.",
      },
      {
        priority: 3,
        impact: "medium",
        evidence: "A seven-day comparison needs a recorded starting point.",
        action: "Capture the current baseline before publishing a variant.",
      },
    ],
    seven_day_plan: tasks.map((task, index) => ({
      day: index + 1,
      task,
      owner: "content_owner",
      expected_output: index === 0 ? "Two hook variants" : "One recorded action",
      success_metric: input.primary_metric,
    })),
    next_experiment: {
      hypothesis: `A concrete outcome-led hook will increase ${input.primary_metric}.`,
      primary_metric: input.primary_metric,
      decision_rule: `Keep the variant only if the measured ${input.primary_metric} value improves against the recorded baseline.`,
    },
    limitations: [
      "Mock response; no live Instagram content was retrieved or analyzed.",
      "Recommendations are hypotheses, not guarantees of reach or growth.",
    ],
  };
}
