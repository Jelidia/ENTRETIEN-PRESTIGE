import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");

  const { data, error } = await client
    .from("users")
    .select("user_id, full_name, email, phone, role, status, company_id, avatar_url, created_at")
    .eq("user_id", auth.user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to load profile" }, { status: 400 });
  }

  return NextResponse.json(data);
}
