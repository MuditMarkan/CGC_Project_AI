"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Panel, Progress, SectionTitle } from "@/components/ui";
import type { AnalysisResponse } from "@/lib/contracts";
import { loadLatestAnalysis } from "@/lib/analysis-session";

export default function AuditPage() {
  const [result, setResult] = useState<AnalysisResponse | null>();

  useEffect(() => {
    setResult(loadLatestAnalysis());
  }, []);

  const metric = (value: number | null) => value == null ? "—" : `${value}%`;

  return <AppShell
    title="Diagnostic Audit Results"
    eyebrow=""
    subtitle={result ? `Analysis ID: ${result.analysis_id}` : "Results from the latest completed analysis."}
  >
    {result === undefined ? <Panel><p role="status">Loading the latest analysis…</p></Panel> : null}
    {result === null ? <Panel className="next-step"><SectionTitle eyebrow="NO COMPLETED ANALYSIS" title="Run an analysis first" copy="Audit results are generated from the FastAPI response and kept for this browser session." /><Link className="button primary" href="/analysis">Start New Analysis</Link></Panel> : null}
    {result ? <>
      <div className="metric-grid four">
        <Panel className="metric"><span>REACH</span><strong>{result.submitted_insights?.reach ?? "—"}</strong></Panel>
        <Panel className="metric"><span>SAVES</span><strong>{result.submitted_insights?.saves ?? "—"}</strong></Panel>
        <Panel className="metric"><span>SAVES PER REACH</span><strong>{metric(result.calculated_metrics.saves_per_reach_pct)}</strong></Panel>
        <Panel className="metric"><span>SHARES PER REACH</span><strong>{metric(result.calculated_metrics.shares_per_reach_pct)}</strong></Panel>
      </div>
      <div className="dashboard-grid two-one">
        <Panel><SectionTitle eyebrow="" title="Prioritized Structural Findings" /><ol className="structured-findings">{result.prioritized_findings.map((finding) => <li key={finding.priority}><span>{finding.priority}</span><div><b>{finding.action}</b><p>{finding.evidence}</p><small>API-CONFIRMED {finding.impact.toUpperCase()} IMPACT</small></div><em>{finding.impact.toUpperCase()}</em></li>)}</ol></Panel>
        <Panel className="confidence-panel"><SectionTitle eyebrow="API ASSUMPTION CONFIDENCE" title="" />{result.assumptions.map((assumption) => <Progress key={assumption.text} label={assumption.text} value={Math.round(assumption.confidence * 100)} />)}<Link className="button primary" href="/orbit">Generate Growth Plan</Link></Panel>
      </div>
      <Panel><SectionTitle eyebrow="OBSERVED FACTS" title="What the API used" /><ul>{result.observed_facts.map((fact) => <li key={fact}>{fact}</li>)}</ul></Panel>
    </> : null}
  </AppShell>;
}
