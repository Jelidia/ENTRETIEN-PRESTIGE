import { Resend } from "resend";
import { getEnv, isProd } from "./env";

const resendApiKey = getEnv("RESEND_API_KEY");
const resendFrom = getEnv("RESEND_FROM_EMAIL", "no-reply@example.com");
const emailFlag = getEnv("FEATURE_EMAIL").toLowerCase();
const emailEnabled = emailFlag ? emailFlag === "true" : isProd();

type ResendSendResult = {
  data?: { id?: string } | null;
  error?: { message?: string } | null;
};

type EmailSendResult = {
  id: string | null;
};

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

function parseResendResult(result: unknown) {
  if (!result || typeof result !== "object") {
    return { id: null, errorMessage: null };
  }
  const data = "data" in result ? (result as { data?: unknown }).data : undefined;
  const error = "error" in result ? (result as { error?: unknown }).error : undefined;

  let id: string | null = null;
  if (data && typeof data === "object") {
    const possibleId = (data as { id?: unknown }).id;
    if (typeof possibleId === "string") {
      id = possibleId;
    }
  }

  let errorMessage: string | null = null;
  if (error && typeof error === "object") {
    const possibleMessage = (error as { message?: unknown }).message;
    if (typeof possibleMessage === "string" && possibleMessage) {
      errorMessage = possibleMessage;
    }
  }

  return { id, errorMessage };
}

export async function sendEmail(to: string, subject: string, html: string): Promise<EmailSendResult> {
  assertEmailReady();
  const resend = new Resend(resendApiKey);
  const result = (await resend.emails.send({ from: resendFrom, to, subject, html })) as ResendSendResult;
  const { id, errorMessage } = parseResendResult(result);
  if (errorMessage) {
    throw new Error(errorMessage);
  }
  return { id };
}

export async function sendInvoiceEmail(
  to: string,
  subject: string,
  body: string
): Promise<EmailSendResult> {
  return sendEmail(to, subject, `<p>${body}</p>`);
}
