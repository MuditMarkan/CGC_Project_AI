import { expect, test } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const evidenceDir = path.resolve("qa/alignment-evidence");

const screens = [
  { key: "dashboard", route: "/", heading: "Welcome back, Narrative Co." },
  { key: "analysis", route: "/analysis", heading: "New Diagnostic Audit" },
  { key: "audit", route: "/audit", heading: "Diagnostic Audit Results" },
  { key: "plan", route: "/orbit", heading: "7-Day Sequential Growth Plan" },
  { key: "experiments", route: "/experiments", heading: "Experiment Diagnostics" },
  { key: "export", route: "/reports", heading: "Export Report" },
] as const;

test.beforeAll(async () => {
  await mkdir(evidenceDir, { recursive: true });
});

test("all approved monochrome destinations render without overflow", async ({ page }, testInfo) => {
  const variant = testInfo.project.name.startsWith("mobile") ? "mobile" : "desktop";
  for (const screen of screens) {
    await page.goto(screen.route);
    await expect(page.getByRole("heading", { level: 1, name: screen.heading })).toBeVisible();
    const horizontalOverflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
    expect(horizontalOverflow, `${screen.key} has horizontal overflow`).toBeLessThanOrEqual(1);
    await page.screenshot({ path: path.join(evidenceDir, `approved-${variant}-${screen.key}.png`), fullPage: false });
  }
});

test("the retired command-deck visual language is absent", async () => {
  const css = await readFile(path.resolve("app/globals.css"), "utf8");
  expect(css).not.toContain("backdrop-filter");
  expect(css).not.toContain("radial-gradient");
  expect(css).not.toContain("--cyan");
  expect(css).not.toContain("--violet");
  expect(css).not.toContain("--orange");
});
