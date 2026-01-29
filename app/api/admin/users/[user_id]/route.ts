import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { userUpdateSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

// PATCH /api/admin/users/[user_id] - Update user
export async function PATCH(
  request: Request,
  { params }: { params: { user_id: string } }
) {
  const auth = await requireRole(request, ["admin"]);
  if ("response" in auth) return auth.response;

  const { profile } = auth;
  const userId = params.user_id;
  const ip = getRequestIp(request);

  try {
    const body = await request.json();

    // Allow partial updates
    const updateData: Record<string, unknown> = {};

    if (body.email !== undefined) updateData.email = body.email;
    if (body.fullName !== undefined) updateData.full_name = body.fullName;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.accessPermissions !== undefined) updateData.access_permissions = body.accessPermissions;

    const client = createUserClient(getAccessTokenFromRequest(request) ?? "");
    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      action: "update",
      payload: updateData,
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

    // Verify user belongs to same company
    const { data: existingUser } = await client
      .from("users")
      .select("user_id, company_id")
      .eq("user_id", userId)
      .single();

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (existingUser.company_id !== profile.company_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update user
    const { data: updatedUser, error } = await client
      .from("users")
      .update(updateData)
      .eq("user_id", userId)
      .select("user_id, email, full_name, role, status")
      .single();

    if (error) {
      console.error("Failed to update user:", error);
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    await logAudit(client, profile.user_id, "admin_user_update", "user", userId, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: updateData,
    });

    const responseBody = {
      success: true,
      data: updatedUser,
    };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  } catch (err) {
    console.error("Error updating user:", err);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[user_id] - Delete user
export async function DELETE(
  request: Request,
  { params }: { params: { user_id: string } }
) {
  const auth = await requireRole(request, ["admin"]);
  if ("response" in auth) return auth.response;

  const { profile } = auth;
  const userId = params.user_id;
  const ip = getRequestIp(request);

  const client = createUserClient(getAccessTokenFromRequest(request) ?? "");
  const idempotency = await beginIdempotency(client, request, profile.user_id, {
    action: "delete",
    userId,
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

  // Verify user belongs to same company
  const { data: existingUser } = await client
    .from("users")
    .select("user_id, company_id")
    .eq("user_id", userId)
    .single();

  if (!existingUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (existingUser.company_id !== profile.company_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Prevent deleting yourself
  if (userId === profile.user_id) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 }
    );
  }

  // Hard delete user
  const { error } = await client
    .from("users")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }

  await logAudit(client, profile.user_id, "admin_user_delete", "user", userId, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
  });

  const responseBody = {
    success: true,
    message: "User deleted",
  };
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return NextResponse.json(responseBody);
}
