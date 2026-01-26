import { NextResponse } from "next/server";
import { getDispatchBoard } from "@/lib/queries";
import { requirePermission } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await requirePermission(request, "dispatch");
  if ("response" in auth) {
    return auth.response;
  }
  const data = await getDispatchBoard();
  return NextResponse.json({ data });
}
