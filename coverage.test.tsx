import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { createAdminClient } from "@/lib/supabaseServer";
import StatusBadge from "@/components/StatusBadge";
import { formatPhoneNumber, smsTemplates } from "@/lib/smsTemplates";
import { mergeRolePermissions, resolvePermissions } from "@/lib/permissions";
import { getBaseUrl, isProd } from "@/lib/env";
import { createNotification } from "@/lib/notifications";

describe("StatusBadge", () => {
  it("renders warning tone for delayed statuses", () => {
    render(<StatusBadge status="Delayed" />);
    const badge = screen.getByText("Delayed");
    expect(badge).toHaveClass("badge-warning");
  });

  it("renders danger tone for issue statuses", () => {
    render(<StatusBadge status="Issue detected" />);
    const badge = screen.getByText("Issue detected");
    expect(badge).toHaveClass("badge-danger");
  });

  it("renders success tone for normal statuses", () => {
    render(<StatusBadge status="Completed" />);
    const badge = screen.getByText("Completed");
    expect(badge).toHaveClass("badge-success");
  });
});

describe("smsTemplates", () => {
  it("formats phone numbers to E.164", () => {
    expect(formatPhoneNumber("514-555-1234")).toBe("+15145551234");
    expect(formatPhoneNumber("15145551234")).toBe("+15145551234");
    expect(formatPhoneNumber("+15145551234")).toBe("+15145551234");
    expect(formatPhoneNumber("(514) 555-1234 x9")).toBe("+51455512349");
    expect(formatPhoneNumber("+44 20 1234 5678")).toBe("+44 20 1234 5678");
  });

  it("renders a sample job scheduled template", () => {
    const message = smsTemplates.jobScheduled({
      customerName: "Marie",
      date: "2026-02-01",
      time: "10:00",
      address: "123 Rue Test",
    });
    expect(message).toContain("Marie");
    expect(message).toContain("2026-02-01");
  });

  it("renders remaining templates", () => {
    expect(smsTemplates.reminder24h({ time: "08:00", date: "2026-02-02" })).toContain("08:00");
    expect(smsTemplates.reminder1h({ time: "09:00" })).toContain("09:00");
    expect(
      smsTemplates.jobCompletedInterac({
        invoiceNumber: "INV-1",
        amount: "$25",
        email: "test@example.com",
      })
    ).toContain("INV-1");
    expect(
      smsTemplates.jobCompletedStripe({
        invoiceNumber: "INV-2",
        amount: "$30",
        paymentLink: "https://pay",
      })
    ).toContain("https://pay");
    expect(smsTemplates.jobCompletedCash()).toContain("Service terminé");
    expect(smsTemplates.noShow()).toContain("reprogrammer");
    expect(smsTemplates.latePayment3Days({ invoiceNumber: "INV-3", amount: "$40" })).toContain("INV-3");
    expect(smsTemplates.latePayment7Days({ invoiceNumber: "INV-4", amount: "$50" })).toContain("INV-4");
    expect(smsTemplates.latePayment14Days({ invoiceNumber: "INV-5", amount: "$60" })).toContain("INV-5");
    expect(smsTemplates.availabilityReminder({ name: "Alex" })).toContain("Alex");
    expect(smsTemplates.ratingRequest({ customerName: "Lina", ratingLink: "https://rate" })).toContain("https://rate");
  });
});

describe("permissions", () => {
  it("merges role permissions with overrides", () => {
    const merged = mergeRolePermissions({
      technician: { reports: false },
    });
    expect(merged.technician.reports).toBe(false);
    expect(merged.technician.jobs).toBe(true);
  });

  it("returns defaults when no role overrides are provided", () => {
    const merged = mergeRolePermissions();
    expect(merged.admin.dashboard).toBe(true);
  });

  it("resolves permissions with user overrides", () => {
    const resolved = resolvePermissions(
      "sales_rep",
      { sales_rep: { jobs: false } },
      { jobs: true }
    );
    expect(resolved.jobs).toBe(true);
    expect(resolved.sales).toBe(true);
  });

  it("resolves permissions with role overrides", () => {
    const resolved = resolvePermissions("technician", {
      technician: { jobs: false },
    });
    expect(resolved.jobs).toBe(false);
    expect(resolved.technician).toBe(true);
  });

  it("falls back to empty permissions for unknown roles", () => {
    const resolved = resolvePermissions("contractor");
    expect(resolved.dashboard).toBe(false);
    expect(resolved.jobs).toBe(false);
  });

  it("falls back to base role permissions", () => {
    const resolved = resolvePermissions("manager");
    expect(resolved.dashboard).toBe(true);
    expect(resolved.team).toBe(true);
  });

  it("merges overrides for new roles", () => {
    const merged = mergeRolePermissions({ contractor: { dashboard: true } });
    expect(merged.contractor.dashboard).toBe(true);
    expect(merged.contractor.jobs).toBe(false);
  });
});

describe("env helpers", () => {
  const env = process.env as Record<string, string | undefined>;
  const originalBaseUrl = env.NEXT_PUBLIC_BASE_URL;
  const originalEnv = env.NODE_ENV;

  afterEach(() => {
    env.NEXT_PUBLIC_BASE_URL = originalBaseUrl;
    env.NODE_ENV = originalEnv;
  });

  it("returns configured base url when present", () => {
    env.NEXT_PUBLIC_BASE_URL = "https://example.com";
    expect(getBaseUrl()).toBe("https://example.com");
  });

  it("returns fallback base url when missing", () => {
    delete env.NEXT_PUBLIC_BASE_URL;
    expect(getBaseUrl()).toBe("http://localhost:3000");
  });

  it("detects production environment", () => {
    env.NODE_ENV = "production";
    expect(isProd()).toBe(true);
  });
});

describe("crypto helpers", () => {
  const env = process.env as Record<string, string | undefined>;
  const originalKey = env.APP_ENCRYPTION_KEY;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    env.APP_ENCRYPTION_KEY = originalKey;
  });

  it("returns plaintext when no encryption key is set", async () => {
    delete env.APP_ENCRYPTION_KEY;
    const { encryptPayload, decryptPayload, hashCode } = await import("@/lib/crypto");
    const payload = "hello";
    expect(encryptPayload(payload)).toBe(payload);
    expect(decryptPayload(payload)).toBe(payload);
    expect(hashCode("value")).toHaveLength(64);
  });

  it("encrypts and decrypts payloads when key exists", async () => {
    env.APP_ENCRYPTION_KEY = Buffer.from(
      "12345678901234567890123456789012"
    ).toString("base64");
    const { encryptPayload, decryptPayload } = await import("@/lib/crypto");
    const payload = "secret";
    const encrypted = encryptPayload(payload);
    expect(encrypted).not.toBe(payload);
    expect(decryptPayload(encrypted)).toBe(payload);
    expect(decryptPayload("invalid")).toBe("");
  });
});

describe("notifications", () => {
  it("creates notifications with expected payload", async () => {
    const insert = vi.fn().mockResolvedValue({});
    const from = vi.fn().mockReturnValue({ insert });
    const admin = { from } as unknown as ReturnType<typeof createAdminClient>;

    await createNotification(admin, {
      userId: "user-1",
      companyId: "company-1",
      type: "system",
      title: "Update",
      body: "Message",
    });

    expect(from).toHaveBeenCalledWith("notifications");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        company_id: "company-1",
        type: "system",
        title: "Update",
        body: "Message",
      })
    );
  });
});
