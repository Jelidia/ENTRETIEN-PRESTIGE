import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { idParamSchema } from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requirePermission(request, ["technician", "dispatch"]);
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
    .from("geofences")
    .select("*")
    .eq("geofence_id", paramsResult.data.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Geofence not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}
