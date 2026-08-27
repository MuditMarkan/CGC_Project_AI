import { AppShell } from "@/components/app-shell";
import Link from "next/link";
import { Panel, SectionTitle } from "@/components/ui";

export default function DashboardPage() {
  return (
    <AppShell title="Welcome back, Narrative Co." eyebrow="" subtitle="Instagram nano-business analytics & diagnostics engine.">
      <div className="metric-grid dashboard-metrics">
        <Panel className="metric"><span>SAVES PER REACH (CORE RATIO)</span><strong>4.12%</strong><small>↗ 0.8% this week</small><div className="mini-bar" /></Panel>
        <Panel className="metric"><span>BENCHMARK COMPARISON</span><strong>Top 15%</strong><small>vs micro peer group</small></Panel>
        <Panel className="metric"><span>LATEST DIAGNOSTIC TARGET</span><div className="diagnostic-placeholder" /><small>Post ID: instagram-reel-0923</small></Panel>
      </div>
      <div className="dashboard-grid two-one">
        <Panel><SectionTitle eyebrow="" title="Recent Diagnostic Audits" /><ul className="plain-list"><li><span><b>Carousel Post</b><small>May 14, 2025</small></span><em>Audit Complete</em></li><li><span><b>Video / Reel</b><small>May 12, 2025</small></span><em>Audit Complete</em></li><li><span><b>Single Image</b><small>May 09, 2025</small></span><em>Archived</em></li></ul></Panel>
        <Panel className="next-step"><SectionTitle eyebrow="RECOMMENDED NEXT STEP" title="Run audit on latest carousel" copy="Saves dropped slightly on your last post. We need to verify if the headline structure is the driver before launching your next experiment." /><Link className="button primary" href="/analysis">Start New Analysis</Link></Panel>
      </div>
    </AppShell>
  );
}
