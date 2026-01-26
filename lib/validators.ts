import { z } from "zod";

export const registerSchema = z.object({
  companyName: z.string().min(2),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7).optional(),
  password: z.string().min(16),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(16),
});

export const verify2faSchema = z.object({
  challengeId: z.string().min(6),
  code: z.string().min(4),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  code: z.string().min(6),
  password: z.string().min(16),
});

export const changePasswordSchema = z.object({
  password: z.string().min(16),
});

export const jobCreateSchema = z.object({
  customerId: z.string().min(1),
  serviceType: z.string().min(2),
  servicePackage: z.string().min(2),
  scheduledDate: z.string().min(6),
  scheduledStartTime: z.string().optional(),
  scheduledEndTime: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  estimatedRevenue: z.string().optional(),
  description: z.string().optional(),
});

export const jobUpdateSchema = z.object({
  status: z.string().optional(),
  technician_id: z.string().optional(),
  notes: z.string().optional(),
  actual_revenue: z.number().optional(),
});

export const jobAssignSchema = z.object({
  technicianId: z.string().min(1),
});

export const jobCheckInSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracyMeters: z.number().optional(),
});

export const jobCheckOutSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracyMeters: z.number().optional(),
});

export const jobUpsellSchema = z.object({
  upsells: z.array(z.record(z.any())),
  actualRevenue: z.number(),
});

export const dispatchReassignSchema = z.object({
  jobId: z.string().min(1),
  technicianId: z.string().min(1),
});

export const weatherCancelSchema = z.object({
  startDate: z.string().min(6),
  endDate: z.string().min(6),
});

export const customerCreateSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().min(7).optional(),
  type: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
});

export const customerUpdateSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.string().optional(),
  customer_type: z.string().optional(),
  address: z.string().optional(),
});

export const blacklistSchema = z.object({
  companyId: z.string().min(1).optional(),
  reason: z.string(),
  description: z.string().optional(),
  riskLevel: z.string().optional(),
  recommendedAction: z.string().optional(),
  addedBy: z.string().optional(),
});

export const complaintSchema = z.object({
  companyId: z.string().min(1).optional(),
  jobId: z.string().min(1),
  complaintType: z.string(),
  description: z.string(),
  severity: z.string().optional(),
  reportedBy: z.string().optional(),
});

export const invoiceCreateSchema = z.object({
  customerId: z.string().min(1),
  invoiceNumber: z.string().min(2),
  dueDate: z.string().min(6),
  totalAmount: z.string().min(1),
  status: z.string().optional(),
});

export const invoiceUpdateSchema = z.object({
  payment_status: z.string().optional(),
  total_amount: z.number().optional(),
  due_date: z.string().optional(),
});

export const invoiceSendSchema = z.object({
  to: z.string().min(3),
  subject: z.string().min(2),
  body: z.string().min(1),
  channel: z.enum(["email", "sms"]),
});

export const invoicePaymentSchema = z.object({
  status: z.string(),
  paidAmount: z.number(),
});

export const paymentInitSchema = z.object({
  amount: z.number().min(1),
  currency: z.string().min(3).default("cad"),
  invoiceId: z.string().min(1),
});

export const paymentRefundSchema = z.object({
  paymentIntentId: z.string().min(1),
  amount: z.number().optional(),
});

export const smsSendSchema = z.object({
  to: z.string().min(7),
  message: z.string().min(1),
});

export const emailSendSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(2),
  html: z.string().min(2),
});

export const gpsCheckinSchema = z.object({
  jobId: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  accuracyMeters: z.number().optional(),
});

export const gpsPingSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracyMeters: z.number().optional(),
});

export const notificationSettingsSchema = z.object({
  jobAlerts: z.boolean(),
  invoiceReminders: z.boolean(),
  qualityIncidents: z.boolean(),
  channel: z.string(),
});
