import { z } from "zod";
import { normalizePhoneE164 } from "@/lib/smsTemplates";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ])
);

const jsonRecordSchema = z.record(jsonValueSchema);
const permissionMapSchema = z.record(z.boolean());
const rolePermissionsSchema = z.record(permissionMapSchema);
const polygonCoordinateSchema = z.union([
  z.object({ lat: z.number(), lng: z.number() }),
  z.tuple([z.number(), z.number()]),
]);
const phoneErrorMessage = "Téléphone invalide. Utilisez le format (514) 555-0123.";
const phoneE164Schema = z.string().trim().transform((value, ctx) => {
  const normalized = normalizePhoneE164(value);
  if (!normalized) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: phoneErrorMessage });
    return z.NEVER;
  }
  return normalized;
});
const phoneOptionalSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === "string" && !value.trim()) return undefined;
    return value;
  },
  phoneE164Schema.optional()
);
const phoneNullableSchema = z.preprocess(
  (value) => {
    if (value === null) return null;
    if (value === undefined) return undefined;
    if (typeof value === "string" && !value.trim()) return null;
    return value;
  },
  phoneE164Schema.nullable().optional()
);
const seedAccountSchema = z.object({
  role: z.enum(["admin", "technician", "sales_rep"]),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: phoneOptionalSchema,
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
  phone: phoneOptionalSchema,
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
  upsells: z.array(jsonRecordSchema),
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
  phone: phoneOptionalSchema,
  type: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
});

export const customerUpdateSchema = z.object({
  email: z.string().email().optional(),
  phone: phoneOptionalSchema,
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
  to: phoneE164Schema,
  message: z.string().min(1),
  threadId: z.string().optional(),
  customerId: z.string().optional(),
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
  phone: phoneOptionalSchema,
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
  phone: phoneOptionalSchema,
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
  phone: phoneOptionalSchema,
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postal_code: z.string().optional(),
  timezone: z.string().optional(),
  gst_number: z.string().optional(),
  qst_number: z.string().optional(),
  rolePermissions: rolePermissionsSchema.optional(),
});

export const companyServiceCreateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  defaultDurationMinutes: z.number().int().min(0).optional(),
  defaultPrice: z.number().min(0).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const companyServiceUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  defaultDurationMinutes: z.number().int().min(0).optional(),
  defaultPrice: z.number().min(0).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
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

export const reportLeadCreateSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: phoneOptionalSchema,
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  estimatedJobValue: z.number().optional(),
  followUpDate: z.string().optional(),
  quoteValidUntil: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  salesRepId: z.string().optional(),
});

export const territoryCreateSchema = z.object({
  territoryName: z.string().min(2),
  salesRepId: z.string().min(1),
  neighborhoods: z.array(z.string()).optional(),
  polygonCoordinates: z.array(polygonCoordinateSchema).optional(),
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
  startItems: z.array(jsonRecordSchema).optional(),
  endCompleted: z.boolean().optional(),
  endTime: z.string().optional(),
  endItems: z.array(jsonRecordSchema).optional(),
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

export const ratingSubmitSchema = z.object({
  token: z.string().min(1),
  rating_score: z.number().int().min(1).max(5),
  feedback: z.string().nullable().optional(),
  technician_mentioned: z.boolean().optional(),
});

export const dispatchScheduleSchema = z.object({
  jobId: z.string().min(1),
  technicianId: z.string().optional(),
  scheduledDate: z.string().min(6),
  scheduledStartTime: z.string().min(4),
  scheduledEndTime: z.string().min(4),
});

export const salesDayCreateSchema = z.object({
  salesDayDate: z.string().min(6),
  startTime: z.string().min(4),
  endTime: z.string().min(4),
  meetingAddress: z.string().optional(),
  meetingCity: z.string().optional(),
  meetingPostalCode: z.string().optional(),
  notes: z.string().optional(),
  masterPolygonCoordinates: z.array(polygonCoordinateSchema).optional(),
});

export const salesDayAssignSchema = z.object({
  salesDayId: z.string().min(1),
  assignments: z.array(
    z.object({
      salesRepId: z.string().min(1),
      overrideStartTime: z.string().optional(),
      overrideMeetingAddress: z.string().optional(),
      overrideMeetingCity: z.string().optional(),
      overrideMeetingPostalCode: z.string().optional(),
      notes: z.string().optional(),
    })
  ).min(1),
});

export const salesDayAutoAssignSchema = z.object({
  salesDayId: z.string().min(1),
});

export const salesDayMasterZoneSchema = z.object({
  salesDayId: z.string().min(1),
  polygonCoordinates: z.array(polygonCoordinateSchema).min(3),
});

export const salesDaySubZoneSchema = z.object({
  assignmentId: z.string().min(1),
  polygonCoordinates: z.array(polygonCoordinateSchema).min(3),
});

export const salesDayAssignmentsQuerySchema = z.object({
  salesDayId: z.string().min(1),
});

export const salesDayAvailabilityQuerySchema = z.object({
  date: z.string().min(6),
  startTime: z.string().min(4),
  endTime: z.string().min(4),
});

export const salesDayQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const photoUploadSchema = z.object({
  photo_type: z.enum(["before", "after"]),
  side: z.enum(["front", "back", "left", "right"]),
});

export const availabilitySlotSchema = z.object({
  day_of_week: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
  hour: z.number().int().min(0).max(23),
  is_available: z.boolean(),
});

export const availabilityUpdateSchema = z.object({
  availability: z.array(availabilitySlotSchema),
});

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: phoneNullableSchema,
}).refine((data) => data.fullName || data.email || data.phone !== undefined, {
  message: "At least one field must be provided for update",
});

