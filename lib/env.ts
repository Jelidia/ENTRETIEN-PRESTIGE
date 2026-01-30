type EnvCheck = {
  key: string;
  required: boolean;
};

const validatedEnvKeys: EnvCheck[] = [
  { key: "STRIPE_SECRET_KEY", required: false },
  { key: "SUPABASE_URL", required: false },
  { key: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", required: false },
  { key: "NEXT_PUBLIC_COMPANY_EMAIL", required: false },
];

export function getEnv(key: string, fallback = "") {
  const value = process.env[key];
  return value ?? fallback;
}

export function validateEnv() {
  if (typeof window !== "undefined") {
    return { missing: [] as string[] };
  }

  const missing = validatedEnvKeys
    .filter((entry) => !process.env[entry.key])
    .map((entry) => entry.key);

  if (missing.length && process.env.NODE_ENV !== "test") {
    console.warn(`[env] Missing env vars: ${missing.join(", ")}`);
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
