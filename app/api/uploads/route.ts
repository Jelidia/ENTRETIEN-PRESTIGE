import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabaseServer";

const bucketName = "documents";
const docTypeMap: Record<string, string> = {
  id_front: "id_document_front_url",
  id_back: "id_document_back_url",
  contract: "contract_document_url",
  signature: "contract_signature_url",
};

function normalizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export async function POST(request: Request) {
  const auth = await requireRole(request, ["admin", "manager"], "team");
  if ("response" in auth) {
    return auth.response;
  }

  const formData = await request.formData();
  const userId = String(formData.get("userId") ?? "");
  const docType = String(formData.get("docType") ?? "");
  const file = formData.get("file");

  if (!userId || !docType || !(file instanceof File)) {
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  }

  const column = docTypeMap[docType];
  if (!column) {
    return NextResponse.json({ error: "Unsupported document type" }, { status: 400 });
  }

  const admin = createAdminClient();
  const createResult = await admin.storage.createBucket(bucketName, { public: false });
  const createError = createResult.error?.message?.toLowerCase() ?? "";
  if (createResult.error && !createError.includes("already exists")) {
    return NextResponse.json({ error: "Unable to prepare storage" }, { status: 500 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = normalizeFileName(file.name || "document");
  const storagePath = `${auth.profile.company_id}/${userId}/${docType}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await admin.storage
    .from(bucketName)
    .upload(storagePath, buffer, { contentType: file.type || "application/octet-stream", upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: "Unable to upload file" }, { status: 500 });
  }

  const updates: Record<string, string> = { [column]: storagePath };
  if (docType === "signature") {
    updates.contract_signed_at = new Date().toISOString();
  }

  const { error: updateError } = await admin
    .from("users")
    .update(updates)
    .eq("user_id", userId)
    .eq("company_id", auth.profile.company_id);

  if (updateError) {
    return NextResponse.json({ error: "Unable to update user" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, path: storagePath, field: column });
}