const uuidSchema = z.string().uuid();

const leadStatusSchema = z.enum(["new", "contacted", "estimated", "won", "lost"]);

export const leadCreateSchema = z.object({
  customer_name: z.string().trim().min(2),
  phone: phoneE164Schema,
  email: z.string().email().nullable().optional(),
  address: z.string().trim().min(2).nullable().optional(),
  estimated_value: z.number().min(0).optional(),
  follow_up_date: z.string().nullable().optional(),
  quote_valid_until: z.string().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  status: leadStatusSchema.optional(),
  sales_rep_id: uuidSchema.nullable().optional(),
});

export const leadUpdateSchema = z
  .object({
    customer_name: z.string().trim().min(2).optional(),
    phone: phoneOptionalSchema,
    email: z.string().email().nullable().optional(),
    address: z.string().trim().nullable().optional(),
    estimated_value: z.number().min(0).optional(),
    follow_up_date: z.string().nullable().optional(),
    quote_valid_until: z.string().nullable().optional(),
    notes: z.string().trim().nullable().optional(),
    status: leadStatusSchema.optional(),
    lost_reason: z.string().nullable().optional(),
    sales_rep_id: uuidSchema.nullable().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided for update",
  });

export const leadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  page_size: z.coerce.number().int().min(1).max(50).optional(),
  search: z.string().trim().min(2).optional(),
  status: leadStatusSchema.optional(),
});

export const globalSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(120),
});

export const leadActivityCreateSchema = z.object({
  type: z.enum(["call", "sms", "note", "status"]),
  notes: z.string().trim().min(1).optional(),
});

export const emptyBodySchema = z.object({}).passthrough();
export const emptyQuerySchema = z.object({}).passthrough();

export const disable2faBodySchema = z.object({
  userId: uuidSchema.optional(),
});

export const idParamSchema = z.object({
  id: uuidSchema,
});

export const threadIdParamSchema = z.object({
  threadId: uuidSchema,
});

export const documentsQuerySchema = z.object({
  userId: uuidSchema,
  docType: z.enum(["id_front", "id_back", "contract", "signature"]),
});

export const notificationDeleteQuerySchema = z.object({
  id: uuidSchema,
});

export const ratingsValidateQuerySchema = z.object({
  token: z.string().min(1),
});

export const portalTokenPayloadSchema = z.object({
  customer_id: uuidSchema,
  company_id: uuidSchema,
  expires_at: z.string().min(1),
});

export const portalTokenParamSchema = z.object({
  token: z.string().min(10),
});

export const portalInvoiceParamSchema = z.object({
  token: z.string().min(10),
  invoiceId: uuidSchema,
});

export const portalLinkQuerySchema = z.object({
  expires_in_days: z.coerce.number().int().min(1).max(90).optional(),
});

export const portalLinkCreateSchema = z.object({
  customerId: uuidSchema,
  expiresInDays: z.number().int().min(1).max(90).optional(),
});

export const settingsDocumentQuerySchema = z.object({
  type: z.enum(["id_photo", "profile_photo", "contract"]),
});

export const settingsUploadQuerySchema = z.object({
  type: z.enum(["contract", "id_photo", "profile_photo"]),
});

export const uploadsFormSchema = z.object({
  userId: uuidSchema,
  docType: z.enum(["id_front", "id_back", "contract", "signature"]),
});

export const mapsActionParamSchema = z.object({
  action: z.enum(["geocode", "distance", "territory"]),
});

export const mapsGeocodeQuerySchema = z.object({
  address: z.string().min(3),
});

export const mapsDistanceQuerySchema = z.object({
  origins: z.string().min(1),
  destinations: z.string().min(1),
});

export const mapsTerritoryQuerySchema = z.object({
  polygon: z.string().min(1),
});

export const smsTriggerBodySchema = z.object({
  event: z.enum(["job_scheduled", "reminder_24h", "reminder_1h", "job_completed", "no_show", "running_late"]),
  jobId: uuidSchema,
  customData: jsonRecordSchema.optional(),
});
