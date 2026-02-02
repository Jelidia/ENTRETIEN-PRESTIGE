import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };
const mutableEnv = process.env as Record<string, string | undefined>;

const restoreEnv = () => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }
  Object.assign(process.env, originalEnv);
};

describe("crypto", () => {
  beforeEach(() => {
    restoreEnv();
    vi.resetModules();
  });

  afterEach(() => {
    restoreEnv();
    vi.resetModules();
  });

  it("encrypts and decrypts with a valid key", async () => {
    mutableEnv.NODE_ENV = "test";
    mutableEnv.APP_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

    const { encryptPayload, decryptPayload } = await import("@/lib/crypto");
    const encrypted = encryptPayload("hello");

    expect(encrypted).not.toBe("hello");
    expect(decryptPayload(encrypted)).toBe("hello");
  });

  it("returns plaintext when key is missing outside production", async () => {
    mutableEnv.NODE_ENV = "test";
    delete mutableEnv.APP_ENCRYPTION_KEY;

    const { encryptPayload, decryptPayload } = await import("@/lib/crypto");

    expect(encryptPayload("hello")).toBe("hello");
    expect(decryptPayload("hello")).toBe("hello");
  });

  it("throws when key is missing in production", async () => {
    mutableEnv.NODE_ENV = "production";
    delete mutableEnv.APP_ENCRYPTION_KEY;

    await expect(import("@/lib/crypto")).rejects.toThrow(/APP_ENCRYPTION_KEY/);
  });

  it("throws when key length is invalid in production", async () => {
    mutableEnv.NODE_ENV = "production";
    mutableEnv.APP_ENCRYPTION_KEY = Buffer.alloc(16, 1).toString("base64");

    await expect(import("@/lib/crypto")).rejects.toThrow(/APP_ENCRYPTION_KEY/);
  });
});
