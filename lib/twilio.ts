import { getEnv } from "./env";

const accountSid = getEnv("TWILIO_ACCOUNT_SID");
const authToken = getEnv("TWILIO_AUTH_TOKEN");
const fromNumber = getEnv("TWILIO_FROM_NUMBER");

export function isSmsConfigured() {
  return Boolean(accountSid && authToken && fromNumber);
}

export async function sendSms(to: string, body: string) {
  if (!accountSid || !authToken || !fromNumber) {
    // TODO: Paste Twilio credentials in .env.local when ready.
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: fromNumber, To: to, Body: body }).toString(),
  });
}
