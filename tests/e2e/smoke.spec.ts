import { expect, test } from "@playwright/test";

test("home page redirects to login", async ({ page }) => {
  await page.goto("/");

  await page.waitForURL(/\/login/, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole("heading", { name: /connexion/i })).toBeVisible();
});

test("login page shows sign-in form", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
  await expect(page.getByLabel("Courriel")).toBeVisible();
  await expect(page.getByLabel("Mot de passe")).toBeVisible();
  await expect(page.getByRole("button", { name: "Se connecter" })).toBeVisible();
});

test.describe("responsive and accessibility checks", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("login form stays usable on mobile", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: /connexion/i })).toBeVisible();
    await expect(page.getByLabel("Courriel")).toBeVisible();
    await expect(page.getByLabel("Mot de passe")).toBeVisible();
    await expect(page.getByRole("checkbox", { name: /se souvenir/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /se connecter/i })).toBeVisible();

    const viewport = page.viewportSize();
    const cardBox = await page.locator(".auth-card").boundingBox();

    expect(viewport).not.toBeNull();
    expect(cardBox).not.toBeNull();

    if (viewport && cardBox) {
      expect(cardBox.width).toBeLessThanOrEqual(viewport.width);
    }
  });
});
