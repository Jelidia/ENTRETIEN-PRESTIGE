import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { settingsDocumentQuerySchema } from "@/lib/validators";

// DELETE /api/settings/document?type=id_photo|profile_photo
export async function DELETE(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const { profile } = auth;
  const ip = getRequestIp(request);
  const { searchParams } = new URL(request.url);
  const queryResult = settingsDocumentQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!queryResult.success) {
    return NextResponse.json(
      { error: "Invalid type. Must be: id_photo or profile_photo" },
      { status: 400 }
    );
  }
  const { type } = queryResult.data;

  try {
    const client = createUserClient(getAccessTokenFromRequest(request) ?? "");
    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      action: "delete",
      type,
    });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
    }
    if (idempotency.action === "in_progress") {
      return NextResponse.json({ error: "Request already in progress" }, { status: 409 });
    }

    // Get current file URL
    const { data: user } = await client
      .from("users")
      .select("id_document_front_url, avatar_url")
      .eq("user_id", profile.user_id)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const fileUrl =
      type === "id_photo" ? user.id_document_front_url : user.avatar_url;

    if (fileUrl) {
      // Extract filename from URL
      const urlParts = fileUrl.split("/");
      const filename = urlParts.slice(-3).join("/"); // user_id/type/filename.ext

      // Delete from storage
      await client.storage.from("user-documents").remove([filename]);
    }

    // Update user record to remove URL
    const updateData: Record<string, null> = {};
    if (type === "id_photo") {
      updateData.id_document_front_url = null;
    } else {
      updateData.avatar_url = null;
    }

    const { error: updateError } = await client
      .from("users")
      .update(updateData)
      .eq("user_id", profile.user_id);

    if (updateError) {
      console.error("Failed to update user record:", updateError);
      return NextResponse.json(
        { error: "Failed to delete document" },
        { status: 500 }
      );
    }

    await logAudit(client, profile.user_id, "document_delete", "user", profile.user_id, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { type },
    });

    const responseBody = {
      success: true,
      message: "Document deleted",
    };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  } catch (err) {
    console.error("Error deleting document:", err);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
