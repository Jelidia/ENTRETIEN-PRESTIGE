import { geocodeAddress, getDistanceMatrix } from "@/lib/maps";
import { NextResponse } from "next/server";
import {
  badRequest,
  conflict,
  forbidden,
  ok,
  okBody,
  requirePermission,
  requireRole,
  serverError,
  validationError,
} from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import {
  mapsActionParamSchema,
  mapsDistanceQuerySchema,
  mapsGeocodeQuerySchema,
  territoryCreateSchema,
} from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: { action: string } }
) {
  const auth = await requirePermission(request, ["dispatch", "sales", "reports"]);
  if ("response" in auth) {
    return auth.response;
  }
  const { profile, user } = auth;

  const { searchParams } = new URL(request.url);
  const paramsResult = mapsActionParamSchema.safeParse(params);
  if (!paramsResult.success) {
    return validationError(paramsResult.error, "Invalid request");
  }
  const action = paramsResult.data.action;
  const query = Object.fromEntries(searchParams);

  if (action === "geocode") {
    const queryResult = mapsGeocodeQuerySchema.safeParse(query);
    if (!queryResult.success) {
      return validationError(queryResult.error, "Invalid request");
    }
    const { address } = queryResult.data;
    const data = await geocodeAddress(address);
    return ok(data);
  }

  if (action === "distance") {
    const queryResult = mapsDistanceQuerySchema.safeParse(query);
    if (!queryResult.success) {
      return validationError(queryResult.error, "Invalid request");
    }
    const { origins, destinations } = queryResult.data;
    const data = await getDistanceMatrix(origins, destinations);
    return ok(data);
  }

  if (action === "territory") {
    if (!["admin", "manager", "sales_rep"].includes(profile.role)) {
      return forbidden();
    }
    const token = getAccessTokenFromRequest(request);
    const client = createUserClient(token ?? "");
    let territoryQuery = client
      .from("sales_territories")
      .select("territory_id, territory_name, sales_rep_id, neighborhoods, polygon_coordinates")
      .eq("company_id", profile.company_id);
    if (profile.role === "sales_rep") {
      territoryQuery = territoryQuery.eq("sales_rep_id", user.id);
    }
    const { data, error } = await territoryQuery.order("territory_name", { ascending: true });
    if (error) {
      return serverError("Unable to load territories", "territories_load_failed");
    }
    return ok(data ?? []);
  }

  return badRequest("unsupported_action", "Unsupported action");
}

export async function POST(
  request: Request,
  { params }: { params: { action: string } }
) {
  const paramsResult = mapsActionParamSchema.safeParse(params);
  if (!paramsResult.success) {
    return validationError(paramsResult.error, "Invalid request");
  }
  if (paramsResult.data.action !== "territory") {
    return badRequest("unsupported_action", "Unsupported action");
  }

  const auth = await requireRole(request, ["admin", "manager"], "sales");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile, user } = auth;
  const body = await request.json().catch(() => null);
  const parsed = territoryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error, "Invalid territory");
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const ip = getRequestIp(request);
  const idempotency = await beginIdempotency(client, request, user.id, parsed.data);
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return conflict("idempotency_conflict", "Idempotency key conflict");
  }
  if (idempotency.action === "in_progress") {
    return conflict("idempotency_in_progress", "Request already in progress");
  }

  const { territoryName, salesRepId, neighborhoods, polygonCoordinates } = parsed.data;
  const { error } = await client.from("sales_territories").insert({
    company_id: profile.company_id,
    territory_name: territoryName,
    sales_rep_id: salesRepId,
    neighborhoods: neighborhoods ?? null,
    polygon_coordinates: polygonCoordinates ?? null,
  });

  if (error) {
    return serverError("Unable to create territory", "territory_create_failed");
  }

  await logAudit(client, user.id, "sales_territory_create", "sales_territory", null, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: { territory_name: territoryName, sales_rep_id: salesRepId },
  });

  const responseBody = { ok: true, territory: territoryName };
  const storedBody = okBody(responseBody, { flatten: true });
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, storedBody, 201);
  return ok(responseBody, { status: 201, flatten: true });
}
