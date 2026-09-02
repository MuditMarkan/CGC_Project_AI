import { AppShell } from "@/components/app-shell";
import { AnalysisForm } from "@/components/analysis-form";
import { Panel, SectionTitle } from "@/components/ui";

export default function AnalysisPage() {
  return <AppShell title="New Diagnostic Audit" eyebrow="" subtitle="Connect an authorized Professional account or provide a post reference and Insights manually.">
    <Panel><SectionTitle eyebrow="" title="" /><AnalysisForm /></Panel>
  </AppShell>;
}
