import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { userCreateSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";

// GET /api/admin/users - List all users with pagination
export async function GET(request: Request) {
  const auth = await requireRole(request, ["admin"]);
  if ("response" in auth) return auth.response;

  const { profile } = auth;
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
    console.error("Failed to count users:", countError);
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
    console.error("Failed to fetch users:", error);
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

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const { data: newUser, error } = await client
      .from("users")
      .insert({
        company_id: profile.company_id,
        email,
        full_name: fullName,
        phone: phone || null,
        role,
        password_hash: passwordHash,
        status: body.status || "active",
        access_permissions: accessPermissions || null,
      })
      .select("user_id, email, full_name, role, status")
      .single();

    if (error) {
      console.error("Failed to create user:", error);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newUser,
    });
  } catch (err) {
    console.error("Error creating user:", err);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
