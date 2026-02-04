import { createHmac, timingSafeEqual } from "crypto";
import { getEnv, isProd } from "./env";

const accountSid = getEnv("TWILIO_ACCOUNT_SID");
const authToken = getEnv("TWILIO_AUTH_TOKEN");
const fromNumber = getEnv("TWILIO_FROM_NUMBER");
const smsFlag = getEnv("FEATURE_SMS").toLowerCase();
const smsEnabled = smsFlag ? smsFlag === "true" : isProd();

export function isSmsConfigured() {
  return Boolean(accountSid && authToken && fromNumber);
}

export function isSmsEnabled() {
  return smsEnabled;
}

function assertSmsReady() {
  if (!smsEnabled) {
    throw new Error("SMS is disabled");
  }
  const missing: string[] = [];
  if (!accountSid) {
    missing.push("TWILIO_ACCOUNT_SID");
  }
  if (!authToken) {
    missing.push("TWILIO_AUTH_TOKEN");
  }
  if (!fromNumber) {
    missing.push("TWILIO_FROM_NUMBER");
  }
  if (missing.length) {
    throw new Error(`Twilio is not configured (${missing.join(", ")})`);
  }
}

type TwilioSignatureOptions = {
  signature: string | null;
  url: string;
  params: Record<string, string>;
  authToken?: string;
};

export function verifyTwilioSignature({
  signature,
  url,
  params,
  authToken: authTokenOverride,
}: TwilioSignatureOptions) {
  const token = authTokenOverride ?? authToken;
  if (!signature || !token) {
    return false;
  }

  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  const expected = createHmac("sha1", token).update(data).digest("base64");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(signatureBuffer, expectedBuffer);
}

export async function sendSms(to: string, body: string) {
  assertSmsReady();

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: fromNumber, To: to, Body: body }).toString(),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    const suffix = details ? `: ${details}` : "";
    throw new Error(`Twilio SMS failed (${response.status})${suffix}`);
  }
}
