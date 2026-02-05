// SMS Templates — Field Service Management Platform (French - Quebec defaults)
// Per-company templates are loaded from the sms_templates table.
// The hardcoded templates below serve as fallback defaults only.

import { createAdminClient } from "./supabaseServer";

export type SMSTemplate = {
  key: string;
  getMessage: (data: Record<string, unknown>) => string;
};

export const smsTemplates = {
  // Job scheduled confirmation
  jobScheduled: (data: { customerName: string; date: string; time: string; address: string }) =>
    `Bonjour ${data.customerName}! Votre rendez-vous est confirmé pour le ${data.date} à ${data.time}. Adresse: ${data.address}. Merci!`,

  // 24 hour reminder
  reminder24h: (data: { time: string; date: string }) =>
    `Rappel: Votre rendez-vous est demain à ${data.time}. Nous avons hâte de vous servir!`,

  // 1 hour reminder
  reminder1h: (data: { time: string }) =>
    `Votre technicien arrive dans 1 heure (${data.time}). Préparez l'accès SVP. Merci!`,

  // Job completed - Interac payment
  jobCompletedInterac: (data: { invoiceNumber: string; amount: string; email: string }) =>
    `Service terminé! Facture #${data.invoiceNumber} (${data.amount}) envoyée par email. Payez par Interac: ${data.email}`,

  // Job completed - Stripe payment
  jobCompletedStripe: (data: { invoiceNumber: string; amount: string; paymentLink: string }) =>
    `Service terminé! Facture #${data.invoiceNumber} (${data.amount}). Payez ici: ${data.paymentLink}`,

  // Job completed - Cash (already paid)
  jobCompletedCash: () =>
    `Service terminé! Merci pour votre paiement. À bientôt!`,

  // No-show notification to customer
  noShow: () =>
    `Désolé, vous n'étiez pas disponible. Veuillez nous texter pour reprogrammer.`,

  // Running late notification to customer
  runningLate: (data: { customerName: string }) =>
    `Bonjour ${data.customerName}, nous sommes en retard et arriverons sous peu. Merci pour votre patience.`,

  // Late payment reminder (3 days)
  latePayment3Days: (data: { invoiceNumber: string; amount: string }) =>
    `Rappel: Votre facture #${data.invoiceNumber} de ${data.amount} est en retard. Veuillez payer dès que possible. Merci!`,

  // Late payment reminder (7 days)
  latePayment7Days: (data: { invoiceNumber: string; amount: string }) =>
    `URGENT: Votre facture #${data.invoiceNumber} de ${data.amount} est en retard depuis 7 jours. Veuillez payer immédiatement.`,

  // Late payment reminder (14 days)
  latePayment14Days: (data: { invoiceNumber: string; amount: string }) =>
    `DERNIER RAPPEL: Votre facture #${data.invoiceNumber} de ${data.amount} est en retard depuis 14 jours. Contactez-nous.`,

  // Sunday night availability reminder (for technicians/sales reps)
  availabilityReminder: (data: { name: string }) =>
    `Bonjour ${data.name}, veuillez mettre à jour votre disponibilité pour la semaine prochaine. Merci!`,

  // Rating request after job completion
  ratingRequest: (data: { customerName: string; ratingLink: string }) =>
    `Bonjour ${data.customerName}, comment était votre service? Cliquez ici pour noter: ${data.ratingLink}`,
};

// Map from DB template_key to the smsTemplates function key
const TEMPLATE_KEY_MAP: Record<string, keyof typeof smsTemplates> = {
  job_scheduled: "jobScheduled",
  reminder_24h: "reminder24h",
  reminder_1h: "reminder1h",
  job_completed_interac: "jobCompletedInterac",
  job_completed_stripe: "jobCompletedStripe",
  job_completed_cash: "jobCompletedCash",
  no_show: "noShow",
  running_late: "runningLate",
  late_payment_3d: "latePayment3Days",
  late_payment_7d: "latePayment7Days",
  late_payment_14d: "latePayment14Days",
  availability_reminder: "availabilityReminder",
  rating_request: "ratingRequest",
};

/**
 * Interpolate {{variable}} placeholders in a template body.
 */
export function interpolateTemplate(body: string, data: Record<string, unknown>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = data[key];
    return value != null ? String(value) : "";
  });
}

type CompanyTemplates = Record<string, string>; // template_key → body

/**
 * Load custom SMS templates for a company from the database.
 * Returns a map of template_key → body text (with {{variable}} placeholders).
 */
export async function loadCompanyTemplates(companyId: string): Promise<CompanyTemplates> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("sms_templates")
    .select("template_key, body")
    .eq("company_id", companyId)
    .eq("is_active", true);

  const templates: CompanyTemplates = {};
  if (data) {
    for (const row of data) {
      templates[row.template_key] = row.body;
    }
  }
  return templates;
}

/**
 * Get a rendered SMS message for a given template key.
 * If the company has a custom template in the DB, it's used with interpolation.
 * Otherwise, falls back to the hardcoded default template function.
 */
export function renderSmsTemplate(
  templateKey: string,
  data: Record<string, unknown>,
  companyTemplates?: CompanyTemplates,
): string | null {
  // Check for company-specific DB template first
  if (companyTemplates && companyTemplates[templateKey]) {
    return interpolateTemplate(companyTemplates[templateKey], data);
  }

  // Fall back to hardcoded default
  const fnKey = TEMPLATE_KEY_MAP[templateKey];
  if (fnKey && typeof smsTemplates[fnKey] === "function") {
    return (smsTemplates[fnKey] as (d: Record<string, unknown>) => string)(data);
  }

  return null;
}

export function applySmsPrefix(message: string, prefix?: string | null): string {
  const trimmed = message.trim();
  if (!prefix) return trimmed;
  const safePrefix = prefix.trim();
  if (!safePrefix) return trimmed;
  const tag = `[${safePrefix}]`;
  if (trimmed.startsWith(`${tag} `) || trimmed.startsWith(tag)) {
    return trimmed;
  }
  return `${tag} ${trimmed}`;
}

export function normalizePhoneE164(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (hasPlus) {
    if (digits.length < 10 || digits.length > 15) return null;
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  return null;
}

export function formatPhoneNumber(phone: string): string {
  return normalizePhoneE164(phone) ?? "";
}
