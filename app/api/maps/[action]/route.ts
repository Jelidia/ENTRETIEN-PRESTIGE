import { NextResponse } from "next/server";
import { geocodeAddress, getDistanceMatrix } from "@/lib/maps";
import { requirePermission } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { action: string } }
) {
  const auth = await requirePermission(request, "dispatch");
  if ("response" in auth) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const action = params.action;

  if (action === "geocode") {
    const address = searchParams.get("address") ?? "";
    const data = await geocodeAddress(address);
    return NextResponse.json({ data });
  }

  if (action === "distance") {
    const origins = searchParams.get("origins") ?? "";
    const destinations = searchParams.get("destinations") ?? "";
    const data = await getDistanceMatrix(origins, destinations);
    return NextResponse.json({ data });
  }

  if (action === "territory") {
    const polygon = searchParams.get("polygon") ?? "";
    return NextResponse.json({ data: { polygon } });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
