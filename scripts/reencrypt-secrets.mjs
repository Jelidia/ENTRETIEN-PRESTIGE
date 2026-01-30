import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const encryptionKeyRaw = process.env.APP_ENCRYPTION_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

if (!encryptionKeyRaw) {
  console.error("Missing APP_ENCRYPTION_KEY.");
  process.exit(1);
}

const encryptionKey = Buffer.from(encryptionKeyRaw.trim(), "base64");
if (encryptionKey.length !== 32) {
  console.error("APP_ENCRYPTION_KEY must be base64-encoded 32 bytes.");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function encryptPayload(payload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

function looksEncrypted(payload) {
  if (!payload) {
    return false;
  }
  const parts = payload.split(":");
  if (parts.length !== 3) {
    return false;
  }
  return parts.every((part) => /^[A-Za-z0-9+/=]+$/.test(part));
}

async function reencryptUsers() {
  let updated = 0;
  let offset = 0;
  const pageSize = 500;

  while (true) {
    const { data, error } = await admin
      .from("users")
      .select("user_id, two_factor_secret")
      .not("two_factor_secret", "is", null)
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    for (const row of data) {
      const secret = row.two_factor_secret;
      if (!secret || looksEncrypted(secret)) {
        continue;
      }
      const encrypted = encryptPayload(secret);
      const { error: updateError } = await admin
        .from("users")
        .update({ two_factor_secret: encrypted })
        .eq("user_id", row.user_id);

      if (updateError) {
        throw new Error(`Failed to update user ${row.user_id}: ${updateError.message}`);
      }
      updated += 1;
    }

    offset += pageSize;
  }

  return updated;
}

async function reencryptChallenges() {
  let updated = 0;
  let offset = 0;
  const pageSize = 500;

  while (true) {
    const { data, error } = await admin
      .from("auth_challenges")
      .select("challenge_id, session_payload")
      .not("session_payload", "is", null)
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch challenges: ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    for (const row of data) {
      const payload = row.session_payload;
      if (!payload || looksEncrypted(payload)) {
        continue;
      }
      const encrypted = encryptPayload(payload);
      const { error: updateError } = await admin
        .from("auth_challenges")
        .update({ session_payload: encrypted })
        .eq("challenge_id", row.challenge_id);

      if (updateError) {
        throw new Error(
          `Failed to update challenge ${row.challenge_id}: ${updateError.message}`
        );
      }
      updated += 1;
    }

    offset += pageSize;
  }

  return updated;
}

async function main() {
  const usersUpdated = await reencryptUsers();
  const challengesUpdated = await reencryptChallenges();
  console.log(
    JSON.stringify({ usersUpdated, challengesUpdated, status: "complete" }, null, 2)
  );
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
