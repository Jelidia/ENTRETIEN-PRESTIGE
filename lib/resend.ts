import { Resend } from "resend";
import { getEnv, isProd } from "./env";

const resendApiKey = getEnv("RESEND_API_KEY");
const resendFrom = getEnv("RESEND_FROM_EMAIL", "no-reply@entretienprestige.com");
const emailFlag = getEnv("FEATURE_EMAIL").toLowerCase();
const emailEnabled = emailFlag ? emailFlag === "true" : isProd();

export function isEmailEnabled() {
  return emailEnabled;
}

function assertEmailReady() {
  if (!emailEnabled) {
    throw new Error("Email is disabled");
  }
  if (!resendApiKey) {
    throw new Error("Resend is not configured (RESEND_API_KEY)");
  }
}

export async function sendEmail(to: string, subject: string, html: string) {
  assertEmailReady();
  const resend = new Resend(resendApiKey);
  await resend.emails.send({ from: resendFrom, to, subject, html });
}

export async function sendInvoiceEmail(to: string, subject: string, body: string) {
  await sendEmail(to, subject, `<p>${body}</p>`);
}
