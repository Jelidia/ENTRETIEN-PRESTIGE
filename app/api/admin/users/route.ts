import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient, createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { userCreateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { captureError } from "@/lib/errorTracking";
import { getRequestContext } from "@/lib/requestId";

// GET /api/admin/users - List all users with pagination
export async function GET(request: Request) {
  const auth = await requireRole(request, ["admin"]);
  if ("response" in auth) return auth.response;

  const { profile } = auth;
  const requestContext = getRequestContext(request, {
    user_id: profile.user_id,
    company_id: profile.company_id,
  });
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "4", 10);
  const offset = (page - 1) * limit;

  const client = createUserClient(getAccessTokenFromRequest(request) ?? "");

  // Get total count
  const { count, error: countError } = await client
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("company_id", profile.company_id);

  if (countError) {
    await captureError(countError, {
      ...requestContext,
      action: "count_users",
    });
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }

  // Get paginated users
  const { data: users, error } = await client
    .from("users")
    .select("user_id, email, full_name, role, status, created_at")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    await captureError(error, {
      ...requestContext,
      action: "fetch_users",
    });
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }

  const total = count ?? 0;
  const pages = Math.ceil(total / limit);

  return NextResponse.json({
    success: true,
    data: {
      users,
      total,
      page,
      pages,
    },
  });
}

// POST /api/admin/users - Create new user
export async function POST(request: Request) {
  const auth = await requireRole(request, ["admin"]);
  if ("response" in auth) return auth.response;

  const { profile } = auth;
  const requestContext = getRequestContext(request, {
    user_id: profile.user_id,
    company_id: profile.company_id,
  });

  try {
    const body = await request.json();
    const result = userCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }

    const { fullName, email, phone, role, password, accessPermissions } = result.data;

    const client = createUserClient(getAccessTokenFromRequest(request) ?? "");
    const idempotency = await beginIdempotency(client, request, profile.user_id, result.data);
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
    }
    if (idempotency.action === "in_progress") {
      return NextResponse.json({ error: "Request already in progress" }, { status: 409 });
    }

    // Check if email already exists
    const { data: existingUser } = await client
      .from("users")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email existe déjà" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone: phone || undefined },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message ?? "Unable to create auth user" },
        { status: 400 }
      );
    }

    const { data: newUser, error } = await admin
      .from("users")
      .insert({
        user_id: authData.user.id,
        company_id: profile.company_id,
        email,
        full_name: fullName,
        phone: phone || null,
        role,
        status: body.status || "active",
        access_permissions: accessPermissions || null,
      })
      .select("user_id, email, full_name, role, status")
      .single();

    if (error) {
      await admin.auth.admin.deleteUser(authData.user.id);
      await captureError(error, {
        ...requestContext,
        action: "create_user",
        created_user_id: authData.user.id,
      });
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    await logAudit(admin, profile.user_id, "admin_create_user", "user", newUser.user_id, "success", {
      newValues: {
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        status: newUser.status,
      },
      ipAddress: getRequestIp(request),
      userAgent: request.headers.get("user-agent") ?? null,
    });

    const responseBody = {
      success: true,
      data: newUser,
    };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  } catch (err) {
    await captureError(err, {
      ...requestContext,
      action: "create_user",
    });
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
