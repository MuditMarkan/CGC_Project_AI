import { AppShell } from "@/components/app-shell";
import { Panel, SectionTitle } from "@/components/ui";

export default function ExperimentsPage() {
  return <AppShell title="Experiment Diagnostics" eyebrow="" subtitle="Validation status for experimental carousel HCP-0823">
    <div className="hypothesis-banner"><small>HYPOTHESIS STATEMENT</small><p>“If we decrease Slide 1 with a concrete contrasting question and append a save-prompt at the end, the Saves per Reach ratio will increase by at least +15% compared to last cycle 30-day baseline.”</p></div>
    <div className="metric-grid three"><Panel className="metric"><span>BASELINE VALUE (PAST 30D)</span><strong>2.62%</strong></Panel><Panel className="metric"><span>TARGET HYPOTHESIS</span><strong>4.12%</strong></Panel><Panel className="metric"><span>MEASURED OUTCOME</span><strong>4.92%</strong><small>+21.3% improvement</small></Panel></div>
    <div className="dashboard-grid two-one"><Panel><SectionTitle eyebrow="" title="Decision Rule Verification" /><p>Criterion: The measured save rate must exceed the base + target improvement threshold (4.12% total target) over a minimum observation window of 48 hours.</p><dl className="verification"><div><dt>Min reach achieved</dt><dd>14,382 accounts reached (PASS)</dd></div><div><dt>Observation time window</dt><dd>72 hours continuous (PASS)</dd></div></dl></Panel><Panel className="passed"><SectionTitle eyebrow="EXPERIMENT VERDICT" title="● HYPOTHESIS PASSED" copy="Saves Per Reach increased past our threshold of +15% by +21.3%. This confirms the Slide 1 concrete question, written in a visible cue template for carousel-type posts." /><small>Notes & Observations</small><div className="note-box">High save clustering between slides 2 and 4 suggests...</div></Panel></div>
  </AppShell>;
}
