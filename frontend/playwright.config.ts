import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: "**/integration.spec.ts",
  outputDir: "./qa/test-results",
  reporter: [["list"], ["html", { outputFolder: "./qa/playwright-report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1024 } } },
    { name: "mobile-chrome", use: { ...devices["iPhone 13"], browserName: "chromium", channel: "chrome", viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: "NEXT_PUBLIC_USE_MOCK=true npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
