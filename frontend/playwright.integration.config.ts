import { defineConfig, devices } from "@playwright/test";


export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "integration.spec.ts",
  outputDir: "./qa/integration-test-results",
  reporter: [["list"], ["html", { outputFolder: "./qa/integration-playwright-report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "integrated-desktop-chrome", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1024 } } },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
