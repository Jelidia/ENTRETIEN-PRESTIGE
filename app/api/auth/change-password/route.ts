import { NextResponse } from "next/server";
import { z } from "zod";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";

// Simple password update schema (for password reset flows, no current password verification)
const simplePasswordSchema = z.object({
  newPassword: z.string()
    .min(8, "Minimum 8 caractères")
    .max(128, "Maximum 128 caractères")
    .regex(/[A-Z]/, "Minimum 1 lettre majuscule (A-Z)")
    .regex(/[0-9]/, "Minimum 1 chiffre (0-9)")
    .regex(/[!@#$%^&*]/, "Minimum 1 caractère spécial (!@#$%^&*)"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = simplePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.format() }, { status: 400 });
  }

  const token = getAccessTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = createUserClient(token);
  const { error } = await client.auth.updateUser({ password: parsed.data.newPassword });

  if (error) {
    return NextResponse.json({ error: "Unable to update password" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
