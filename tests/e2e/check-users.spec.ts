import { expect, test, type APIResponse } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

type AuthCookie = { name: string; value: string; url: string };

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

test('Check users in database', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  const response = await page.request.post(`${BASE_URL}/api/auth/login`, {
    data: { email: "jelidiadam12@gmail.com", password: process.env.PLAYWRIGHT_PASSWORD ?? "DemoPassword2026!" },
  });
  expect(response.ok()).toBe(true);
  const cookies = extractAuthCookies(response);
  expect(cookies.length).toBeGreaterThan(0);
  await page.context().addCookies(cookies);

  // Navigate to team page
  await page.goto(`${BASE_URL}/team`, { waitUntil: "domcontentloaded", timeout: 60000 });

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
