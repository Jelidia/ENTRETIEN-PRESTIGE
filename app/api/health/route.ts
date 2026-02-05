import { NextResponse } from "next/server";
import { ok, validationError } from "@/lib/auth";
import { emptyQuerySchema } from "@/lib/validators";

export function GET(request: Request) {
  const queryResult = emptyQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!queryResult.success) {
    return validationError(queryResult.error, "Invalid request");
  }
  const data = { status: "ok", timestamp: new Date().toISOString() };
  return ok(data, { flatten: true });
}
