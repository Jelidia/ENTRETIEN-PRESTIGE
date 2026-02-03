type EnvCheck = {
  key: string;
  required: boolean;
};

const validatedEnvKeys: EnvCheck[] = [
  { key: "APP_ENCRYPTION_KEY", required: true },
  { key: "NEXT_PUBLIC_SUPABASE_URL", required: true },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true },
  { key: "SUPABASE_SERVICE_ROLE_KEY", required: true },
  { key: "NEXT_PUBLIC_BASE_URL", required: true },
  { key: "STRIPE_SECRET_KEY", required: false },
  { key: "STRIPE_WEBHOOK_SECRET", required: false },
  { key: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", required: false },
  { key: "NEXT_PUBLIC_COMPANY_EMAIL", required: false },
];

type EncryptionKeyValidation = {
  key: Buffer | null;
  error?: string;
};

const encryptionKeyLength = 32;

export function getEnv(key: string, fallback = "") {
  const value = process.env[key];
  return value ?? fallback;
}

export function validateEncryptionKey(
  rawKey = process.env.APP_ENCRYPTION_KEY
): EncryptionKeyValidation {
  if (!rawKey) {
    return { key: null, error: "missing" };
  }

  const trimmed = rawKey.trim();
  if (!trimmed) {
    return { key: null, error: "missing" };
  }

  const decoded = Buffer.from(trimmed, "base64");
  if (decoded.length !== encryptionKeyLength) {
    return { key: null, error: "invalid_length" };
  }

  return { key: decoded };
}

export function getEncryptionKey() {
  return validateEncryptionKey().key;
}

export function validateEnv() {
  if (typeof window !== "undefined") {
    return { missing: [] as string[] };
  }

  const missing = validatedEnvKeys
    .filter((entry) => !process.env[entry.key])
    .map((entry) => entry.key);

  const missingRequired = isProd()
    ? validatedEnvKeys
        .filter((entry) => entry.required && !process.env[entry.key])
        .map((entry) => entry.key)
    : [];

  if (missingRequired.length) {
    throw new Error(`Missing required env vars: ${missingRequired.join(", ")}`);
  }

  if (missing.length && process.env.NODE_ENV !== "test") {
    logger.warn("Missing env vars", { missing });
  }

  const encryptionValidation = validateEncryptionKey();
  if (!encryptionValidation.key) {
    const reason = encryptionValidation.error ?? "missing";
    if (isProd()) {
      throw new Error(
        "APP_ENCRYPTION_KEY is required in production and must be base64-encoded 32 bytes."
      );
    }
    if (process.env.NODE_ENV !== "test") {
      logger.warn("APP_ENCRYPTION_KEY missing or invalid; encryption disabled", { reason });
    }
  }

  return { missing };
}

validateEnv();

export function getBaseUrl() {
  return getEnv("NEXT_PUBLIC_BASE_URL", "http://localhost:3000");
}

export function isProd() {
  return process.env.NODE_ENV === "production";
}
import { logger } from "@/lib/logger";
