import { test, expect } from '@playwright/test';

test('Quick Login and Navigation Test', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  // Go to login
  await page.goto('http://localhost:3001/login');
  await page.screenshot({ path: 'tests/screenshots/01-login-page.png', fullPage: true });

  // Fill login form
  await page.fill('#email', 'jelidiadam12@gmail.com');
  await page.fill('#password', 'Prestige2026!');
  await page.screenshot({ path: 'tests/screenshots/02-filled-form.png', fullPage: true });

  // Submit and wait for navigation
  await Promise.all([
    page.waitForURL('**/dashboard', { timeout: 10000 }),
    page.click('button[type="submit"]')
  ]);
  await page.waitForLoadState('networkidle');

  await page.screenshot({ path: 'tests/screenshots/03-after-login.png', fullPage: true });

  console.log('Current URL:', page.url());
  console.log('Page title:', await page.title());

  // Check navigation
  const navLinks = await page.locator('nav a, [role="navigation"] a').all();
  console.log('Navigation links found:', navLinks.length);

  for (const link of navLinks) {
    const text = await link.textContent();
    const href = await link.getAttribute('href');
    console.log(`Nav link: "${text}" -> ${href}`);
  }

  // Go to team page
  try {
    await page.goto('http://localhost:3001/team');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/04-team-page.png', fullPage: true });

    const teamMembers = await page.locator('.list-item').count();
    console.log('Team members shown:', teamMembers);

    const pageText = await page.locator('body').textContent();
    console.log('Team page content (first 500 chars):', pageText?.substring(0, 500));
  } catch (e) {
    console.error('Team page error:', e);
  }
});
