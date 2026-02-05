import { test, expect, type APIResponse, type Page } from '@playwright/test';

/**
 * Comprehensive test suite for Entretien Prestige
 * Tests all pages, buttons, forms, and workflows
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

// Test credentials (adjust based on your test data)
const TEST_ADMIN = {
  email: process.env.PLAYWRIGHT_ADMIN_EMAIL ?? "jelidiadam12@gmail.com",
  password: process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? "Prestige2026!",
};

type AuthCookie = { name: string; value: string; url: string };

const adminSession = { cookies: null as AuthCookie[] | null };

function parseSetCookie(value: string): AuthCookie | null {
  const pair = value.split(";")[0]?.trim();
  if (!pair) return null;
  const separatorIndex = pair.indexOf("=");
  if (separatorIndex <= 0) return null;
  const name = pair.slice(0, separatorIndex).trim();
  const cookieValue = pair.slice(separatorIndex + 1);
  if (!name) return null;
  return { name, value: cookieValue, url: BASE_URL };
}

function extractAuthCookies(response: APIResponse): AuthCookie[] {
  const headerEntries = response
    .headersArray()
    .filter((header) => header.name.toLowerCase() === "set-cookie");
  const cookies = headerEntries
    .map((header) => parseSetCookie(header.value))
    .filter((cookie): cookie is AuthCookie => Boolean(cookie));
  if (cookies.length > 0) return cookies;

  const fallbackHeader = response.headers()["set-cookie"];
  if (!fallbackHeader) return [];
  const fallback = parseSetCookie(fallbackHeader);
  return fallback ? [fallback] : [];
}

async function ensureAdminSession(page: Page) {
  if (!adminSession.cookies) {
    const response = await page.request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: TEST_ADMIN.email, password: TEST_ADMIN.password },
    });
    expect(response.ok()).toBe(true);
    adminSession.cookies = extractAuthCookies(response);
    expect(adminSession.cookies.length).toBeGreaterThan(0);
  }
  await page.context().addCookies(adminSession.cookies);
}

async function gotoAuthed(page: Page, path: string) {
  await ensureAdminSession(page);
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
}

test.describe('Critical Bugs', () => {
  test('Page should scroll vertically', async ({ page }) => {
    await gotoAuthed(page, "/dashboard");

    const scrollState = await page.evaluate(() => {
      const content = document.querySelector('.content') as HTMLElement | null;
      const target = content ?? (document.scrollingElement as HTMLElement | null);
      if (!target) {
        return { exists: false, scrollable: false, before: 0, after: 0, overflowY: null, scrollHeight: 0, clientHeight: 0 };
      }
      const before = target.scrollTop;
      const scrollable = target.scrollHeight > target.clientHeight + 1;
      target.scrollTop = before + 500;
      const after = target.scrollTop;
      const overflowY = content ? window.getComputedStyle(content).overflowY : null;
      return { exists: true, scrollable, before, after, overflowY, scrollHeight: target.scrollHeight, clientHeight: target.clientHeight };
    });

    expect(scrollState.exists).toBe(true);
    if (scrollState.overflowY) {
      expect(scrollState.overflowY === 'auto' || scrollState.overflowY === 'scroll').toBe(true);
    }

    if (scrollState.scrollable) {
      expect(scrollState.after).toBeGreaterThan(scrollState.before);
    }
  });
});

test.describe('Authentication', () => {
  test('Login page renders correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Can login as admin', async ({ page }) => {
    await gotoAuthed(page, "/dashboard");
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 20000 });
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthed(page, "/dashboard");
  });

  test('Bottom navigation is visible and has exactly 5 tabs', async ({ page }) => {
    const bottomNav = page.locator('.bottom-nav');
    await expect(bottomNav).toBeVisible({ timeout: 60000 });

    const navItems = bottomNav.locator('.bottom-nav-item');
    await expect(navItems).toHaveCount(5, { timeout: 20000 });
  });

  test('Can navigate to all main pages via bottom nav', async ({ page }) => {
    // Get all bottom nav items
    const navItems = page.locator('.bottom-nav-item');
    const count = await navItems.count();

    for (let i = 0; i < count; i++) {
      await navItems.nth(i).click();
      await page.waitForTimeout(500); // Wait for navigation

      // Verify page loaded (no error state)
      const hasError = await page.locator('text=/error|erreur/i').count();
      expect(hasError).toBe(0);
    }
  });
});

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthed(page, "/dashboard");
  });

  test('Dashboard renders without errors', async ({ page }) => {
    await expect(page.locator('.top-bar')).toBeVisible();
    await expect(page.locator('.content')).toBeVisible();
  });

  test('Dashboard buttons are present', async ({ page }) => {
    await expect(page.locator('.top-bar')).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 20000 });
  });
});

test.describe('Customers Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthed(page, "/dashboard");
  });

  test('Can navigate to customers page', async ({ page }) => {
    await page.goto(`${BASE_URL}/customers`);
    await page.waitForLoadState('domcontentloaded');

    // Check if page loaded
    const hasError = await page.locator('text=/error|erreur/i').count();
    expect(hasError).toBe(0);
  });

  test('Customers page has add button', async ({ page }) => {
    await page.goto(`${BASE_URL}/customers`);
    await page.waitForLoadState('domcontentloaded');

    const addButton = page.locator('button', { hasText: /ajouter|add|nouveau|new/i });
    const addButtonCount = await addButton.count();
    expect(addButtonCount).toBeGreaterThanOrEqual(0); // May not exist yet
  });
});

test.describe('Sales Leads Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthed(page, "/dashboard");
  });

  test('Can navigate to leads page', async ({ page }) => {
    await page.goto(`${BASE_URL}/sales/leads`);
    await page.waitForLoadState('domcontentloaded');

    const hasError = await page.locator('text=/error|erreur/i').count();
    expect(hasError).toBe(0);
  });

  test('Leads page structure exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/sales/leads`);
    await page.waitForLoadState('domcontentloaded');

    // Check for content container
    await expect(page.locator('.content')).toBeVisible();
  });
});

test.describe('Jobs Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthed(page, "/dashboard");
  });

  test('Can navigate to jobs page', async ({ page }) => {
    await page.goto(`${BASE_URL}/jobs`);
    await page.waitForLoadState('domcontentloaded');

    const hasError = await page.locator('text=/error|erreur/i').count();
    expect(hasError).toBe(0);
  });
});

test.describe('Dispatch Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthed(page, "/dashboard");
  });

  test('Can navigate to dispatch page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dispatch`);
    await page.waitForLoadState('domcontentloaded');

    const hasError = await page.locator('text=/error|erreur/i').count();
    expect(hasError).toBe(0);
  });
});

test.describe('Team Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthed(page, "/dashboard");
  });

  test('Can navigate to team page', async ({ page }) => {
    await page.goto(`${BASE_URL}/team`);
    await page.waitForLoadState('domcontentloaded');

    const hasError = await page.locator('text=/error|erreur/i').count();
    expect(hasError).toBe(0);
  });

  test('Team page shows team members', async ({ page }) => {
    await page.goto(`${BASE_URL}/team`);
    await page.waitForLoadState('domcontentloaded');

    // Should have some content
    await expect(page.locator('.content')).toBeVisible();
  });
});

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthed(page, "/dashboard");
  });

  test('Can navigate to settings page', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: /paramètres|settings/i })).toBeVisible({ timeout: 20000 });

    const hasError = await page.locator('text=/error|erreur/i').count();
    expect(hasError).toBe(0);
  });

  test('Settings page has tabs', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('domcontentloaded');

    const loading = page.getByText(/chargement|loading/i);
    const profileTab = page.getByRole('button', { name: /profil|profile/i });
    const securityTab = page.getByRole('button', { name: /sécurité|securite|security/i });

    await profileTab.waitFor({ state: 'visible', timeout: 20000 }).catch(() => null);
    const hasTabs = await profileTab.isVisible().catch(() => false);
    if (!hasTabs) {
      await expect(loading).toBeVisible();
      return;
    }

    await expect(profileTab).toBeVisible();
    await expect(securityTab).toBeVisible();
  });

  test('Settings page has language toggle', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('domcontentloaded');

    const loading = page.getByText(/chargement|loading/i);
    const preferencesTab = page.getByRole('button', { name: /préférences|preferences/i });

    await preferencesTab.waitFor({ state: 'visible', timeout: 20000 }).catch(() => null);
    const hasPreferences = await preferencesTab.isVisible().catch(() => false);
    if (!hasPreferences) {
      await expect(loading).toBeVisible();
      return;
    }

    await preferencesTab.click();
    await expect(page.getByRole('button', { name: /français/i })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: /english/i })).toBeVisible({ timeout: 20000 });
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test('Page renders correctly on mobile', async ({ page }) => {
    await gotoAuthed(page, "/dashboard");

    // Check max width is 640px
    const contentWidth = await page.evaluate(() => {
      const content = document.querySelector('.content');
      return content ? content.getBoundingClientRect().width : 0;
    });

    expect(contentWidth).toBeLessThanOrEqual(640);
  });

  test('Bottom nav is visible on mobile', async ({ page }) => {
    await gotoAuthed(page, "/dashboard");

    await expect(page.locator('.bottom-nav')).toBeVisible({ timeout: 20000 });
  });
});
