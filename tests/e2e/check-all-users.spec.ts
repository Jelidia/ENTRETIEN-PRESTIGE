import { test } from '@playwright/test';

const USERS = [
  { email: 'jelidiadam12@gmail.com', password: 'Prestige2026!', role: 'admin' },
  { email: 'youssef.takhi@hotmail.com', password: 'Prestige2026!', role: 'manager' },
  { email: 'jelidiadam12+2@gmail.com', password: 'Prestige2026!', role: 'sales' },
  { email: 'jelidiadam12+1@gmail.com', password: 'Prestige2026!', role: 'technician' },
];

for (const user of USERS) {
  test(`Check if ${user.role} user exists: ${user.email}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('http://localhost:3001/login');
    await page.fill('#email', user.email);
    await page.fill('#password', user.password);

    const response = await page.request.post('http://localhost:3001/api/auth/login', {
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
