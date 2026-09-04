"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Panel, SectionTitle } from "@/components/ui";
import type { AnalysisResponse } from "@/lib/contracts";
import { loadLatestAnalysis } from "@/lib/analysis-session";

export default function OrbitPage() {
  const [result, setResult] = useState<AnalysisResponse | null>();

  useEffect(() => {
    setResult(loadLatestAnalysis());
  }, []);

  return <AppShell title="7-Day Sequential Growth Plan" eyebrow="" subtitle="The plan returned by the latest completed API analysis.">
    {result === undefined ? <Panel><p role="status">Loading the latest growth plan…</p></Panel> : null}
    {result === null ? <Panel className="next-step"><SectionTitle eyebrow="NO COMPLETED ANALYSIS" title="Run an analysis first" copy="The growth plan is populated from the seven_day_plan returned by FastAPI." /><Link className="button primary" href="/analysis">Start New Analysis</Link></Panel> : null}
    {result ? <>
      <Panel className="plan-summary"><div><small>ANALYSIS STATUS</small><b>{result.status}</b></div><div><small>PLAN WINDOW</small><b>{result.seven_day_plan.length} Days</b></div><div><small>PRIMARY METRIC</small><b>{result.next_experiment.primary_metric}</b></div><div><small>API PROVIDER</small><b>{result.provider}</b><span>{result.sample_data ? "Sample data" : "Live data"}</span></div></Panel>
      <Panel className="table-panel"><table><thead><tr><th>Day</th><th>Task Description</th><th>Owner</th><th>Expected Output</th><th>Dependency</th><th>Success Metric</th></tr></thead><tbody>{result.seven_day_plan.map((item) => <tr key={item.day}><td>{item.day}</td><td>{item.task}</td><td>{item.owner}</td><td>{item.expected_output}</td><td>{item.day === 1 ? "None" : `Day ${item.day - 1}`}</td><td>{item.success_metric}</td></tr>)}</tbody></table></Panel>
      <Panel><SectionTitle eyebrow="NEXT EXPERIMENT" title={result.next_experiment.hypothesis} copy={result.next_experiment.decision_rule} /></Panel>
    </> : null}
  </AppShell>;
}
