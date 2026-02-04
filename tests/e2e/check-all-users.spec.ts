import { test } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

const USERS = [
  { email: 'jelidiadam12@gmail.com', password: 'Prestige2026!', role: 'admin' },
  { email: 'youssef.takhi@hotmail.com', password: 'Prestige2026!', role: 'manager' },
  { email: 'jelidiadam12+2@gmail.com', password: 'Prestige2026!', role: 'sales' },
  { email: 'jelidiadam12+1@gmail.com', password: 'Prestige2026!', role: 'technician' },
];

for (const user of USERS) {
  test(`Check if ${user.role} user exists: ${user.email}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto(`${BASE_URL}/login`);
    await page.fill('#email', user.email);
    await page.fill('#password', user.password);

    const response = await page.request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: user.email,
        password: user.password,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log(`${user.role} (${user.email}):`, response.status(), result);
  });
}
