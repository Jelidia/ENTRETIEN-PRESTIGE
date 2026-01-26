export function getEnv(key: string, fallback = "") {
  const value = process.env[key];
  return value ?? fallback;
}

export function getBaseUrl() {
  return getEnv("NEXT_PUBLIC_BASE_URL", "http://localhost:3000");
}

export function isProd() {
  return process.env.NODE_ENV === "production";
}
