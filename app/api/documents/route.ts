import { notFound, ok, requireRole, serverError, validationError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabaseServer";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { documentsQuerySchema } from "@/lib/validators";

const bucketName = "documents";
const docTypeMap: Record<string, string> = {
  id_front: "id_document_front_url",
  id_back: "id_document_back_url",
  contract: "contract_document_url",
  signature: "contract_signature_url",
};

function resolveStoragePath(value: string) {
  const marker = "/storage/v1/object/";
  const index = value.indexOf(marker);
  if (index === -1) {
    return value;
  }
  const tail = value.slice(index + marker.length);
  const [access, bucket, ...rest] = tail.split("/");
  if ((access !== "public" && access !== "sign") || bucket !== bucketName) {
    return value;
  }
  const path = rest.join("/").split("?")[0];
  return path || value;
}

export async function GET(request: Request) {
  const auth = await requireRole(request, ["admin", "manager"], "team");
  if ("response" in auth) {
    return auth.response;
  }
  const ip = getRequestIp(request);

  const { searchParams } = new URL(request.url);
  const queryResult = documentsQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!queryResult.success) {
    return validationError(queryResult.error, "Invalid document request");
  }
  const { userId, docType } = queryResult.data;
  const column = docTypeMap[docType];

  const admin = createAdminClient();
  const { data: user, error } = await admin
    .from("users")
    .select(`user_id, company_id, ${column}`)
    .eq("user_id", userId)
    .eq("company_id", auth.profile.company_id)
    .single();

  if (error || !user) {
    return notFound("User not found", "user_not_found");
  }

  const path = user[column as keyof typeof user] as string | null;
  if (!path) {
    return notFound("Document missing", "document_missing");
  }

  const storagePath = resolveStoragePath(path);
  const { data: signed, error: signError } = await admin
    .storage
    .from(bucketName)
    .createSignedUrl(storagePath, 300);

  if (signError || !signed?.signedUrl) {
    return serverError("Unable to sign document", "document_sign_failed");
  }

  await logAudit(admin, auth.profile.user_id, "document_access", "user", userId, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: { doc_type: docType },
  });

  return ok({ url: signed.signedUrl }, { flatten: true });
}
