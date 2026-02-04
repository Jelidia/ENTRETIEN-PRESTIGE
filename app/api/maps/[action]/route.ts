import { NextResponse } from "next/server";
import { geocodeAddress, getDistanceMatrix } from "@/lib/maps";
import { requirePermission } from "@/lib/auth";
import {
  mapsActionParamSchema,
  mapsDistanceQuerySchema,
  mapsGeocodeQuerySchema,
  mapsTerritoryQuerySchema,
} from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: { action: string } }
) {
  const auth = await requirePermission(request, "dispatch");
  if ("response" in auth) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const paramsResult = mapsActionParamSchema.safeParse(params);
  if (!paramsResult.success) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
  const action = paramsResult.data.action;
  const query = Object.fromEntries(searchParams);

  if (action === "geocode") {
    const queryResult = mapsGeocodeQuerySchema.safeParse(query);
    if (!queryResult.success) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }
    const { address } = queryResult.data;
    const data = await geocodeAddress(address);
    return NextResponse.json({ success: true, data });
  }

  if (action === "distance") {
    const queryResult = mapsDistanceQuerySchema.safeParse(query);
    if (!queryResult.success) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }
    const { origins, destinations } = queryResult.data;
    const data = await getDistanceMatrix(origins, destinations);
    return NextResponse.json({ success: true, data });
  }

  if (action === "territory") {
    const queryResult = mapsTerritoryQuerySchema.safeParse(query);
    if (!queryResult.success) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }
    const { polygon } = queryResult.data;
    return NextResponse.json({ success: true, data: { polygon }, polygon });
  }

  return NextResponse.json({ success: false, error: "Unsupported action" }, { status: 400 });
}
