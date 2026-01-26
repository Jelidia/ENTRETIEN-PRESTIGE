import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requirePermission(request, ["technician", "dispatch"]);
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client.from("geofences").select("*").eq("geofence_id", params.id).single();

  if (error || !data) {
    return NextResponse.json({ error: "Geofence not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}
