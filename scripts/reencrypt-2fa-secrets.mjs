import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "APP_ENCRYPTION_KEY",
];

const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const rawKey = String(process.env.APP_ENCRYPTION_KEY || "").trim();
const decodedKey = Buffer.from(rawKey, "base64");
if (!rawKey || decodedKey.length !== 32) {
  console.error("APP_ENCRYPTION_KEY must be base64-encoded 32 bytes.");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const dryRun = process.argv.includes("--dry-run");

const pageSize = 500;
let from = 0;
let scanned = 0;
let updated = 0;
let skipped = 0;

const normalizeBase64 = (value) => value.replace(/=+$/u, "");

const isEncryptedPayload = (value) => {
  if (typeof value !== "string") {
    return false;
  }
  const parts = value.split(":");
  if (parts.length !== 3) {
    return false;
  }
  const [ivPart, tagPart, dataPart] = parts;
  const iv = Buffer.from(ivPart, "base64");
  const tag = Buffer.from(tagPart, "base64");
  const data = Buffer.from(dataPart, "base64");
  if (
    normalizeBase64(iv.toString("base64")) !== normalizeBase64(ivPart) ||
    normalizeBase64(tag.toString("base64")) !== normalizeBase64(tagPart) ||
    normalizeBase64(data.toString("base64")) !== normalizeBase64(dataPart)
  ) {
    return false;
  }
  return iv.length === 12 && tag.length === 16 && data.length > 0;
};

const encryptPayload = (payload) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", decodedKey, iv);
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
};

while (true) {
  const { data, error } = await supabase
    .from("users")
    .select("user_id, two_factor_secret")
    .not("two_factor_secret", "is", null)
    .range(from, from + pageSize - 1);

  if (error) {
    console.error("Failed to fetch users", error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    break;
  }

  for (const row of data) {
    scanned += 1;
    const secret = row.two_factor_secret;
    if (!secret || isEncryptedPayload(secret)) {
      skipped += 1;
      continue;
    }

    const encrypted = encryptPayload(secret);
    if (dryRun) {
      updated += 1;
      continue;
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ two_factor_secret: encrypted })
      .eq("user_id", row.user_id);

    if (updateError) {
      console.error(`Failed to update user ${row.user_id}`, updateError);
      process.exit(1);
    }

    updated += 1;
  }

  if (data.length < pageSize) {
    break;
  }

  from += pageSize;
}

const mode = dryRun ? "DRY RUN" : "APPLIED";
console.log(`${mode}: scanned=${scanned} updated=${updated} skipped=${skipped}`);
