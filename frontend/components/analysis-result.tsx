import type { AnalysisResponse } from "@/lib/contracts";
import { Panel, Pill, SectionTitle } from "./ui";

export function AnalysisResult({ result }: { result: AnalysisResponse }) {
  return <div className="result-area" aria-labelledby="analysis-result-title">
    <div className="result-heading"><div><p>VALIDATED RESULT</p><h2 id="analysis-result-title">Your growth signal plan</h2></div>{result.sample_data ? <Pill tone="orange">SAMPLE DATA</Pill> : null}</div>
    <div className="dashboard-grid two-one">
      <Panel><SectionTitle eyebrow="PRIORITIZED FINDINGS" title="Fix these first" /><ol className="finding-list">{result.prioritized_findings.map((finding) => <li key={finding.priority}><span>{String(finding.priority).padStart(2, "0")}</span><div><b>{finding.action}</b><small>{finding.evidence}</small></div><Pill tone={finding.impact === "high" ? "red" : "violet"}>{finding.impact}</Pill></li>)}</ol></Panel>
      <Panel><SectionTitle eyebrow="NEXT EXPERIMENT" title="One measurable test" /><p className="hypothesis">{result.next_experiment.hypothesis}</p><dl className="compact-dl"><div><dt>Metric</dt><dd>{result.next_experiment.primary_metric}</dd></div><div><dt>Decision rule</dt><dd>{result.next_experiment.decision_rule}</dd></div></dl></Panel>
    </div>
    <Panel><SectionTitle eyebrow="SEVEN-DAY PLAN" title="A focused operating rhythm" /><ol className="plan-list">{result.seven_day_plan.map((item) => <li key={item.day}><span>DAY {item.day}</span><b>{item.task}</b><small>{item.expected_output} · Metric: {item.success_metric}</small></li>)}</ol></Panel>
    <Panel className="limitations"><SectionTitle eyebrow="EVIDENCE LIMITATIONS" title="What this result does not claim" /><ul>{result.limitations.map((item) => <li key={item}>{item}</li>)}</ul></Panel>
  </div>;
}
