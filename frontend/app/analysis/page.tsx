import { AppShell } from "@/components/app-shell";
import { AnalysisForm } from "@/components/analysis-form";
import { Panel, SectionTitle } from "@/components/ui";

export default function AnalysisPage() {
  return <AppShell title="New Diagnostic Audit" eyebrow="" subtitle="Paste your Instagram URL to load metrics automatically, or input manually.">
    <Panel><SectionTitle eyebrow="" title="" /><AnalysisForm /></Panel>
  </AppShell>;
}
