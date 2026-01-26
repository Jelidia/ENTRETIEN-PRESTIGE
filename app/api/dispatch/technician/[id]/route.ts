import { NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { requirePermission } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requirePermission(request, "dispatch");
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("jobs")
    .select("job_id, service_type, status, scheduled_date, scheduled_start_time")
    .eq("technician_id", params.id)
    .order("scheduled_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Unable to load schedule" }, { status: 400 });
  }

  return NextResponse.json({ data });
}
