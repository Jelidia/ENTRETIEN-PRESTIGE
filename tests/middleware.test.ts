import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import { middleware } from "@/middleware";

function createRequest(
  url: string,
  options?: { method?: string; headers?: Record<string, string>; cookies?: Record<string, string> }
) {
  const headers = new Headers(options?.headers ?? {});
  const cookieEntries = Object.entries(options?.cookies ?? {});
  if (cookieEntries.length) {
    headers.set(
      "cookie",
      cookieEntries.map(([key, value]) => `${key}=${value}`).join("; ")
    );
  }

  const request = new Request(url, { method: options?.method ?? "GET", headers });
  const nextUrl = new URL(url);
  const nextUrlWithClone = Object.assign(nextUrl, {
    clone() {
      return new URL(nextUrl.toString());
    },
  });
  const cookieMap = new Map(cookieEntries);

  return {
    ...request,
    headers: request.headers,
    nextUrl: nextUrlWithClone,
    cookies: {
      get: (name: string) => {
        const value = cookieMap.get(name);
        return value ? { value } : undefined;
      },
    },
    method: options?.method ?? "GET",
  } as unknown as NextRequest;
}

describe("middleware", () => {
  it("adds rate limit headers for API calls", () => {
    const request = createRequest("https://example.com/api/jobs", {
      headers: { "x-forwarded-for": "203.0.113.10" },
    });
    const response = middleware(request);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("300");
    expect(response.headers.get("X-RateLimit-Remaining")).toBeDefined();
  });

  it("blocks API calls after the limit", () => {
    const request = createRequest("https://example.com/api/auth/login", {
      headers: { "x-forwarded-for": "203.0.113.11" },
      method: "POST",
    });
    let response: Response | null = null;
    for (let i = 0; i < 21; i += 1) {
      response = middleware(request);
    }
    expect(response?.status).toBe(429);
  });

  it("redirects unauthenticated protected paths", () => {
    const request = createRequest("https://example.com/dashboard");
    const response = middleware(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("allows protected paths with access token", () => {
    const request = createRequest("https://example.com/dashboard", {
      cookies: { ep_access_token: "token" },
    });
    const response = middleware(request);
    expect(response.status).toBe(200);
  });

  it("passes through public paths", () => {
    const request = createRequest("https://example.com/login");
    const response = middleware(request);
    expect(response.status).toBe(200);
  });
});
