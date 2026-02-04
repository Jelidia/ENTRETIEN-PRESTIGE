/**
 * Phase 1 Implementation Tests
 * Testing Settings Page Rebuild, Team Page Enhancements, and Language Switching
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsPage from "@/app/(app)/settings/page";
import SalesSettingsPage from "@/app/(app)/sales/settings/page";
import TeamPage from "@/app/(app)/team/page";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/settings",
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockUser = {
  user_id: "123",
  email: "test@example.com",
  full_name: "Test User",
  phone: "+15145550123",
  role: "admin",
  company_id: "company-123",
  created_at: "2024-01-01T00:00:00Z",
  avatar_url: null,
  contract_document_url: null,
  id_document_front_url: null,
};

const mockAccessResponse = {
  userId: "123",
  role: "admin",
  permissions: {
    dashboard: true,
    settings: true,
    team: true,
    customers: true,
    jobs: true,
    invoices: true,
    dispatch: true,
    sales: true,
    operations: true,
    reports: true,
    notifications: true,
    technician: false,
  },
};

describe("Phase 1: Settings Page Rebuild", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("should render settings page with correct tabs", async () => {
    mockFetch.mockImplementation((url: RequestInfo | URL) => {
      if (url.includes("/api/access")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAccessResponse),
        });
      }
      if (url.includes("/api/users/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockUser }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(
      <LanguageProvider>
        <SettingsPage />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Paramètres")).toBeInTheDocument();
    });

    // Check for tabs (use getAllByText since text appears in both tab and heading)
    expect(screen.getAllByText("Mon profil")).toHaveLength(2); // Tab and heading
    expect(screen.getByText("Sécurité")).toBeInTheDocument();
    expect(screen.getByText("Préférences")).toBeInTheDocument();
  });

  it("should show profile information correctly", async () => {
    mockFetch.mockImplementation((url: RequestInfo | URL) => {
      if (url.includes("/api/access")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAccessResponse),
        });
      }
      if (url.includes("/api/users/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockUser }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(
      <LanguageProvider>
        <SettingsPage />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
      expect(screen.getByText("+15145550123")).toBeInTheDocument();
    });
  });

  it("should allow editing name via modal", async () => {
    mockFetch.mockImplementation((url: RequestInfo | URL) => {
      if (url.includes("/api/access")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAccessResponse),
        });
      }
      if (url.includes("/api/users/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockUser }),
        });
      }
      if (url.includes("/api/settings/profile")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { ...mockUser, full_name: "Updated Name" } }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(
      <LanguageProvider>
        <SettingsPage />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    // Click edit button for name
    const editButtons = screen.getAllByText("Modifier");
    fireEvent.click(editButtons[0]);

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText("Modifier le nom")).toBeInTheDocument();
    });
  });

  it("should switch language correctly", async () => {
    mockFetch.mockImplementation((url: RequestInfo | URL) => {
      if (url.includes("/api/access")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAccessResponse),
        });
      }
      if (url.includes("/api/users/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockUser }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(
      <LanguageProvider>
        <SettingsPage />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Paramètres")).toBeInTheDocument();
    });

    // Click Preferences tab
    fireEvent.click(screen.getByText("Préférences"));

    await waitFor(() => {
      expect(screen.getByText("Choisissez votre langue préférée")).toBeInTheDocument();
    });

    // Click English button
    const englishButton = screen.getByText("English");
    fireEvent.click(englishButton);

    // Check localStorage
    expect(localStorage.getItem("ep_language")).toBe("en");
  });

  it("should NOT show documents tab for admin users", async () => {
    mockFetch.mockImplementation((url: RequestInfo | URL) => {
      if (url.includes("/api/access")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAccessResponse),
        });
      }
      if (url.includes("/api/users/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockUser }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(
      <LanguageProvider>
        <SettingsPage />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Paramètres")).toBeInTheDocument();
    });

    // Documents tab should NOT be present for admin
    expect(screen.queryByText("Documents")).not.toBeInTheDocument();
  });

  it("should show documents tab for technician users", async () => {
    const techUser = { ...mockUser, role: "technician" };
    const techAccess = { ...mockAccessResponse, role: "technician" };

    mockFetch.mockImplementation((url: RequestInfo | URL) => {
      if (url.includes("/api/access")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(techAccess),
        });
      }
      if (url.includes("/api/users/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: techUser }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(
      <LanguageProvider>
        <SettingsPage />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Paramètres")).toBeInTheDocument();
    });

    // Documents tab SHOULD be present for technician
    expect(screen.getByText("Documents")).toBeInTheDocument();
  });
});

describe("Phase 1: Sales Settings Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("should render sales settings with territory section", async () => {
    const salesUser = { ...mockUser, role: "sales_rep" };
    const mockTerritory = {
      territory_id: "territory-1",
      territory_name: "Downtown Montreal",
      sales_rep_id: "123",
      total_customers: 50,
      active_customers: 42,
      monthly_revenue: 12500,
      day_of_week: "monday",
    };

    mockFetch.mockImplementation((url: RequestInfo | URL) => {
      if (url.includes("/api/users/me")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(salesUser),
        });
      }
      if (url.includes("/api/reports/territories")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [mockTerritory] }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(
      <LanguageProvider>
        <SalesSettingsPage />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Territoire assigné")).toBeInTheDocument();
      expect(screen.getByText("Downtown Montreal")).toBeInTheDocument();
      expect(screen.getByText("42 clients actifs • 50 total")).toBeInTheDocument();
    });
  });

  it("should allow updating day of week", async () => {
    const salesUser = { ...mockUser, role: "sales_rep" };
    const mockTerritory = {
      territory_id: "territory-1",
      territory_name: "Downtown Montreal",
      sales_rep_id: "123",
      total_customers: 50,
      active_customers: 42,
      monthly_revenue: 12500,
      day_of_week: "monday",
    };

    mockFetch.mockImplementation((url: RequestInfo | URL, options?: RequestInit) => {
      if (url.includes("/api/users/me")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(salesUser),
        });
      }
      if (url.includes("/api/reports/territories")) {
        if (options?.method === "PATCH") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [mockTerritory] }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(
      <LanguageProvider>
        <SalesSettingsPage />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Downtown Montreal")).toBeInTheDocument();
    });

    // Select a day
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "tuesday" } });

    // Click update button
    const updateButton = screen.getByText("Mettre à jour le jour");
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText(/Jour de la semaine mis à jour/)).toBeInTheDocument();
    });
  });
});

describe("Phase 1: Team Page Permissions Modal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should open permissions modal when clicking edit button", async () => {
    const mockTeamMembers = [
      {
        user_id: "user-1",
        full_name: "John Doe",
        email: "john@example.com",
        role: "technician",
        phone: "+15145551234",
        status: "active",
        access_permissions: null,
      },
    ];

    const mockCompany = {
      role_permissions: {
        technician: {
          dashboard: false,
          technician: true,
          settings: true,
        },
      },
    };

    mockFetch.mockImplementation((url: RequestInfo | URL) => {
      if (url.includes("/api/users") && !url.includes("/api/users/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockTeamMembers }),
        });
      }
      if (url.includes("/api/company")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockCompany }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(
      <LanguageProvider>
        <TeamPage />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Click "Modifier permissions" button
    const editButton = screen.getByText("Modifier permissions");
    fireEvent.click(editButton);

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText(/Modifier les permissions - John Doe/)).toBeInTheDocument();
    });
  });

  it("should allow saving custom permissions", async () => {
    const mockTeamMembers = [
      {
        user_id: "user-1",
        full_name: "John Doe",
        email: "john@example.com",
        role: "technician",
        phone: "+15145551234",
        status: "active",
        access_permissions: null,
      },
    ];

    const mockCompany = {
      role_permissions: {
        technician: {
          dashboard: false,
          technician: true,
          settings: true,
        },
      },
    };

    mockFetch.mockImplementation((url: RequestInfo | URL, options?: RequestInit) => {
      if (url.includes("/api/users/user-1") && options?.method === "PATCH") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      if (url.includes("/api/users") && !url.includes("/api/users/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockTeamMembers }),
        });
      }
      if (url.includes("/api/company")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockCompany }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(
      <LanguageProvider>
        <TeamPage />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Click "Modifier permissions" button
    const editButton = screen.getByText("Modifier permissions");
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText(/Modifier les permissions - John Doe/)).toBeInTheDocument();
    });

    // Click save button
    const saveButton = screen.getByText("Sauvegarder");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Permissions mises à jour avec succès")).toBeInTheDocument();
    });
  });
});
