import { expect, test } from "@playwright/test";


test("real frontend reaches FastAPI and renders the contract response", async ({ page }) => {
  await page.goto("/analysis");
  await page.getByLabel("Post Caption Text").fill("A practical guide to AI for a small service business.");
  await page.getByLabel("Content Medium").selectOption("reel");

  const apiResponse = page.waitForResponse((response) =>
    response.url().endsWith("/api/v1/analyses") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Run System Diagnostic" }).click();
  const response = await apiResponse;

  expect(response.status()).toBe(200);
  const payload = await response.json();
  expect(payload.provider).toBe("mock");
  expect(payload.sample_data).toBe(true);
  expect(payload.seven_day_plan).toHaveLength(7);
  expect(payload.observed_facts).toContain("The selected content medium is reel.");
  await expect(page.getByText("Analysis completed.")).toBeVisible();
  await expect(page.getByText("SAMPLE DATA", { exact: true })).toBeVisible();
  await expect(page.locator(".plan-list > li")).toHaveCount(7);
  await page.screenshot({ path: "qa/evidence/integrated-frontend-fastapi.png", fullPage: true });
});
