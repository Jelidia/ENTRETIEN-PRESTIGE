import { expect, test, type Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const USERS = {
  admin: { email: "jelidiadam12@gmail.com", password: "Prestige2026!" },
  manager: { email: "youssef.takhi@hotmail.com", password: "Prestige2026!" },
  sales: { email: "jelidiadam12+2@gmail.com", password: "Prestige2026!" },
  technician: { email: "jelidiadam12+1@gmail.com", password: "Prestige2026!" },
};

type ScrollCheck = {
  exists: boolean;
  scrollable: boolean;
  before: number;
  after: number;
  overflowY: string | null;
};

async function gotoPage(page: Page, path: string) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
}

async function login(page: Page, email: string, password: string, urlPattern: RegExp) {
  await page.context().clearCookies();
  await gotoPage(page, "/login");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#email")).toBeVisible({ timeout: 20000 });
  await page.fill("#email", email);
  await page.fill("#password", password);
  await Promise.all([
    page.waitForURL(urlPattern, { timeout: 30000, waitUntil: "domcontentloaded" }),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForLoadState("domcontentloaded");
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

test.describe("manual verification", () => {
  test.setTimeout(120000);
  test.use({ viewport: { width: 390, height: 844 } });

  test("root redirects to login", async ({ page }) => {
    await gotoPage(page, "/");
    await page.waitForURL(/\/login/, { timeout: 20000 });
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByText("Dispatch Entretien Prestige")).toHaveCount(0);
  });

  test("admin: core pages scroll + team api + users list", async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password, /\/dashboard/);

    const pages = ["/dashboard", "/team", "/profile", "/admin/users"];
    for (const path of pages) {
      await gotoPage(page, path);
      await page.waitForTimeout(300);
      await expect(page.locator(".content")).toBeVisible({ timeout: 20000 });
      const scroll = await checkContentScroll(page);
      console.log(`Scroll check ${path}:`, scroll);
      expect(scroll.exists).toBeTruthy();
      expect(scroll.overflowY).not.toBe("hidden");
      if (scroll.scrollable) {
        expect(scroll.after).toBeGreaterThan(scroll.before);
      }
      expect(scroll.overflowY).not.toBe("visible");
    }

    await gotoPage(page, "/team");
    await page.waitForTimeout(1200);

    const apiUsers = await page.evaluate(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch("/api/users", { signal: controller.signal });
        const json = await res.json().catch(() => ({}));
        const data = Array.isArray(json.data) ? json.data : [];
        return { status: res.status, count: data.length };
      } catch {
        return { status: 0, count: 0 };
      } finally {
        clearTimeout(timeout);
      }
    });

    console.log("/api/users status", apiUsers.status, "count", apiUsers.count);
    expect(apiUsers.status).toBe(200);
    expect(apiUsers.count).toBeGreaterThan(0);

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

    await gotoPage(page, "/admin/users");
    await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 20000 });
    const adminUserRows = await page.locator("table tbody tr").count();
    console.log("Admin users rows", adminUserRows);
    expect(adminUserRows).toBeGreaterThan(0);
  });

  test("admin: create job via Jobs form", async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password, /\/dashboard/);
    await gotoPage(page, "/jobs");
    await page.waitForTimeout(800);

    await page.evaluate(() => {
      window.location.reload = () => {};
    });

    const customerId = await page.evaluate(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const list = await fetch("/api/customers", { signal: controller.signal });
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
          signal: controller.signal,
        });

        const createJson = await createRes.json().catch(() => ({}));
        if (!createRes.ok) {
          return null;
        }
        return createJson?.data?.customer_id ?? null;
      } catch {
        return null;
      } finally {
        clearTimeout(timeout);
      }
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

    const jobResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/jobs") && res.request().method() === "POST",
      { timeout: 20000 }
    );

    await page.getByRole("button", { name: "Save job" }).click();
    const response = await jobResponsePromise;
    const status = response.status();
    const text = await response.text().catch(() => "");
    const json = text ? JSON.parse(text) : null;

    console.log("Create job response", status, text || "(empty)");
    expect(status).toBe(201);
    if (json) {
      expect(json?.data?.job_id).toBeTruthy();
    }

  });

  test("admin: dispatch calendar controls", async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password, /\/dashboard/);
    await gotoPage(page, "/dispatch");
    await page.waitForTimeout(800);

    await expect(page.locator(".dispatch-calendar")).toBeVisible({ timeout: 20000 });

    const labelBefore = await page.locator(".dispatch-date").textContent();
    await page.getByRole("button", { name: /suiv\.?/i }).click();
    await page.waitForTimeout(300);
    const labelAfter = await page.locator(".dispatch-date").textContent();
    console.log("Dispatch date label", labelBefore, "->", labelAfter);
    expect(labelAfter).not.toBe(labelBefore);

    await page.getByRole("button", { name: /aujourd'hui/i }).click();
    await page.waitForTimeout(300);

    await page.getByRole("button", { name: /nouveau travail/i }).click();
    const quickCreate = page.locator(".quick-create-panel");
    await expect(quickCreate).toBeVisible();
    await quickCreate.getByRole("button", { name: "Fermer" }).click();
    await expect(quickCreate).toHaveCount(0);

    await page.getByRole("button", { name: /affectation auto/i }).click();
    await page.waitForTimeout(500);
    const statusHint = await page.locator(".hint").first().textContent();
    console.log("Dispatch status hint", statusHint?.trim() ?? "(none)");
  });

  test("admin: team member creation via admin users api", async ({ page }) => {
    test.skip(!hasServiceRoleKey, "SUPABASE_SERVICE_ROLE_KEY not set; skipping admin create user flow");
    await login(page, USERS.admin.email, USERS.admin.password, /\/dashboard/);
    await gotoPage(page, "/admin/users");
    await page.waitForTimeout(800);

    const uniqueEmail = `qa.user+${Date.now()}@example.com`;
    await page.getByRole("button", { name: /cr[eé]er un utilisateur/i }).click();

    const createModal = page.getByRole("heading", { name: /nouvel utilisateur/i }).locator("..");
    await expect(createModal).toBeVisible({ timeout: 20000 });
    await createModal.locator("input[type=\"email\"]").fill(uniqueEmail);
    await createModal.locator("input[type=\"password\"]").fill("Prestige2026!");
    await createModal.locator("input[type=\"text\"]").first().fill("QA User");
    const createResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/admin/users") && res.request().method() === "POST",
      { timeout: 20000 }
    );
    await createModal.getByRole("button", { name: "Créer" }).click();

    const createResponse = await createResponsePromise;

    const createStatus = createResponse.status();
    const createText = await createResponse.text().catch(() => "");
    const createJson = createText ? JSON.parse(createText) : null;
    console.log("Create user response", createStatus, createText || "(empty)");
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

  test("admin: create customer via form", async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password, /\/dashboard/);
    await gotoPage(page, "/customers");
    await page.waitForTimeout(800);

    await page.evaluate(() => {
      window.location.reload = () => {};
    });

    const stamp = Date.now();
    const customerEmail = `qa.customer+${stamp}@example.com`;

    await page.fill("#firstName", "QA");
    await page.fill("#lastName", `Customer-${stamp}`);
    await page.fill("#email", customerEmail);
    await page.fill("#phone", "5555555555");
    await page.fill("#address", "123 Test Street");
    await page.fill("#city", "Montreal");
    await page.fill("#postalCode", "H2X1Y4");

    const createResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/customers") && res.request().method() === "POST",
      { timeout: 20000 }
    );

    await page.getByRole("button", { name: "Enregistrer le client" }).click();
    const createResponse = await createResponsePromise;
    const createStatus = createResponse.status();
    const createText = await createResponse.text().catch(() => "");
    const createJson = createText ? JSON.parse(createText) : null;

    console.log("Create customer response", createStatus, createText || "(empty)");
    expect(createStatus).toBe(201);
    if (createJson) {
      expect(createJson?.data?.customer_id).toBeTruthy();
    }

  });

  test("all roles can login and logout", async ({ page }) => {
    const roles = [
      { name: "admin", user: USERS.admin, urlPattern: /\/dashboard/, protectedPath: "/dashboard" },
      { name: "manager", user: USERS.manager, urlPattern: /\/dashboard/, protectedPath: "/dashboard" },
      { name: "sales", user: USERS.sales, urlPattern: /\/sales/, protectedPath: "/sales/dashboard" },
      { name: "technician", user: USERS.technician, urlPattern: /\/technician/, protectedPath: "/technician" },
    ];

    for (const role of roles) {
      await login(page, role.user.email, role.user.password, role.urlPattern);
      await expect(page).toHaveURL(role.urlPattern);

      const logoutResponse = await page.request.post(`${BASE_URL}/api/auth/logout`);
      console.log(`Logout response for ${role.name}:`, logoutResponse.status());
      expect(logoutResponse.status()).toBe(200);

      await gotoPage(page, role.protectedPath);
      await page.waitForURL(/\/login/, { timeout: 20000 });
      await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    }
  });

  test("manager: settings loads + team visibility", async ({ page }) => {
    await login(page, USERS.manager.email, USERS.manager.password, /\/dashboard/);

    await gotoPage(page, "/settings");
    const sections = page.locator(".section");
    const loadingVisible = await page.getByText(/chargement|loading/i).isVisible().catch(() => false);
    const sectionVisible = await sections.first().isVisible().catch(() => false);
    const sectionCount = await sections.count();
    console.log("Settings loading visible", loadingVisible, "sections", sectionCount);
    expect(loadingVisible || sectionVisible).toBe(true);
    if (sectionVisible) {
      expect(sectionCount).toBeGreaterThan(0);
    }

    await gotoPage(page, "/team");
    await page.waitForTimeout(800);
    const managerHasMembers = await page.locator(".list-item").first().isVisible().catch(() => false);
    const managerEmptyState = await page.getByText(/aucun membre/i).isVisible().catch(() => false);
    expect(managerHasMembers || managerEmptyState).toBe(true);

    const managerApi = await page.evaluate(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch("/api/users", { signal: controller.signal });
        const json = await res.json().catch(() => ({}));
        const data = Array.isArray(json.data) ? json.data : [];
        return { status: res.status, count: data.length };
      } catch {
        return { status: 0, count: 0 };
      } finally {
        clearTimeout(timeout);
      }
    });

    console.log("Manager /api/users", managerApi);
    expect(managerApi.status).toBe(200);
    expect(managerApi.count).toBeGreaterThanOrEqual(0);

  });

  test("sales: leads page loads without timeout", async ({ page }) => {
    await login(page, USERS.sales.email, USERS.sales.password, /\/sales/);
    await gotoPage(page, "/sales/leads");
    await expect(page.getByRole("button", { name: /nouveau lead/i })).toBeVisible();
    await expect(page.getByText(/chargement/i)).toHaveCount(0);
  });

  test("technician: pages load", async ({ page }) => {
    await login(page, USERS.technician.email, USERS.technician.password, /\/technician/);

    await expect(page.locator(".bottom-nav")).toBeVisible();
    await expect(page.locator(".bottom-nav-item")).toHaveCount(5);

    const routes = [
      "/technician",
      "/technician/map",
      "/technician/equipment",
      "/technician/schedule",
      "/technician/profile",
      "/technician/customers",
    ];

    for (const route of routes) {
      await gotoPage(page, route);
      await page.waitForTimeout(800);
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
