import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TopBar from "@/components/TopBar";
import NoShowDialog from "@/components/NoShowDialog";
import HomePage from "@/app/page";
import NotFound from "@/app/not-found";
import LoginPage from "@/app/(auth)/login/page";
import ResetPasswordPage from "@/app/(auth)/reset-password/page";
import VerifyTwoFactorPage from "@/app/(auth)/verify-2fa/page";
import ForgotPasswordPage from "@/app/(auth)/forgot-password/page";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/auth/LoginForm", () => ({
  default: ({ redirect }: { redirect?: string }) => (
    <div data-testid="login-form">{redirect ?? "none"}</div>
  ),
}));

vi.mock("@/components/auth/ResetPasswordForm", () => ({
  default: ({ code }: { code?: string }) => (
    <div data-testid="reset-password-form">{code ?? "none"}</div>
  ),
}));

vi.mock("@/components/auth/VerifyTwoFactorForm", () => ({
  default: ({ challengeId, redirect }: { challengeId?: string; redirect?: string }) => (
    <div data-testid="verify-2fa-form">{`${challengeId ?? "none"}|${redirect ?? "none"}`}</div>
  ),
}));

vi.mock("@/components/BottomSheet", () => ({
  default: ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) =>
    isOpen ? <div data-testid="bottom-sheet">{children}</div> : null,
}));

describe("TopBar", () => {
  it("renders the logo and title", () => {
    render(<TopBar title="Dashboard" subtitle="Overview" />);

    const logo = document.querySelector("img.brand-logo") as HTMLImageElement | null;
    expect(logo).not.toBeNull();
    const logoSrc = logo?.getAttribute("src") ?? "";
    if (logoSrc.startsWith("/logo.png")) {
      expect(logoSrc).toBe("/logo.png");
    } else {
      const parsed = new URL(logoSrc, "http://localhost");
      expect(parsed.searchParams.get("url")).toBe("/logo.png");
    }
    if (logo) {
      fireEvent.error(logo);
    }
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders action content when provided", () => {
    render(<TopBar title="Settings" actions={<button type="button">Save</button>} />);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});

describe("core pages", () => {
  it("renders the home page content", () => {
    render(<HomePage />);
    expect(screen.getByText("Entretien Prestige")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });

  it("renders the not found page content", () => {
    render(<NotFound />);
    expect(screen.getByText("Page not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to dashboard" })).toHaveAttribute("href", "/dashboard");
  });

  it("passes redirect to login form", () => {
    render(<LoginPage searchParams={{ redirect: "/dashboard" }} />);
    expect(screen.getByTestId("login-form")).toHaveTextContent("/dashboard");
  });

  it("passes reset code to reset password form", () => {
    render(<ResetPasswordPage searchParams={{ code: "reset-code" }} />);
    expect(screen.getByTestId("reset-password-form")).toHaveTextContent("reset-code");
  });

  it("passes challenge and redirect to 2FA form", () => {
    render(
      <VerifyTwoFactorPage searchParams={{ challenge: "challenge-1", redirect: "/jobs" }} />
    );
    expect(screen.getByTestId("verify-2fa-form")).toHaveTextContent("challenge-1|/jobs");
  });
});

describe("forgot password page", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("shows server error on failure", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Erreur" }),
    });

    render(<ForgotPasswordPage />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText("Erreur")).toBeInTheDocument();
  });

  it("falls back to a generic error message", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    render(<ForgotPasswordPage />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText("Unable to send reset link")).toBeInTheDocument();
  });

  it("shows loading state while sending", async () => {
    let resolveFetch: (value: { ok: boolean; json: () => Promise<unknown> }) => void = () => undefined;
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    render(<ForgotPasswordPage />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(screen.getByRole("button", { name: "Sending..." })).toBeInTheDocument();

    resolveFetch({ ok: true, json: async () => ({}) });
    expect(await screen.findByText("Reset link sent. Check your inbox.")).toBeInTheDocument();
  });

  it("shows success message on completion", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<ForgotPasswordPage />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText("Reset link sent. Check your inbox.")).toBeInTheDocument();
  });
});

describe("NoShowDialog", () => {
  const fetchMock = vi.fn();
  const onClose = vi.fn();
  const jobId = "job-123";
  const customerName = "Jean Martin";
  const customerPhone = "+15551234567";
  let originalLocation: Location;

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("alert", vi.fn());
    originalLocation = window.location;
    delete (window as unknown as { location?: Location }).location;
    (window as unknown as { location: { href: string } }).location = { href: "" };
  });

  afterEach(() => {
    fetchMock.mockReset();
    onClose.mockReset();
    vi.unstubAllGlobals();
    delete (window as unknown as { location?: Location }).location;
    (window as unknown as { location: Location }).location = originalLocation;
  });

  it("handles call flow and shows waiting state", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(
      <NoShowDialog
        isOpen
        onClose={onClose}
        jobId={jobId}
        customerName={customerName}
        customerPhone={customerPhone}
      />
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "📞 CALL CUSTOMER" }));

    expect(await screen.findByText("Waiting for Response...")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/jobs/${jobId}/no-show`,
      expect.objectContaining({ method: "POST" })
    );
    expect(window.location.href).toBe(`tel:${customerPhone}`);
  });

  it("sends SMS and notifies the user", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(
      <NoShowDialog
        isOpen
        onClose={onClose}
        jobId={jobId}
        customerName={customerName}
        customerPhone={customerPhone}
      />
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "📱 SMS CUSTOMER" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(window.alert).toHaveBeenCalledWith("SMS sent to customer");
  });

  it("marks job as no-show and closes on success", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(
      <NoShowDialog
        isOpen
        onClose={onClose}
        jobId={jobId}
        customerName={customerName}
        customerPhone={customerPhone}
      />
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "📞 CALL CUSTOMER" }));
    await screen.findByText("Waiting for Response...");
    await user.click(screen.getByRole("button", { name: "SKIP TO NEXT JOB" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(window.alert).toHaveBeenCalledWith(
      "Job marked as no-show. Customer and manager notified."
    );
  });

  it("shows an alert when marking no-show fails", async () => {
    let resolveSkip: (value: { ok: boolean; json: () => Promise<unknown> }) => void = () => undefined;
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSkip = resolve;
        })
      );

    render(
      <NoShowDialog
        isOpen
        onClose={onClose}
        jobId={jobId}
        customerName={customerName}
        customerPhone={customerPhone}
      />
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "📞 CALL CUSTOMER" }));
    await screen.findByText("Waiting for Response...");
    await user.click(screen.getByRole("button", { name: "SKIP TO NEXT JOB" }));

    expect(screen.getByRole("button", { name: "Processing..." })).toBeInTheDocument();

    resolveSkip({ ok: false, json: async () => ({}) });
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Failed to mark as no-show"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
