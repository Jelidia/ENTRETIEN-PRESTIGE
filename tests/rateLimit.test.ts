import { describe, expect, it, vi } from "vitest";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";

describe("rateLimit", () => {
  it("allows requests within the limit", () => {
    const first = rateLimit("key:limit", 2, 1000);
    const second = rateLimit("key:limit", 2, 1000);
    const third = rateLimit("key:limit", 2, 1000);

    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(1);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);
    expect(third.allowed).toBe(false);
  });

  it("resets after the window expires", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));

    const first = rateLimit("key:reset", 1, 1000);
    expect(first.allowed).toBe(true);

    vi.setSystemTime(new Date("2025-01-01T00:00:02Z"));
    const second = rateLimit("key:reset", 1, 1000);
    expect(second.allowed).toBe(true);

    vi.useRealTimers();
  });
});

describe("getRequestIp", () => {
  it("returns the forwarded IP when available", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
    });
    expect(getRequestIp(request)).toBe("203.0.113.10");
  });

  it("falls back to unknown when missing", () => {
    const request = new Request("https://example.com");
    expect(getRequestIp(request)).toBe("unknown");
  });
});
