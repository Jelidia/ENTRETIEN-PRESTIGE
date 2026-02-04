import { expect, test } from "@playwright/test";

test("home page redirects to login", async ({ page }) => {
  await page.goto("/");

  await page.waitForURL(/\/login/, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
});

test("login page shows sign-in form", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test.describe("responsive and accessibility checks", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("login form stays usable on mobile", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("checkbox", { name: /se souvenir/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

    const viewport = page.viewportSize();
    const cardBox = await page.locator(".auth-card").boundingBox();

    expect(viewport).not.toBeNull();
    expect(cardBox).not.toBeNull();

    if (viewport && cardBox) {
      expect(cardBox.width).toBeLessThanOrEqual(viewport.width);
    }
  });
});
