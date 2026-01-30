import { authenticator } from "otplib";
import type { Session } from "@supabase/supabase-js";
import { encryptPayload, decryptPayload, hashCode } from "./crypto";
import { createAdminClient } from "./supabaseServer";
import { sendSms } from "./twilio";

type ChallengePayload = {
  challenge_id: string;
  user_id: string;
  method: "sms" | "authenticator";
  code_hash: string;
  session_payload: string;
  expires_at: string;
};

const MAX_CHALLENGE_ATTEMPTS = 5;

export function generateAuthenticatorSecret(label: string) {
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(label, "Entretien Prestige", secret);
  return { secret: encryptPayload(secret), otpauth };
}

export async function createChallenge(
  admin: ReturnType<typeof createAdminClient>,
  {
    userId,
    method,
    session,
  }: {
    userId: string;
    method: "sms" | "authenticator";
    session: Session;
  }
) {
  const code = method === "sms" ? String(Math.floor(100000 + Math.random() * 900000)) : "";
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const payload = encryptPayload(JSON.stringify(session));

  const { data, error } = await admin
    .from("auth_challenges")
    .insert({
      user_id: userId,
      method,
      code_hash: hashCode(code),
      session_payload: payload,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error("Unable to create challenge");
  }

  if (method === "sms") {
    const { data: profile } = await admin
      .from("users")
      .select("phone")
      .eq("user_id", userId)
      .single();
    if (profile?.phone) {
      await sendSms(profile.phone, `Your verification code is ${code}`);
    }
  }

  return data as ChallengePayload;
}

export async function sendTwoFactorCode(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  challenge: ChallengePayload
) {
  if (challenge.method === "authenticator") {
    return;
  }
  const { data: profile } = await admin
    .from("users")
    .select("phone")
    .eq("user_id", userId)
    .single();
  if (profile?.phone) {
    await sendSms(profile.phone, "Your login verification code was sent.");
  }
}

export async function consumeChallenge(
  admin: ReturnType<typeof createAdminClient>,
  challengeId: string,
  code: string
) {
  const { data, error } = await admin
    .from("auth_challenges")
    .select("*")
    .eq("challenge_id", challengeId)
    .single();

  if (error || !data) {
    return null;
  }

  if (data.consumed_at) {
    return null;
  }

  const expired = new Date(data.expires_at).getTime() < Date.now();
  if (expired) {
    return null;
  }

  const attempts = data.attempt_count ?? 0;
  if (attempts >= MAX_CHALLENGE_ATTEMPTS) {
    return null;
  }

  const recordFailedAttempt = async () => {
    const nextAttempts = attempts + 1;
    await admin
      .from("auth_challenges")
      .update({
        attempt_count: nextAttempts,
        consumed_at: nextAttempts >= MAX_CHALLENGE_ATTEMPTS ? new Date().toISOString() : null,
      })
      .eq("challenge_id", challengeId);
  };

  if (data.method === "authenticator") {
    const { data: profile } = await admin
      .from("users")
      .select("two_factor_secret")
      .eq("user_id", data.user_id)
      .single();
    const secret = profile?.two_factor_secret ? decryptPayload(profile.two_factor_secret) : "";
    if (!secret || !authenticator.check(code, secret)) {
      await recordFailedAttempt();
      return null;
    }
  } else if (data.code_hash !== hashCode(code)) {
    await recordFailedAttempt();
    return null;
  }

  const { data: consumed } = await admin
    .from("auth_challenges")
    .update({ consumed_at: new Date().toISOString() })
    .eq("challenge_id", challengeId)
    .is("consumed_at", null)
    .select("challenge_id")
    .maybeSingle();

  if (!consumed) {
    return null;
  }

  const sessionRaw = decryptPayload(data.session_payload ?? "");
  if (!sessionRaw) {
    return null;
  }

  return JSON.parse(sessionRaw) as Session;
}
