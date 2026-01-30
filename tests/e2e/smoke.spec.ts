import { expect, test } from "@playwright/test";

test("home page renders hero content", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Entretien Prestige")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Dispatch Entretien Prestige" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("login page shows sign-in form", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});
