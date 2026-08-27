import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/ui";

export default function OrbitPage() {
  const days = [
    ["Day 1", "Revitalize last slide utilizing branded icon sequence.", "Creator", "Updated slide content", "None", "Audit Complete"],
    ["Day 2", "Design high-contrast cover using simple bold headline.", "Creator", "3 prototype drafts", "Day 1 outline", "Visual Match"],
    ["Day 3", "Run low-stakes content using native trending audio.", "Creator", "Published post", "Day 2 visuals", "Saves > 4.5%"],
    ["Day 4", "Refine and annotate copy task using core value.", "Creator", "Refined copy draft", "Day 3 feedback", "Qualitative OK"],
    ["Day 5", "Deploy best target-language hashtag rotation.", "Creator", "Configured posting", "Day 4", "Configuration Saved"],
    ["Day 6", "Filter system reflection on metadata and hashtags.", "Copilot", "Final diagnostic report", "Days 4 & 5", "No critical flags"],
    ["Day 7", "Schedule publication & activate experiment tracker.", "Creator", "Post live", "Day 6 pass", "Launched"],
  ];
  return <AppShell title="7-Day Sequential Growth Plan" eyebrow="" subtitle="Structured experiment targeting Save-Rate recovery.">
    <Panel className="plan-summary"><div><small>CURRENT CONDITION</small><b>94% Very High</b></div><div><small>TITLE TARGET</small><b>7 Continuous Days</b></div><div><small>EXPECTED STATE</small><b>7 Actions Assigned</b></div><div><small>SEQUENCE COMPLETION</small><div className="track"><i style={{ width: "32%" }} /></div><span>Day 2 Current</span></div></Panel>
    <Panel className="table-panel"><table><thead><tr><th>Day</th><th>Task Description</th><th>Owner</th><th>Expected Output</th><th>Dependency</th><th>Success Metric</th></tr></thead><tbody>{days.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></Panel>
  </AppShell>;
}
