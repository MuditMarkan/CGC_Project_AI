import { AppShell } from "@/components/app-shell";
import Link from "next/link";
import { Panel, Progress, SectionTitle } from "@/components/ui";

export default function AuditPage() {
  const findings = [
    ["Excessive Hashtag Bloat", "Your caption contains 24 hashtags. Audit logs show reach was penalized by 18% via anti-spam.", "HIGH IMPACT"],
    ["First Slide Retention Hook Deficit", "Slide dropout metrics show 72% of reached users stopped away within 12 seconds.", "HIGH IMPACT"],
    ["Missing Direct Save Trigger", "Despite high reach, no prompt was provided prompting readers to bookmark reference value.", "MEDIUM IMPACT"],
    ["Unclear Value Proposition", "The primary benefit was diluted by an indirect opening statement.", "LOW IMPACT"],
  ];
  return <AppShell title="Diagnostic Audit Results" eyebrow="" subtitle="Audit Reference ID: instagram-carousel-0823 (May 14th, 2025)">
    <div className="metric-grid four"><Panel className="metric"><span>QUALIFIED REACH</span><strong>12,482</strong></Panel><Panel className="metric"><span>TOTAL SAVES</span><strong>512</strong></Panel><Panel className="metric"><span>CALCULATED SAVE RATE</span><strong>4.1%</strong></Panel><Panel className="metric"><span>COMPARISON DELTA</span><strong>2.9%</strong></Panel></div>
    <div className="dashboard-grid two-one"><Panel><SectionTitle eyebrow="" title="Prioritized Structural Findings" /><ol className="structured-findings">{findings.map(([title, copy, impact], index) => <li key={title}><span>{index + 1}</span><div><b>{title}</b><p>{copy}</p><small>RECOMMENDATION: {index === 0 ? "Use 3–5 hyper-relevant or niche keywords." : index === 1 ? "Utilize single-sentence hook ending with question on Slide 1." : index === 2 ? "Explicitly direct CTA with reference value." : "Replace abstract intro with concrete results."}</small></div><em>{impact}</em></li>)}</ol></Panel>
    <Panel className="confidence-panel"><SectionTitle eyebrow="SYSTEM CONFIDENCE METRICS" title="" /><Progress label="Qualitative Copy Audit" value={100} /><Progress label="Engagement Validation" value={92} /><Progress label="Competitive Saturation" value={86} /><Link className="button primary" href="/orbit">Generate Growth Plan</Link></Panel></div>
  </AppShell>;
}
