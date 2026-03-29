import { expect, test } from "@playwright/test";

test.describe("sign-in", () => {
  test("shows branding and sign-in copy", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /my\s*expense\s*tracker/i }),
    ).toBeVisible();
    await expect(
      page.getByText("Sign In to your account", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Use your GitHub account to sign in and manage your expenses.",
        { exact: true },
      ),
    ).toBeVisible();
  });

  test("GitHub sign-in button is visible and enabled", async ({ page }) => {
    await page.goto("/");
    const githubButton = page.getByRole("button", {
      name: /sign in with github/i,
    });
    await expect(githubButton).toBeVisible();
    await expect(githubButton).toBeEnabled();
  });

  test("clicking GitHub sign-in navigates to GitHub OAuth", async ({
    page,
  }) => {
    await page.goto("/");
    const githubButton = page.getByRole("button", {
      name: /sign in with github/i,
    });
    await expect(githubButton).toBeVisible();

    // GitHub uses /login?return_to=.../login/oauth/authorize... (not /login/oauth in the path).
    await Promise.all([
      page.waitForURL(
        (url) =>
          url.hostname === "github.com" &&
          (url.pathname.startsWith("/login/oauth") ||
            (url.pathname === "/login" &&
              url.searchParams.get("return_to")?.includes("/login/oauth"))),
        { timeout: 30_000 },
      ),
      githubButton.click(),
    ]);

    await expect(page).toHaveURL(/github\.com\/login/);
  });
});
