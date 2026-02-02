import { NextResponse } from "next/server";
import { emptyQuerySchema } from "@/lib/validators";

export function GET(request: Request) {
  const queryResult = emptyQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!queryResult.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const data = { status: "ok", timestamp: new Date().toISOString() };
  return NextResponse.json({ success: true, data, ...data });
}
