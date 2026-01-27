// SMS Templates for Entretien Prestige (French - Quebec)

export type SMSTemplate = {
  key: string;
  getMessage: (data: any) => string;
};

export const smsTemplates = {
  // Job scheduled confirmation
  jobScheduled: (data: { customerName: string; date: string; time: string; address: string }) =>
    `Bonjour ${data.customerName}! Votre rendez-vous est confirmé pour le ${data.date} à ${data.time}. Adresse: ${data.address}. Merci!`,

  // 24 hour reminder
  reminder24h: (data: { time: string; date: string }) =>
    `Rappel: Votre nettoyage est demain à ${data.time}. Nous avons hâte de vous servir!`,

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

export function formatPhoneNumber(phone: string): string {
  // Ensure E.164 format: +1XXXXXXXXXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  if (phone.startsWith('+')) {
    return phone;
  }
  return `+${cleaned}`;
}
