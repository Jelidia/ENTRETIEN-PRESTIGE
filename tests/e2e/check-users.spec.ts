import { test } from '@playwright/test';

test('Check users in database', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  // Login as admin
  await page.goto('http://localhost:3001/login');
  await page.fill('#email', 'jelidiadam12@gmail.com');
  await page.fill('#password', 'Prestige2026!');

  await Promise.all([
    page.waitForURL('**/dashboard', { timeout: 10000 }),
    page.click('button[type="submit"]')
  ]);

  // Navigate to team page
  await page.goto('http://localhost:3001/team');
  await page.waitForLoadState('networkidle');

  // Count team members
  const teamMembers = await page.locator('.list-item').all();
  console.log(`Team members count: ${teamMembers.length}`);

  // Log each member's details
  for (const member of teamMembers) {
    const text = await member.textContent();
    console.log(`Member: ${text}`);
  }

  // Check the subtitle which shows total count
  const subtitle = await page.locator('.top-bar-title .card-meta').textContent();
  console.log(`Team page subtitle: ${subtitle}`);
});
