import { NextResponse } from "next/server";
import { getDispatchBoard } from "@/lib/queries";
import { requireUser } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }
  const data = await getDispatchBoard();
  return NextResponse.json({ data });
}
