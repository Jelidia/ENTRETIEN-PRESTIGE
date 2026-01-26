import { Resend } from "resend";
import { getEnv } from "./env";

const resendApiKey = getEnv("RESEND_API_KEY");
const resendFrom = getEnv("RESEND_FROM_EMAIL", "no-reply@entretienprestige.com");

export async function sendEmail(to: string, subject: string, html: string) {
  if (!resendApiKey) {
    // TODO: Paste Resend API key in .env.local when ready.
    return;
  }
  const resend = new Resend(resendApiKey);
  await resend.emails.send({ from: resendFrom, to, subject, html });
}

export async function sendInvoiceEmail(to: string, subject: string, body: string) {
  await sendEmail(to, subject, `<p>${body}</p>`);
}
