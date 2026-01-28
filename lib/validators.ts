import { z } from "zod";

const permissionMapSchema = z.record(z.boolean());
const rolePermissionsSchema = z.record(permissionMapSchema);
const seedAccountSchema = z.object({
  role: z.enum(["admin", "technician", "sales_rep"]),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
});

// Password schema with complexity requirements
const passwordSchema = z.string()
  .min(8, "Minimum 8 caractères")
  .max(128, "Maximum 128 caractères")
  .regex(/[A-Z]/, "Minimum 1 lettre majuscule (A-Z)")
  .regex(/[0-9]/, "Minimum 1 chiffre (0-9)")
  .regex(/[!@#$%^&*]/, "Minimum 1 caractère spécial (!@#$%^&*)");

export const registerSchema = z.object({
  companyName: z.string().min(2),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7).optional(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1), // Login doesn't need complexity validation
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
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

// Admin password reset (for admins resetting other users' passwords)
export const adminResetPasswordSchema = z.object({
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

// Admin password reset by email (for /api/admin/reset-password route)
export const adminResetByEmailSchema = z.object({
  email: z.string().email(),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
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

export const geofenceCreateSchema = z.object({
  jobId: z.string().optional(),
  customerId: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  radiusMeters: z.number().optional(),
});

export const userCreateSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.string().min(2),
  password: passwordSchema,
  accessPermissions: permissionMapSchema.optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  id_document_front_url: z.string().optional(),
  id_document_back_url: z.string().optional(),
  contract_document_url: z.string().optional(),
  contract_signature_url: z.string().optional(),
  contract_signed_at: z.string().optional(),
});

export const userUpdateSchema = z.object({
  full_name: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  access_permissions: permissionMapSchema.nullable().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  id_document_front_url: z.string().optional(),
  id_document_back_url: z.string().optional(),
  contract_document_url: z.string().optional(),
  contract_signature_url: z.string().optional(),
  contract_signed_at: z.string().optional(),
});

export const companyUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  legal_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postal_code: z.string().optional(),
  timezone: z.string().optional(),
  rolePermissions: rolePermissionsSchema.optional(),
});

export const notificationSettingsSchema = z.object({
  jobAlerts: z.boolean(),
  invoiceReminders: z.boolean(),
  qualityIncidents: z.boolean(),
  channel: z.string(),
});

export const seedAccountsSchema = z.object({
  accounts: z.array(seedAccountSchema).min(1),
});

export const leadCreateSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  estimatedJobValue: z.number().optional(),
  followUpDate: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  salesRepId: z.string().optional(),
});

export const territoryCreateSchema = z.object({
  territoryName: z.string().min(2),
  salesRepId: z.string().min(1),
  neighborhoods: z.array(z.string()).optional(),
  polygonCoordinates: z.array(z.any()).optional(),
});

export const commissionCreateSchema = z.object({
  employeeId: z.string().min(1),
  jobId: z.string().min(1).optional(),
  servicePrice: z.number().min(0),
  commissionRate: z.number().min(0),
  estimatedCommission: z.number().optional(),
});

export const payrollCreateSchema = z.object({
  employeeId: z.string().min(1),
  year: z.number().min(2000),
  month: z.number().min(1).max(12),
  baseSalary: z.number().min(0),
  commissionConfirmed: z.number().optional(),
  deductions: z.number().optional(),
  netPay: z.number().min(0),
  jobsCompleted: z.number().optional(),
  totalRevenue: z.number().optional(),
});

export const checklistCreateSchema = z.object({
  technicianId: z.string().min(1),
  workDate: z.string().min(6),
  startCompleted: z.boolean().optional(),
  startTime: z.string().optional(),
  startItems: z.array(z.record(z.any())).optional(),
  endCompleted: z.boolean().optional(),
  endTime: z.string().optional(),
  endItems: z.array(z.record(z.any())).optional(),
  shiftStatus: z.string().optional(),
});

export const incidentCreateSchema = z.object({
  technicianId: z.string().min(1).optional(),
  jobId: z.string().min(1).optional(),
  description: z.string().min(2),
  incidentType: z.string().optional(),
  severity: z.string().optional(),
  estimatedCost: z.number().optional(),
});

export const qualityIssueCreateSchema = z.object({
  jobId: z.string().min(1),
  customerId: z.string().min(1),
  complaintType: z.string().min(1),
  description: z.string().min(2),
  severity: z.string().optional(),
  reportedBy: z.string().optional(),
});
