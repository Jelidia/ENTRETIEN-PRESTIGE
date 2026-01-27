import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { sendSMS } from "@/lib/twilio";
import { smsTemplates, formatPhoneNumber } from "@/lib/smsTemplates";

// Trigger SMS based on job events
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");

  const body = await request.json();
  const { event, jobId, customData } = body;

  if (!event || !jobId) {
    return NextResponse.json(
      { error: "Missing event or jobId" },
      { status: 400 }
    );
  }

  // Get job details
  const { data: job, error: jobError } = await client
    .from("jobs")
    .select(`
      *,
      customer:customers(customer_id, full_name, phone, email, preferred_contact_method)
    `)
    .eq("job_id", jobId)
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: "Job not found" },
      { status: 404 }
    );
  }

  const customer = job.customer;
  if (!customer || !customer.phone) {
    return NextResponse.json(
      { error: "Customer has no phone number" },
      { status: 400 }
    );
  }

  let message = "";
  let sendSms = false;

  // Determine which SMS to send based on event
  switch (event) {
    case "job_scheduled":
      message = smsTemplates.jobScheduled({
        customerName: customer.full_name || "Client",
        date: new Date(job.scheduled_start).toLocaleDateString("fr-CA"),
        time: new Date(job.scheduled_start).toLocaleTimeString("fr-CA", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        address: job.address || "",
      });
      sendSms = true;
      break;

    case "reminder_24h":
      message = smsTemplates.reminder24h({
        date: new Date(job.scheduled_start).toLocaleDateString("fr-CA"),
        time: new Date(job.scheduled_start).toLocaleTimeString("fr-CA", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      sendSms = true;
      break;

    case "reminder_1h":
      message = smsTemplates.reminder1h({
        time: new Date(job.scheduled_start).toLocaleTimeString("fr-CA", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      sendSms = true;
      break;

    case "job_completed":
      // Get invoice to determine payment method
      const { data: invoice } = await client
        .from("invoices")
        .select("invoice_id, total_amount, payment_method, invoice_number")
        .eq("job_id", jobId)
        .single();

      if (invoice) {
        const amount = `$${invoice.total_amount.toFixed(2)}`;

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
        sendSms = true;
      }
      break;

    case "no_show":
      message = smsTemplates.noShow();
      sendSms = true;

      // Also notify manager and sales rep
      const { data: assignments } = await client
        .from("job_assignments")
        .select("user:users(full_name, phone, role)")
        .eq("job_id", jobId);

      if (assignments) {
        for (const assignment of assignments) {
          if (assignment.user && (assignment.user.role === "manager" || assignment.user.role === "sales_rep")) {
            if (assignment.user.phone) {
              await sendSMS(
                formatPhoneNumber(assignment.user.phone),
                `No-show: ${customer.full_name} n'était pas disponible pour le rendez-vous (Job #${jobId.substring(0, 8)})`
              );
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

  if (sendSms && message) {
    const phoneNumber = formatPhoneNumber(customer.phone);

    try {
      await sendSMS(phoneNumber, message);

      // Log SMS in database
      await client.from("sms_messages").insert({
        recipient_phone: phoneNumber,
        message_body: message,
        direction: "outbound",
        status: "sent",
        related_job_id: jobId,
      });

      return NextResponse.json({
        success: true,
        message: "SMS sent successfully",
      });
    } catch (error: any) {
      console.error("Failed to send SMS:", error);
      return NextResponse.json(
        { error: "Failed to send SMS", details: error.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: false,
    message: "No SMS sent (conditions not met)",
  });
}
