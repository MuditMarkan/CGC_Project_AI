import { expect, test } from "@playwright/test";

test("public Professional discovery sends the FE contract and renders verified fields", async ({ page }) => {
  await page.route("**/api/v1/discovery/instagram/profile", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(JSON.parse(request.postData() ?? "{}")).toEqual({ target: "@kate.creator" });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "completed",
        provider: "meta_business_discovery",
        sample_data: false,
        target_username: "kate.creator",
        retrieved_at: "2026-09-16T20:00:00Z",
        profile: {
          username: "kate.creator",
          name: "Kate Creator",
          biography: "Public creator profile",
          profile_picture_url: null,
          followers_count: 1234,
          follows_count: 98,
          media_count: 42,
          media: [{
            id: "media-1",
            caption: "Example post",
            media_type: "IMAGE",
            media_url: null,
            permalink: "https://www.instagram.com/p/example/",
            thumbnail_url: null,
            timestamp: "2026-09-15T12:00:00Z",
            like_count: 50,
            comments_count: 4,
          }],
        },
        unavailable_fields: ["profile_picture_url"],
        limitations: ["Public Professional fields only."],
      }),
    });
  });
  await page.goto("/analysis");
  await page.getByLabel("Target username or profile URL").fill("@kate.creator");
  await page.getByRole("button", { name: "Get public profile data" }).click();
  await expect(page.getByText("Verified public Professional-account fields returned by Meta.")).toBeVisible();
  await expect(page.getByText("1234", { exact: true })).toBeVisible();
  await expect(page.getByText("42", { exact: true })).toBeVisible();
  await expect(page.locator(".discovery-result .finding-list").getByText("Example post", { exact: false })).toBeVisible();
  await expect(page.getByText("LIVE PUBLIC DATA", { exact: true })).toBeVisible();
});
import { mkdir } from "node:fs/promises";
import path from "node:path";

const evidenceDir = path.resolve("qa/evidence");

test.beforeAll(async () => {
  await mkdir(evidenceDir, { recursive: true });
});

test("all six destinations load and expose the current page", async ({ page }, testInfo) => {
  const routes = [
    ["/", "Welcome back, Narrative Co."],
    ["/analysis", "New Diagnostic Audit"],
    ["/audit", "Diagnostic Audit Results"],
    ["/orbit", "7-Day Sequential Growth Plan"],
    ["/experiments", "Experiment Diagnostics"],
    ["/reports", "Export Report"],
  ] as const;

  for (const [route, heading] of routes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    const currentLink = testInfo.project.name.startsWith("mobile")
      ? page.locator('.mobile-nav [aria-current="page"]')
      : page.locator('.desktop-nav a[aria-current="page"]');
    await expect(currentLink).toBeVisible();
  }
  await page.screenshot({ path: path.join(evidenceDir, `${testInfo.project.name}-reports.png`), fullPage: true });
});

test("analysis form validates input and completes the deterministic flow", async ({ page }, testInfo) => {
  await page.goto("/analysis");
  await page.getByRole("button", { name: "Run System Diagnostic" }).click();
  await expect(page.getByText("Check the highlighted fields and try again.")).toBeVisible();
  await expect(page.getByText("Provide a public URL or paste the content.")).toBeVisible();

  await page.getByLabel("Post Caption Text").fill("A practical guide to using AI for a small service business.");
  await page.getByRole("button", { name: "Run System Diagnostic" }).click();

  await expect(page.getByRole("heading", { name: "Your growth signal plan" })).toBeVisible();
  await expect(page.getByText("SAMPLE DATA", { exact: true })).toBeVisible();
  await expect(page.locator(".plan-list > li")).toHaveCount(7);
  await expect(page.locator(".finding-list > li")).toHaveCount(3);
  await page.screenshot({ path: path.join(evidenceDir, `${testInfo.project.name}-analysis-result.png`), fullPage: true });
});

test("Anusha findings: paste, dropdown, clear, and growth-plan spacing work", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { readText: async () => "https://www.instagram.com/p/cgc-test/" },
    });
  });
  await page.goto("/analysis");

  await page.getByRole("button", { name: "Paste Link" }).click();
  await expect(page.getByLabel("Instagram Post URL")).toHaveValue("https://www.instagram.com/p/cgc-test/");
  await expect(page.getByText("Link pasted from the clipboard.")).toBeVisible();

  const medium = page.getByLabel("Content Medium");
  await expect(medium).toBeEnabled();
  await expect(medium.locator("option")).toHaveCount(4);
  await medium.selectOption("reel");
  await expect(medium).toHaveValue("reel");

  await page.getByLabel("Post Caption Text").fill("Temporary content");
  await page.getByRole("button", { name: "Clear Form" }).click();
  await expect(page.getByLabel("Instagram Post URL")).toHaveValue("");
  await expect(page.getByLabel("Post Caption Text")).toHaveValue("");
  await expect(page.getByText("Form cleared.")).toBeVisible();

  await page.getByLabel("Post Caption Text").fill("A practical guide to using AI for a small service business.");
  await page.getByRole("button", { name: "Run System Diagnostic" }).click();
  await page.getByRole("link", { name: "Open Audit Results" }).click();
  await expect(page.locator(".structured-findings > li")).toHaveCount(3);
  const lastMetric = page.locator(".confidence-panel .progress-item").last();
  const growthPlan = page.getByRole("link", { name: "Generate Growth Plan" });
  const metricBox = await lastMetric.boundingBox();
  const buttonBox = await growthPlan.boundingBox();
  expect(metricBox).not.toBeNull();
  expect(buttonBox).not.toBeNull();
  expect(buttonBox!.y).toBeGreaterThanOrEqual(metricBox!.y + metricBox!.height);
  await growthPlan.click();
  await expect(page.getByRole("heading", { level: 1, name: "7-Day Sequential Growth Plan" })).toBeVisible();
  await expect(page.locator("tbody > tr")).toHaveCount(7);
});

test("responsive navigation switches between desktop and mobile", async ({ page }, testInfo) => {
  await page.goto("/");
  if (testInfo.project.name.startsWith("mobile")) {
    await expect(page.locator(".sidebar")).toBeHidden();
    await expect(page.locator(".mobile-nav")).toBeVisible();
    await expect(page.locator(".mobile-nav").getByRole("link")).toHaveCount(4);
    await page.getByRole("button", { name: "More" }).click();
    await expect(page.getByRole("link", { name: /Experiment Results/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Export/ })).toBeVisible();
  } else {
    await expect(page.locator(".sidebar")).toBeVisible();
    await expect(page.locator(".mobile-nav")).toBeHidden();
  }
});
