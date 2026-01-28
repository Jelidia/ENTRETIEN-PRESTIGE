import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { profileUpdateSchema } from "@/lib/validators";

// PATCH /api/settings/profile - Update user's own profile
export async function PATCH(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const { profile } = auth;

  try {
    const body = await request.json();
    const result = profileUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }

    const { fullName } = result.data;

    const client = createUserClient(getAccessTokenFromRequest(request) ?? "");

    // Update full name
    const { data: updatedUser, error } = await client
      .from("users")
      .update({ full_name: fullName })
      .eq("user_id", profile.user_id)
      .select("user_id, full_name")
      .single();

    if (error) {
      console.error("Failed to update profile:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
