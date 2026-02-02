import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

const USERS = {
  admin: { email: 'jelidiadam12@gmail.com', password: 'Prestige2026!', expectedDashboard: '/dashboard' },
  manager: { email: 'youssef.takhi@hotmail.com', password: 'Prestige2026!', expectedDashboard: '/dashboard' },
  sales: { email: 'jelidiadam12+2@gmail.com', password: 'Prestige2026!', expectedDashboard: '/sales/dashboard' },
  technician: { email: 'jelidiadam12+1@gmail.com', password: 'Prestige2026!', expectedDashboard: '/technician' },
};

test.describe('Complete Site Testing - All Users', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to mobile size (max 640px as per requirements)
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('Admin - Full Flow Test', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', USERS.admin.email);
    await page.fill('input[type="password"]', USERS.admin.password);

    // Submit and wait for navigation
    await Promise.all([
      page.waitForURL(/dashboard/, { timeout: 10000 }),
      page.click('button[type="submit"]')
    ]);

    // Check we're on the right dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Check for logout button (icon-only button with SVG)
    const logoutButtons = await page.locator('button[aria-label*="déconnect" i], button:has(svg):has(path[d*="M9 21"])').count();
    const hasLogoutButton = logoutButtons > 0;
    console.log('Admin - Logout button found:', hasLogoutButton);

    // Test navigation tabs
    const navTabs = await page.locator('.bottom-nav a, .bottom-nav-item').count();
    console.log('Admin - Navigation tabs count:', navTabs);

    // Test Team page - click on Team tab in bottom navigation
    await page.goto(`${BASE_URL}/team`);
    await page.waitForLoadState('networkidle');

    // Check if team members are shown
    const teamMembers = await page.locator('.list-item').count();
    console.log('Admin - Team members shown:', teamMembers);
    expect(teamMembers).toBeGreaterThan(0);

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
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', USERS.manager.email);
    await page.fill('input[type="password"]', USERS.manager.password);

    await Promise.all([
      page.waitForURL(/dashboard/, { timeout: 10000 }),
      page.click('button[type="submit"]')
    ]);

    // Test Team page access
    await page.goto(`${BASE_URL}/team`);
    await page.waitForTimeout(1000);

    const teamMembers = await page.locator('.list-item').count();
    console.log('Manager - Team members shown:', teamMembers);
    expect(teamMembers).toBeGreaterThan(0);

    await page.screenshot({ path: 'tests/screenshots/manager-team.png', fullPage: true });
  });

  test('Sales Rep - Full Flow Test', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', USERS.sales.email);
    await page.fill('input[type="password"]', USERS.sales.password);

    await Promise.all([
      page.waitForURL(/sales/, { timeout: 10000 }),
      page.click('button[type="submit"]')
    ]);

    // Should be redirected to sales dashboard
    await expect(page).toHaveURL(/\/sales/);

    // Try to access admin /dashboard - should be redirected to sales dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(1000);

    const finalUrl = page.url();
    console.log('Sales - Tried to access /dashboard, ended at:', finalUrl);
    // Should be redirected to sales dashboard, not admin dashboard
    expect(finalUrl).toContain('/sales/dashboard');
    expect(finalUrl).not.toMatch(/^http:\/\/localhost:3001\/dashboard$/); // Not the admin dashboard

    await page.screenshot({ path: 'tests/screenshots/sales-dashboard.png', fullPage: true });
  });

  test('Technician - Full Flow Test', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', USERS.technician.email);
    await page.fill('input[type="password"]', USERS.technician.password);

    await Promise.all([
      page.waitForURL(/technician/, { timeout: 10000 }),
      page.click('button[type="submit"]')
    ]);

    // Should be redirected to technician page
    await expect(page).toHaveURL(/\/technician/);

    // Try to access /dashboard - should be redirected
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(1000);

    const finalUrl = page.url();
    console.log('Technician - Tried to access /dashboard, ended at:', finalUrl);
    expect(finalUrl).not.toContain('/dashboard');

    // Try to access /team - should be blocked
    await page.goto(`${BASE_URL}/team`);
    await page.waitForTimeout(1000);

    const teamUrl = page.url();
    console.log('Technician - Tried to access /team, ended at:', teamUrl);

    await page.screenshot({ path: 'tests/screenshots/technician-page.png', fullPage: true });
  });

  test('Check All Buttons and Links', async ({ page }) => {
    // Login as admin
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', USERS.admin.email);
    await page.fill('input[type="password"]', USERS.admin.password);

    await Promise.all([
      page.waitForURL(/dashboard/),
      page.click('button[type="submit"]')
    ]);

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

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', USERS.admin.email);
    await page.fill('input[type="password"]', USERS.admin.password);

    await Promise.all([
      page.waitForURL(/dashboard/),
      page.click('button[type="submit"]')
    ]);

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
