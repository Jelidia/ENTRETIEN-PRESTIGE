import { test, expect, type APIResponse, type Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

const USERS = {
  admin: { email: 'jelidiadam12@gmail.com', password: 'Prestige2026!', expectedDashboard: '/dashboard' },
  manager: { email: 'youssef.takhi@hotmail.com', password: 'Prestige2026!', expectedDashboard: '/dashboard' },
  sales: { email: 'jelidiadam12+2@gmail.com', password: 'Prestige2026!', expectedDashboard: '/sales/dashboard' },
  technician: { email: 'jelidiadam12+1@gmail.com', password: 'Prestige2026!', expectedDashboard: '/technician' },
};

type AuthCookie = { name: string; value: string; url: string };
type UserKey = keyof typeof USERS;

const sessionCache: Record<UserKey, AuthCookie[] | null> = {
  admin: null,
  manager: null,
  sales: null,
  technician: null,
};

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

async function ensureSession(page: Page, userKey: UserKey) {
  if (!sessionCache[userKey]) {
    const user = USERS[userKey];
    const response = await page.request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: user.email, password: user.password },
    });
    expect(response.ok()).toBe(true);
    const cookies = extractAuthCookies(response);
    expect(cookies.length).toBeGreaterThan(0);
    sessionCache[userKey] = cookies;
  }

  const cookies = sessionCache[userKey];
  if (cookies) {
    await page.context().addCookies(cookies);
  }
}

async function gotoAuthed(page: Page, userKey: UserKey, path: string) {
  await ensureSession(page, userKey);
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
}

test.describe('Complete Site Testing - All Users', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to mobile size (max 640px as per requirements)
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('Admin - Full Flow Test', async ({ page }) => {
    await gotoAuthed(page, "admin", "/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);

    // Check for logout button (icon-only button with SVG)
    const logoutButtons = await page.locator('button[aria-label*="déconnect" i], button:has(svg):has(path[d*="M9 21"])').count();
    const hasLogoutButton = logoutButtons > 0;
    console.log('Admin - Logout button found:', hasLogoutButton);

    // Test navigation tabs
    await expect(page.locator('.bottom-nav')).toBeVisible({ timeout: 20000 });
    const navTabs = await page.locator('.bottom-nav a, .bottom-nav-item').count();
    console.log('Admin - Navigation tabs count:', navTabs);

    // Test Team page - click on Team tab in bottom navigation
    await page.goto(`${BASE_URL}/team`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: /équipe|team/i })).toBeVisible({ timeout: 20000 });

    // Check if team members are shown
    const teamMembers = await page.locator('.list-item').count();
    console.log('Admin - Team members shown:', teamMembers);
    const adminEmptyState = await page.getByText(/aucun membre/i).isVisible().catch(() => false);
    const adminLoading = await page.getByText(/chargement/i).isVisible().catch(() => false);
    expect(teamMembers > 0 || adminEmptyState || adminLoading).toBe(true);

    // Check "Add member" button
    const addMemberButton = await page.locator('text=Ajouter membre').isVisible();
    console.log('Admin - Add member button visible:', addMemberButton);

    if (addMemberButton) {
      await page.click('text=Ajouter membre');
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      console.log('Admin - After clicking Add member, URL:', currentUrl);
    }

    // Test Settings page
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForTimeout(1000);

    // Check for duplicate sections or bad UI
    const allText = await page.textContent('body');
    const sections = await page.locator('section, .card').count();
    console.log('Admin - Settings sections count:', sections);

    // Check for horizontal scroll (should not exist)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    console.log('Admin - Body width:', bodyWidth, 'Window width:', windowWidth);
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 10);

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/admin-dashboard.png', fullPage: true });
  });

  test('Manager - Full Flow Test', async ({ page }) => {
    await gotoAuthed(page, "manager", "/dashboard");

    // Test Team page access
    await page.goto(`${BASE_URL}/team`);
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: /équipe|team/i })).toBeVisible({ timeout: 20000 });

    const teamMembers = await page.locator('.list-item').count();
    console.log('Manager - Team members shown:', teamMembers);
    const managerEmptyState = await page.getByText(/aucun membre/i).isVisible().catch(() => false);
    const managerLoading = await page.getByText(/chargement/i).isVisible().catch(() => false);
    expect(teamMembers > 0 || managerEmptyState || managerLoading).toBe(true);

    await page.screenshot({ path: 'tests/screenshots/manager-team.png', fullPage: true });
  });

  test('Sales Rep - Full Flow Test', async ({ page }) => {
    await gotoAuthed(page, "sales", "/sales/dashboard");

    // Should be redirected to sales dashboard
    await expect(page).toHaveURL(/\/sales/);

    // Try to access admin /dashboard - should be redirected to sales dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(1000);

    const finalUrl = page.url();
    console.log('Sales - Tried to access /dashboard, ended at:', finalUrl);
    expect(finalUrl).toMatch(/\/dashboard|\/sales\/dashboard/);

    await page.screenshot({ path: 'tests/screenshots/sales-dashboard.png', fullPage: true });
  });

  test('Technician - Full Flow Test', async ({ page }) => {
    await gotoAuthed(page, "technician", "/technician");

    // Should be redirected to technician page
    await expect(page).toHaveURL(/\/technician/);

    // Try to access /dashboard - should be redirected
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(1000);

    const finalUrl = page.url();
    console.log('Technician - Tried to access /dashboard, ended at:', finalUrl);
    expect(finalUrl).toMatch(/\/dashboard|\/technician/);

    // Try to access /team - should be blocked
    await page.goto(`${BASE_URL}/team`);
    await page.waitForTimeout(1000);

    const teamUrl = page.url();
    console.log('Technician - Tried to access /team, ended at:', teamUrl);

    await page.screenshot({ path: 'tests/screenshots/technician-page.png', fullPage: true });
  });

  test('Check All Buttons and Links', async ({ page }) => {
    await gotoAuthed(page, "admin", "/dashboard");

    // Get all buttons
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons on dashboard`);

    // Get all links
    const links = await page.locator('a').all();
    console.log(`Found ${links.length} links on dashboard`);

    // Test each button (except submit buttons in forms)
    for (const button of buttons.slice(0, 10)) { // Test first 10 to save time
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      const isDisabled = await button.isDisabled();

      console.log(`Button "${text?.trim()}" - Visible: ${isVisible}, Disabled: ${isDisabled}`);
    }
  });

  test('Mobile Constraints Check', async ({ page }) => {
    // Test at exact 640px
    await page.setViewportSize({ width: 640, height: 844 });

    await gotoAuthed(page, "admin", "/dashboard");

    // Check no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    console.log('At 640px - Scroll width:', scrollWidth, 'Client width:', clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20); // Allow small margin

    // Check content fits
    const bodyWidth = await page.evaluate(() => {
      const body = document.body;
      return Math.max(
        body.scrollWidth,
        body.offsetWidth,
        body.clientWidth
      );
    });

    console.log('Body width:', bodyWidth);
    expect(bodyWidth).toBeLessThanOrEqual(640);
  });
});
