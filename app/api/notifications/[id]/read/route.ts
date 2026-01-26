import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requirePermission(request, "notifications");
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { error } = await client
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString(), status: "read" })
    .eq("notif_id", params.id);

  if (error) {
    return NextResponse.json({ error: "Unable to update" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
