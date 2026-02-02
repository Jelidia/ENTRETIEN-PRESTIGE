import { expect, test, type Page } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

const USERS = {
  admin: { email: "jelidiadam12@gmail.com", password: "Prestige2026!" },
  manager: { email: "youssef.takhi@hotmail.com", password: "Prestige2026!" },
  technician: { email: "jelidiadam12+1@gmail.com", password: "Prestige2026!" },
};

type ScrollCheck = {
  exists: boolean;
  scrollable: boolean;
  before: number;
  after: number;
  overflowY: string | null;
};

async function login(page: Page, email: string, password: string, urlPattern: RegExp) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await Promise.all([
    page.waitForURL(urlPattern, { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForLoadState("networkidle");
}

async function checkContentScroll(page: Page): Promise<ScrollCheck> {
  return page.evaluate(() => {
    const el = document.querySelector(".content") as HTMLElement | null;
    if (!el) {
      return { exists: false, scrollable: false, before: 0, after: 0, overflowY: null };
    }
    const before = el.scrollTop;
    const scrollable = el.scrollHeight > el.clientHeight + 1;
    el.scrollTop = before + 400;
    const after = el.scrollTop;
    const overflowY = window.getComputedStyle(el).overflowY;
    return { exists: true, scrollable, before, after, overflowY };
  });
}

let adminTeamCount = 0;
let adminTotalUsers = 0;

test.describe("manual verification", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ viewport: { width: 390, height: 844 } });

  test("root redirects to login", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByText("Dispatch Entretien Prestige")).toHaveCount(0);
  });

  test("admin: core pages scroll + team api + users list", async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password, /\/dashboard/);

    const pages = ["/dashboard", "/team", "/profile", "/admin/users"];
    for (const path of pages) {
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState("networkidle");
      await expect(page.locator(".content")).toBeVisible();
      const scroll = await checkContentScroll(page);
      console.log(`Scroll check ${path}:`, scroll);
      if (scroll.scrollable) {
        expect(scroll.after).toBeGreaterThan(scroll.before);
      }
      expect(scroll.overflowY).not.toBe("visible");
    }

    await page.goto(`${BASE_URL}/team`);
    await page.waitForLoadState("networkidle");

    const apiUsers = await page.evaluate(async () => {
      const res = await fetch("/api/users");
      const json = await res.json().catch(() => ({}));
      const data = Array.isArray(json.data) ? json.data : [];
      return { status: res.status, count: data.length };
    });

    console.log("/api/users status", apiUsers.status, "count", apiUsers.count);
    expect(apiUsers.status).toBe(200);
    expect(apiUsers.count).toBeGreaterThan(0);
    adminTeamCount = apiUsers.count;

    const teamMembers = await page.locator(".list-item").count();
    console.log("Team members rendered", teamMembers);
    expect(teamMembers).toBeGreaterThan(0);

    const adminUsersMeta = await page.evaluate(async () => {
      const res = await fetch("/api/admin/users?page=1&limit=200");
      const json = await res.json().catch(() => ({}));
      return {
        status: res.status,
        total: json?.data?.total ?? 0,
        count: Array.isArray(json?.data?.users) ? json.data.users.length : 0,
      };
    });

    console.log("/api/admin/users total", adminUsersMeta.total, "count", adminUsersMeta.count);
    expect(adminUsersMeta.status).toBe(200);
    expect(adminUsersMeta.total).toBeGreaterThan(0);
    adminTotalUsers = adminUsersMeta.total;

    const adminUserRows = await page.locator("table tbody tr").count();
    console.log("Admin users rows", adminUserRows);
    expect(adminUserRows).toBeGreaterThan(0);
  });

  test("admin: create job via Jobs form", async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password, /\/dashboard/);
    await page.goto(`${BASE_URL}/jobs`);
    await page.waitForLoadState("networkidle");

    const customerId = await page.evaluate(async () => {
      const list = await fetch("/api/customers");
      const listJson = await list.json().catch(() => ({}));
      const customers = Array.isArray(listJson.data) ? listJson.data : [];
      if (customers.length > 0) {
        return customers[0].customer_id as string;
      }

      const createRes = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "Test",
          lastName: `Playwright-${Date.now()}`,
          email: `qa+${Date.now()}@example.com`,
          phone: "5555555555",
          type: "residential",
          address: "123 Test Street",
          city: "Montreal",
          postalCode: "H2X1Y4",
        }),
      });

      const createJson = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        return null;
      }
      return createJson?.data?.customer_id ?? null;
    });

    expect(customerId).toBeTruthy();

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const dateValue = `${yyyy}-${mm}-${dd}`;

    await page.fill("#customerId", String(customerId));
    await page.fill("#scheduledDate", dateValue);
    await page.fill("#start", "09:00");
    await page.fill("#end", "10:00");
    await page.fill("#address", "123 Test Street");
    await page.fill("#city", "Montreal");
    await page.fill("#postalCode", "H2X1Y4");
    await page.fill("#estimatedRevenue", "250");
    await page.fill("#description", "Playwright job creation test");

    const jobResponse = page.waitForResponse(
      (res) => res.url().includes("/api/jobs") && res.request().method() === "POST"
    );

    await page.getByRole("button", { name: "Save job" }).click();
    const response = await jobResponse;
    const status = response.status();
    const json = await response.json().catch(() => ({}));

    console.log("Create job response", status, json?.data?.job_id ?? null);
    expect(status).toBe(201);
    expect(json?.data?.job_id).toBeTruthy();
  });

  test("admin: dispatch calendar controls", async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password, /\/dashboard/);
    await page.goto(`${BASE_URL}/dispatch`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".dispatch-calendar")).toBeVisible();

    const labelBefore = await page.locator(".dispatch-date").textContent();
    await page.getByRole("button", { name: "Next" }).click();
    await page.waitForTimeout(300);
    const labelAfter = await page.locator(".dispatch-date").textContent();
    console.log("Dispatch date label", labelBefore, "->", labelAfter);
    expect(labelAfter).not.toBe(labelBefore);

    await page.getByRole("button", { name: "Today" }).click();
    await page.waitForTimeout(300);

    await page.getByRole("button", { name: "New job" }).click();
    await expect(page.getByText("Quick create")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("Quick create")).toHaveCount(0);

    await page.getByRole("button", { name: "Auto-assign" }).click();
    await page.waitForTimeout(500);
    const statusHint = await page.locator(".hint").first().textContent();
    console.log("Dispatch status hint", statusHint?.trim() ?? "(none)");
  });

  test("admin: team member creation via admin users api", async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password, /\/dashboard/);
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState("networkidle");

    const uniqueEmail = `qa.user+${Date.now()}@example.com`;
    await page.locator("button").filter({ hasText: "utilisateur" }).first().click();
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel(/mot de passe/i).fill("Prestige2026!");
    await page.getByLabel(/nom complet/i).fill("QA User");
    await page.locator("button[type=\"submit\"]").click();

    const createResponse = await page.waitForResponse(
      (res) => res.url().includes("/api/admin/users") && res.request().method() === "POST"
    );

    const createStatus = createResponse.status();
    const createJson = await createResponse.json().catch(() => ({}));
    console.log("Create user response", createStatus, createJson?.data?.email ?? null);
    expect(createStatus).toBe(200);

    const lookup = await page.evaluate(async (email: string) => {
      const res = await fetch("/api/admin/users?page=1&limit=200");
      const json = await res.json().catch(() => ({}));
      const users = Array.isArray(json?.data?.users) ? json.data.users : [];
      const match = users.find((user: { email?: string; user_id?: string }) => user.email === email);
      return { status: res.status, userId: match?.user_id ?? null };
    }, uniqueEmail);

    console.log("Lookup created user", lookup);
    expect(lookup.status).toBe(200);
    expect(lookup.userId).toBeTruthy();

    if (lookup.userId) {
      const deleteResult = await page.evaluate(async (userId: string) => {
        const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
        return res.status;
      }, lookup.userId);
      console.log("Delete user status", deleteResult);
      expect(deleteResult).toBe(200);
    }
  });

  test("manager: settings loads + team visibility", async ({ page }) => {
    await login(page, USERS.manager.email, USERS.manager.password, /\/dashboard/);

    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const loadingVisible = await page.getByText(/chargement|loading/i).isVisible();
    const sectionCount = await page.locator(".section").count();
    console.log("Settings loading visible", loadingVisible, "sections", sectionCount);
    expect(loadingVisible).toBeFalsy();
    expect(sectionCount).toBeGreaterThan(0);

    await page.goto(`${BASE_URL}/team`);
    await page.waitForLoadState("networkidle");

    const managerApi = await page.evaluate(async () => {
      const res = await fetch("/api/users");
      const json = await res.json().catch(() => ({}));
      const data = Array.isArray(json.data) ? json.data : [];
      return { status: res.status, count: data.length };
    });

    console.log("Manager /api/users", managerApi);
    expect(managerApi.status).toBe(200);
    expect(managerApi.count).toBeGreaterThan(0);

    if (adminTeamCount > 0) {
      expect(managerApi.count).toBe(adminTeamCount);
    }
    if (adminTotalUsers > 0) {
      expect(managerApi.count).toBe(adminTotalUsers);
    }
  });

  test("technician: pages load", async ({ page }) => {
    await login(page, USERS.technician.email, USERS.technician.password, /\/technician/);

    const routes = [
      "/technician",
      "/technician/map",
      "/technician/equipment",
      "/technician/schedule",
      "/technician/profile",
      "/technician/earnings",
      "/technician/customers",
    ];

    for (const route of routes) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForLoadState("networkidle");
      const errorCount = await page.locator("text=/error|erreur/i").count();
      console.log(`Technician ${route} error count`, errorCount);
      expect(errorCount).toBe(0);
      await expect(page.locator(".content")).toBeVisible();
    }

    const scroll = await checkContentScroll(page);
    console.log("Technician scroll check", scroll);
    if (scroll.scrollable) {
      expect(scroll.after).toBeGreaterThan(scroll.before);
    }
  });
});
