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
  const { data, error } = await client
    .from("gps_locations")
    .select("*")
    .eq("technician_id", params.id)
    .order("timestamp", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Unable to load GPS" }, { status: 400 });
  }

  return NextResponse.json({ data });
}
