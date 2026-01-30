import { describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import type { Session } from "@supabase/supabase-js";
import {
  clearSessionCookies,
  getAccessTokenFromCookies,
  getAccessTokenFromRequest,
  getRefreshTokenFromRequest,
  setSessionCookies,
} from "@/lib/session";

const { cookieValue } = vi.hoisted(() => ({
  cookieValue: { value: "cookie-token" as string | undefined },
}));

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (key: string) => {
      if (key === "ep_access_token" && cookieValue.value) {
        return { value: cookieValue.value };
      }
      return undefined;
    },
  }),
}));

describe("session helpers", () => {
  it("sets and clears session cookies", () => {
    const response = NextResponse.json({ ok: true });
    const session = {
      access_token: "access",
      refresh_token: "refresh",
      expires_at: 123,
    } as Session;

    setSessionCookies(response, session);

    expect(response.cookies.get("ep_access_token")?.value).toBe("access");
    expect(response.cookies.get("ep_refresh_token")?.value).toBe("refresh");
    expect(response.cookies.get("ep_expires_at")?.value).toBe("123");

    clearSessionCookies(response);

    expect(response.cookies.get("ep_access_token")?.value).toBe("");
    expect(response.cookies.get("ep_refresh_token")?.value).toBe("");
    expect(response.cookies.get("ep_expires_at")?.value).toBe("");
  });

  it("handles missing expiry when setting cookies", () => {
    const response = NextResponse.json({ ok: true });
    const session = {
      access_token: "access",
      refresh_token: "refresh",
    } as Session;

    setSessionCookies(response, session);

    expect(response.cookies.get("ep_expires_at")?.value).toBe("");
  });

  it("reads access and refresh tokens from requests", () => {
    const request = new Request("https://example.com", {
      headers: {
        cookie: "ep_access_token=token123; ep_refresh_token=refresh123",
      },
    });

    expect(getAccessTokenFromRequest(request)).toBe("token123");
    expect(getRefreshTokenFromRequest(request)).toBe("refresh123");
  });

  it("returns null when access token cookie is missing", () => {
    const request = new Request("https://example.com");

    expect(getAccessTokenFromRequest(request)).toBeNull();
    expect(getRefreshTokenFromRequest(request)).toBeNull();
  });

  it("returns null when cookies header lacks tokens", () => {
    const request = new Request("https://example.com", {
      headers: { cookie: "foo=bar" },
    });

    expect(getAccessTokenFromRequest(request)).toBeNull();
    expect(getRefreshTokenFromRequest(request)).toBeNull();
  });

  it("reads access token from cookies store", () => {
    expect(getAccessTokenFromCookies()).toBe("cookie-token");
  });

  it("returns null when cookie store is empty", () => {
    cookieValue.value = undefined;
    expect(getAccessTokenFromCookies()).toBeNull();
    cookieValue.value = "cookie-token";
  });
});
