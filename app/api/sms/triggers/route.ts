import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireUser } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { sendSms } from "@/lib/twilio";
import { smsTemplates, formatPhoneNumber } from "@/lib/smsTemplates";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { smsTriggerBodySchema } from "@/lib/validators";
import { captureError } from "@/lib/errorTracking";
import { getRequestContext } from "@/lib/requestId";

async function resolveThreadId(
  client: ReturnType<typeof createUserClient>,
  customerId: string | null,
  phoneNumber: string
) {
  let query = client
    .from("sms_messages")
    .select("thread_id")
    .not("thread_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (customerId) {
    query = query.eq("customer_id", customerId);
  } else {
    query = query.eq("phone_number", phoneNumber);
  }

  const { data } = await query.maybeSingle();
  return data?.thread_id ?? randomUUID();
}

// Trigger SMS based on job events
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { profile } = auth;
  const ip = getRequestIp(request);
  const requestContext = getRequestContext(request, {
    user_id: profile.user_id,
    company_id: profile.company_id,
  });

  const body = await request.json().catch(() => ({}));
  const bodyResult = smsTriggerBodySchema.safeParse(body);
  if (!bodyResult.success) {
    return NextResponse.json(
      { error: "Missing event or jobId" },
      { status: 400 }
    );
  }
  const { event, jobId, customData } = bodyResult.data;

  // Get job details
  const { data: job, error: jobError } = await client
    .from("jobs")
    .select(`
      *,
      customer:customers(customer_id, first_name, last_name, phone, email)
    `)
    .eq("job_id", jobId)
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: "Job not found" },
      { status: 404 }
    );
  }

  const customerRecord = Array.isArray(job.customer) ? job.customer[0] : job.customer;
  if (!customerRecord || !customerRecord.phone) {
    return NextResponse.json(
      { error: "Customer has no phone number" },
      { status: 400 }
    );
  }

  const customerName = `${customerRecord.first_name ?? ""} ${customerRecord.last_name ?? ""}`.trim() || "Client";
  const scheduledStart = job.scheduled_date && job.scheduled_start_time
    ? new Date(`${job.scheduled_date}T${job.scheduled_start_time}`)
    : null;
  const scheduledDateLabel = scheduledStart ? scheduledStart.toLocaleDateString("fr-CA") : "";
  const scheduledTimeLabel = scheduledStart
    ? scheduledStart.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })
    : "";

  let message = "";
  let shouldSendSms = false;

  // Determine which SMS to send based on event
  switch (event) {
    case "job_scheduled":
      message = smsTemplates.jobScheduled({
        customerName,
        date: scheduledDateLabel,
        time: scheduledTimeLabel,
        address: job.address || "",
      });
      shouldSendSms = true;
      break;

    case "reminder_24h":
      message = smsTemplates.reminder24h({
        date: scheduledDateLabel,
        time: scheduledTimeLabel,
      });
      shouldSendSms = true;
      break;

    case "reminder_1h":
      message = smsTemplates.reminder1h({
        time: scheduledTimeLabel,
      });
      shouldSendSms = true;
      break;

    case "job_completed":
      // Get invoice to determine payment method
      const { data: invoice } = await client
        .from("invoices")
        .select("invoice_id, total_amount, payment_method, invoice_number")
        .eq("job_id", jobId)
        .single();

      if (invoice) {
        const amount = invoice.total_amount
          ? `$${Number(invoice.total_amount).toFixed(2)}`
          : "$0.00";

        if (invoice.payment_method === "interac") {
          message = smsTemplates.jobCompletedInterac({
            invoiceNumber: invoice.invoice_number || invoice.invoice_id.substring(0, 8),
            amount,
            email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || "accounting@entretien-prestige.ca",
          });
        } else if (invoice.payment_method === "credit_card") {
          // Generate Stripe payment link (you'd need to implement this)
          const paymentLink = customData?.paymentLink || "https://pay.entretien-prestige.ca/invoice/" + invoice.invoice_id;
          message = smsTemplates.jobCompletedStripe({
            invoiceNumber: invoice.invoice_number || invoice.invoice_id.substring(0, 8),
            amount,
            paymentLink,
          });
        } else if (invoice.payment_method === "cash") {
          message = smsTemplates.jobCompletedCash();
        }
        shouldSendSms = true;
      }
      break;

    case "no_show":
      message = smsTemplates.noShow();
      shouldSendSms = true;

      // Also notify manager and sales rep
        const notifyUserIds = [job.manager_id, job.sales_rep_id].filter(Boolean);
        if (notifyUserIds.length > 0) {
          const { data: notifyUsers } = await client
            .from("users")
            .select("full_name, phone, role")
            .in("user_id", notifyUserIds);

          if (notifyUsers) {
            for (const user of notifyUsers) {
              if (user && (user.role === "manager" || user.role === "sales_rep")) {
                if (user.phone) {
                  await sendSms(
                    formatPhoneNumber(user.phone),
                    `No-show: ${customerName} n'était pas disponible pour le rendez-vous (Job #${jobId.substring(0, 8)})`
                  );
                }
              }
            }
          }
        }
      break;

    default:
      return NextResponse.json(
        { error: "Unknown event type" },
        { status: 400 }
      );
  }

  if (shouldSendSms && message) {
    const phoneNumber = formatPhoneNumber(customerRecord.phone);

    try {
      const idempotency = await beginIdempotency(client, request, profile.user_id, {
        event,
        jobId,
        phoneNumber,
      });
      if (idempotency.action === "replay") {
        return NextResponse.json(idempotency.body, { status: idempotency.status });
      }
      if (idempotency.action === "conflict") {
        return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
      }
      if (idempotency.action === "in_progress") {
        return NextResponse.json({ error: "Request already in progress" }, { status: 409 });
      }

      await sendSms(phoneNumber, message);

      const threadId = await resolveThreadId(client, customerRecord.customer_id ?? null, phoneNumber);

      // Log SMS in database
      await client.from("sms_messages").insert({
        company_id: job.company_id,
        customer_id: customerRecord.customer_id ?? null,
        phone_number: phoneNumber,
        content: message,
        direction: "outbound",
        status: "sent",
        related_job_id: jobId,
        thread_id: threadId,
      });

      await logAudit(client, profile.user_id, "sms_trigger", "sms_thread", threadId, "success", {
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") ?? null,
        newValues: { event, job_id: jobId },
      });

      const responseBody = {
        success: true,
        message: "SMS sent successfully",
        data: { message: "SMS sent successfully" },
      };
      await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
      return NextResponse.json(responseBody);
    } catch (error) {
      await captureError(error, {
        ...requestContext,
        action: "send_sms",
        job_id: jobId,
        event,
      });
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json(
        { error: "Failed to send SMS", details: errorMessage },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: false,
    message: "No SMS sent (conditions not met)",
    data: { message: "No SMS sent (conditions not met)" },
  });
}
