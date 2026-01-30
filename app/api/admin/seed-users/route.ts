import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { getRequestIp } from "@/lib/rateLimit";
import { getAccessTokenFromRequest } from "@/lib/session";
import { createAdminClient, createUserClient } from "@/lib/supabaseServer";
import { emptyBodySchema, emptyQuerySchema } from "@/lib/validators";

// WARNING: This endpoint creates users with proper authentication
// Only use in development/initial setup

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = await requireRole(request, ["admin"]);
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;

  const queryResult = emptyQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!queryResult.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const bodyResult = emptyBodySchema.safeParse(body);
  if (!bodyResult.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const userClient = createUserClient(getAccessTokenFromRequest(request) ?? "");
  const idempotency = await beginIdempotency(userClient, request, profile.user_id, {
    action: "seed-users",
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

  const admin = createAdminClient();

  try {
    // Step 1: Ensure company exists
    const { data: company } = await admin
      .from("companies")
      .select("company_id")
      .eq("name", "Entretien Prestige")
      .maybeSingle();

    let companyId = company?.company_id;

    if (!companyId) {
      const { data: newCompany } = await admin
        .from("companies")
        .insert({
          name: "Entretien Prestige",
          legal_name: "Entretien Prestige Inc.",
          status: "active",
          timezone: "America/Montreal",
          country: "CA",
        })
        .select("company_id")
        .single();
      companyId = newCompany!.company_id;
    }

    // Step 2: Delete existing users for this company only
    const { data: existingUsers, error: usersError } = await admin
      .from("users")
      .select("user_id")
      .eq("company_id", companyId);

    if (usersError) {
      return NextResponse.json(
        { error: "Failed to list existing users", details: usersError.message },
        { status: 500 }
      );
    }

    if (existingUsers && existingUsers.length > 0) {
      for (const user of existingUsers) {
        await admin.auth.admin.deleteUser(user.user_id);
      }
    }

    // Also clean up any orphaned public.users for this company
    await admin.from("users").delete().eq("company_id", companyId);

    // Step 3: Define users to create
    const usersToCreate = [
      {
        email: "jelidiadam12@gmail.com",
        password: "jelidiadam12@gmail.com",
        full_name: "Adam Jelidi",
        phone: "+15147587963",
        role: "admin",
        two_factor_enabled: true,
        two_factor_method: "sms",
      },
      {
        email: "youssef.takhi@hotmail.com",
        password: "youssef.takhi@hotmail.com",
        full_name: "Youssef Takhi",
        phone: "+14383652445",
        role: "manager",
        two_factor_enabled: false,
        two_factor_method: "authenticator",
      },
      {
        email: "jelidiadam12+1@gmail.com",
        password: "jelidiadam12+1@gmail.com",
        full_name: "Amine Bouchard",
        phone: "+15145550131",
        role: "technician",
        two_factor_enabled: false,
        two_factor_method: "authenticator",
      },
      {
        email: "jelidiadam12+2@gmail.com",
        password: "jelidiadam12+2@gmail.com",
        full_name: "Nadia Tremblay",
        phone: "+15145550162",
        role: "sales_rep",
        two_factor_enabled: false,
        two_factor_method: "authenticator",
      },
      {
        email: "jelidiadam12+3@gmail.com",
        password: "jelidiadam12+3@gmail.com",
        full_name: "Olivier Roy",
        phone: "+15145550194",
        role: "manager",
        two_factor_enabled: false,
        two_factor_method: "authenticator",
      },
    ];

    // Step 4: Create users using Supabase Admin API
    const createdUsers = [];
    const errors = [];

    for (const userData of usersToCreate) {
      // Create auth user
      const { data: authUser, error: authError } = await admin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        phone: userData.phone,
        phone_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          phone: userData.phone,
        },
      });

      if (authError || !authUser.user) {
        errors.push({
          email: userData.email,
          step: "auth_user_creation",
          error: authError?.message || "Unknown error",
          details: authError,
        });
        continue;
      }

      // Create public.users entry
      const { error: publicUserError } = await admin.from("users").insert({
        user_id: authUser.user.id,
        company_id: companyId,
        email: userData.email,
        email_verified: true,
        phone: userData.phone,
        phone_verified: true,
        full_name: userData.full_name,
        role: userData.role,
        status: "active",
        two_factor_enabled: userData.two_factor_enabled,
        two_factor_method: userData.two_factor_method,
      });

      if (publicUserError) {
        errors.push({
          email: userData.email,
          step: "public_user_creation",
          error: publicUserError.message,
          details: publicUserError,
        });
        // Cleanup: delete auth user if public user creation failed
        await admin.auth.admin.deleteUser(authUser.user.id);
        continue;
      }

      createdUsers.push({
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        user_id: authUser.user.id,
      });

      await logAudit(admin, profile.user_id, "admin_seed_user", "user", authUser.user.id, "success", {
        newValues: {
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
        },
        ipAddress: getRequestIp(request),
        userAgent: request.headers.get("user-agent") ?? null,
      });
    }

    const responseBody = {
      success: createdUsers.length > 0,
      message: `Successfully created ${createdUsers.length} users`,
      users: createdUsers,
      errors: errors.length > 0 ? errors : undefined,
      note: "All passwords are set to the email address. Users should change them after first login.",
    };
    await completeIdempotency(
      userClient,
      request,
      idempotency.scope,
      idempotency.requestHash,
      responseBody,
      200
    );
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("Seed users error:", error);
    return NextResponse.json(
      { error: "Failed to seed users", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
