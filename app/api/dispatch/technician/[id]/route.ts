import { NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { requirePermission } from "@/lib/auth";
import { idParamSchema } from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requirePermission(request, "dispatch");
  if ("response" in auth) {
    return auth.response;
  }

  const paramsResult = idParamSchema.safeParse(params);
  if (!paramsResult.success) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("jobs")
    .select("job_id, service_type, status, scheduled_date, scheduled_start_time")
    .eq("technician_id", paramsResult.data.id)
    .order("scheduled_date", { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: "Unable to load schedule" }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
}
