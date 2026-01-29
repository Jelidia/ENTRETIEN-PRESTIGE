import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabaseServer";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";

const bucketName = "documents";
const docTypeMap: Record<string, string> = {
  id_front: "id_document_front_url",
  id_back: "id_document_back_url",
  contract: "contract_document_url",
  signature: "contract_signature_url",
};

export async function GET(request: Request) {
  const auth = await requireRole(request, ["admin", "manager"], "team");
  if ("response" in auth) {
    return auth.response;
  }
  const ip = getRequestIp(request);

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") ?? "";
  const docType = searchParams.get("docType") ?? "";

  if (!userId || !docType) {
    return NextResponse.json({ error: "Missing document request" }, { status: 400 });
  }

  const column = docTypeMap[docType];
  if (!column) {
    return NextResponse.json({ error: "Unsupported document type" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: user, error } = await admin
    .from("users")
    .select(`user_id, company_id, ${column}`)
    .eq("user_id", userId)
    .eq("company_id", auth.profile.company_id)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const path = user[column as keyof typeof user] as string | null;
  if (!path) {
    return NextResponse.json({ error: "Document missing" }, { status: 404 });
  }

  const { data: signed, error: signError } = await admin
    .storage
    .from(bucketName)
    .createSignedUrl(path, 300);

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: "Unable to sign document" }, { status: 500 });
  }

  await logAudit(admin, auth.profile.user_id, "document_access", "user", userId, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: { doc_type: docType },
  });

  return NextResponse.json({ url: signed.signedUrl });
}
