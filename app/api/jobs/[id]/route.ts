import { NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { jobUpdateSchema } from "@/lib/validators";
import { requireUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");

  const { data, error } = await client.from("jobs").select("*").eq("job_id", params.id).single();
  if (error || !data) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }
  const { user } = auth;
  const body = await request.json().catch(() => null);
  const parsed = jobUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("jobs")
    .update({ ...parsed.data, updated_by: user.id })
    .eq("job_id", params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to update job" }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { error } = await client.from("jobs").update({ deleted_at: new Date().toISOString() }).eq("job_id", params.id);

  if (error) {
    return NextResponse.json({ error: "Unable to delete job" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
