import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { emptyQuerySchema } from "@/lib/validators";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  const queryResult = emptyQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!queryResult.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  return NextResponse.json(auth.profile);
}
