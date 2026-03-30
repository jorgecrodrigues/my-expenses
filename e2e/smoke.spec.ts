import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("serves the app", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok()).toBeTruthy();
  });
});
