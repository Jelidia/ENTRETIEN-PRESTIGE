import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Missing Supabase configuration" },
      { status: 500 }
    );
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { email, newPassword } = await request.json();

  if (!email || !newPassword) {
    return NextResponse.json(
      { error: "Email and newPassword are required" },
      { status: 400 }
    );
  }

  // Get the user by email
  const { data: users, error: listError } = await admin.auth.admin.listUsers();

  if (listError) {
    return NextResponse.json(
      { error: "Failed to list users", details: listError.message },
      { status: 500 }
    );
  }

  const user = users.users.find((u) => u.email === email);

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  // Update the user's password
  const { data, error } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to reset password", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Password reset successfully",
    userId: data.user.id,
  });
}
