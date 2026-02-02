import { createAdminClient } from "./supabaseServer";

export async function createNotification(
  admin: ReturnType<typeof createAdminClient>,
  {
    userId,
    companyId,
    type,
    title,
    body,
  }: {
    userId: string;
    companyId: string;
    type: string;
    title: string;
    body: string;
  }
) {
  await admin.from("notifications").insert({
    user_id: userId,
    company_id: companyId,
    type,
    title,
    body,
    channel: "in_app",
    status: "sent",
  });
}
