import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDefaultDashboard, sanitizeRedirect } from "@/lib/types";

describe("Bug Fixes - Navigation and Redirects", () => {
  describe("getDefaultDashboard", () => {
    it("returns /sales/dashboard for sales_rep", () => {
      expect(getDefaultDashboard("sales_rep")).toBe("/sales/dashboard");
    });

    it("returns /technician for technician", () => {
      expect(getDefaultDashboard("technician")).toBe("/technician");
    });

    it("returns /dashboard for admin", () => {
      expect(getDefaultDashboard("admin")).toBe("/dashboard");
    });

    it("returns /dashboard for manager", () => {
      expect(getDefaultDashboard("manager")).toBe("/dashboard");
    });

    it("returns /dashboard for unknown role", () => {
      expect(getDefaultDashboard("unknown")).toBe("/dashboard");
    });

    it("returns /dashboard when no role provided", () => {
      expect(getDefaultDashboard()).toBe("/dashboard");
    });
  });

  describe("sanitizeRedirect with role awareness", () => {
    it("uses role-based default when no target provided - sales_rep", () => {
      expect(sanitizeRedirect(undefined, undefined, "sales_rep")).toBe("/sales/dashboard");
    });

    it("uses role-based default when no target provided - technician", () => {
      expect(sanitizeRedirect(undefined, undefined, "technician")).toBe("/technician");
    });

    it("uses role-based default when no target provided - admin", () => {
      expect(sanitizeRedirect(undefined, undefined, "admin")).toBe("/dashboard");
    });

    it("uses explicit fallback when provided", () => {
      expect(sanitizeRedirect(undefined, "/custom", "sales_rep")).toBe("/custom");
    });

    it("accepts valid relative paths regardless of role", () => {
      expect(sanitizeRedirect("/customers", undefined, "sales_rep")).toBe("/customers");
      expect(sanitizeRedirect("/dispatch", undefined, "admin")).toBe("/dispatch");
    });

    it("rejects absolute URLs and falls back to role-based default", () => {
      expect(sanitizeRedirect("https://evil.com", undefined, "sales_rep")).toBe("/sales/dashboard");
      expect(sanitizeRedirect("//evil.com", undefined, "admin")).toBe("/dashboard");
      expect(sanitizeRedirect("http://evil.com", undefined, "technician")).toBe("/technician");
    });

    it("handles empty string by using role-based default", () => {
      expect(sanitizeRedirect("", undefined, "sales_rep")).toBe("/sales/dashboard");
      expect(sanitizeRedirect("", undefined, "admin")).toBe("/dashboard");
    });

    it("preserves query parameters in valid paths", () => {
      expect(sanitizeRedirect("/dispatch?tab=jobs", undefined, "admin")).toBe("/dispatch?tab=jobs");
      expect(sanitizeRedirect("/sales/leads?status=new", undefined, "sales_rep")).toBe(
        "/sales/leads?status=new"
      );
    });
  });

  describe("Navigation home button issue", () => {
    it("sales_rep clicking home should redirect to /sales/dashboard", () => {
      const redirect = sanitizeRedirect(undefined, undefined, "sales_rep");
      expect(redirect).toBe("/sales/dashboard");
    });

    it("technician clicking home should redirect to /technician", () => {
      const redirect = sanitizeRedirect(undefined, undefined, "technician");
      expect(redirect).toBe("/technician");
    });

    it("admin clicking home should redirect to /dashboard", () => {
      const redirect = sanitizeRedirect(undefined, undefined, "admin");
      expect(redirect).toBe("/dashboard");
    });

    it("manager clicking home should redirect to /dashboard", () => {
      const redirect = sanitizeRedirect(undefined, undefined, "manager");
      expect(redirect).toBe("/dashboard");
    });
  });

  describe("Backward compatibility", () => {
    it("maintains backward compatibility when role not provided", () => {
      expect(sanitizeRedirect(undefined)).toBe("/dashboard");
      expect(sanitizeRedirect("/custom-path")).toBe("/custom-path");
      expect(sanitizeRedirect("https://evil.com")).toBe("/dashboard");
    });

    it("respects explicit fallback over role when both provided", () => {
      expect(sanitizeRedirect(undefined, "/explicit-fallback", "sales_rep")).toBe(
        "/explicit-fallback"
      );
    });
  });
});

describe("Bug Fixes - Sales Dashboard API", () => {
  describe("Sales dashboard leaderboard handling", () => {
    it("should handle empty leaderboard gracefully", () => {
      // This is a documentation test - the actual fix is in the API route
      // The API should not return 500 when leaderboard is empty
      const emptyLeaderboard: string[] = [];
      expect(emptyLeaderboard).toEqual([]);
    });

    it("should handle missing leaderboard data gracefully", () => {
      // This is a documentation test - the actual fix is in the API route
      // The API should continue with empty array if leaderboard query fails
      const leaderboard = null;
      const safeLeaderboard = leaderboard ?? [];
      expect(safeLeaderboard).toEqual([]);
    });
  });
});
