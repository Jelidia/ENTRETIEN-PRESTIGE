import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { availabilityUpdateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

// GET /api/users/[id]/availability - Get user's availability
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(request, ["admin", "manager", "technician"], ["team"]);
  if ("response" in auth) return auth.response;

  const { profile, user } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");

  // Technicians can only view their own availability
  if (profile.role === "technician" && params.id !== user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez voir que votre propre disponibilité" },
      { status: 403 }
    );
  }

  // Verify user exists and belongs to the same company
  const { data: targetUser, error: userError } = await client
    .from("users")
    .select("user_id, company_id")
    .eq("user_id", params.id)
    .maybeSingle();

  if (userError || !targetUser) {
    return NextResponse.json(
      { error: "Utilisateur introuvable" },
      { status: 404 }
    );
  }

  if (targetUser.company_id !== profile.company_id) {
    return NextResponse.json(
      { error: "Utilisateur introuvable" },
      { status: 404 }
    );
  }

  // Get availability
  const { data: availability, error } = await client
    .from("employee_availability")
    .select("availability_id, day_of_week, hour, is_available")
    .eq("user_id", params.id)
    .eq("company_id", profile.company_id)
    .order("day_of_week", { ascending: true })
    .order("hour", { ascending: true });

  if (error) {
    console.error("Failed to fetch availability:", error);
    return NextResponse.json(
      { error: "Échec du chargement de la disponibilité" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    availability: availability ?? [],
  });
}

// POST /api/users/[id]/availability - Update user's availability
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(request, ["admin", "manager", "technician"], ["team"]);
  if ("response" in auth) return auth.response;

  const { profile, user } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const ip = getRequestIp(request);

  // Technicians can only update their own availability
  if (profile.role === "technician" && params.id !== user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez modifier que votre propre disponibilité" },
      { status: 403 }
    );
  }

  // Verify user exists and belongs to the same company
  const { data: targetUser, error: userError } = await client
    .from("users")
    .select("user_id, company_id")
    .eq("user_id", params.id)
    .maybeSingle();

  if (userError || !targetUser) {
    return NextResponse.json(
      { error: "Utilisateur introuvable" },
      { status: 404 }
    );
  }

  if (targetUser.company_id !== profile.company_id) {
    return NextResponse.json(
      { error: "Utilisateur introuvable" },
      { status: 404 }
    );
  }

  // Validate input
  const body = await request.json();
  const validation = availabilityUpdateSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Données invalides", details: validation.error.format() },
      { status: 400 }
    );
  }

  const { availability } = validation.data;
  const idempotency = await beginIdempotency(client, request, user.id, validation.data);
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ error: "Request already in progress" }, { status: 409 });
  }

  // Delete existing availability
  await client
    .from("employee_availability")
    .delete()
    .eq("user_id", params.id)
    .eq("company_id", profile.company_id);

  // Insert new availability (only for slots marked as available)
  const availableSlots = availability
    .filter((slot) => slot.is_available)
    .map((slot) => ({
      company_id: profile.company_id,
      user_id: params.id,
      day_of_week: slot.day_of_week,
      hour: slot.hour,
      is_available: true,
    }));

  if (availableSlots.length > 0) {
    const { error: insertError } = await client
      .from("employee_availability")
      .insert(availableSlots);

    if (insertError) {
      console.error("Failed to save availability:", insertError);
      return NextResponse.json(
        { error: "Échec de l'enregistrement de la disponibilité" },
        { status: 500 }
      );
    }
  }

  await logAudit(client, user.id, "availability_update", "user", params.id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: { slots: availableSlots.length },
  });

  const responseBody = {
    success: true,
    count: availableSlots.length,
  };
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return NextResponse.json(responseBody);
}
