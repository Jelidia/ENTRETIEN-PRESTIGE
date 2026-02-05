import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import {
  dispatchReassignSchema,
  weatherCancelSchema,
  dispatchScheduleSchema,
  salesDayCreateSchema,
  salesDayAssignSchema,
  salesDayAutoAssignSchema,
  salesDayMasterZoneSchema,
  salesDaySubZoneSchema,
  salesDayAssignmentsQuerySchema,
  salesDayAvailabilityQuerySchema,
  salesDayQuerySchema,
} from "@/lib/validators";
import { logAudit, logJobHistory } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

type SalesRepRow = {
  user_id: string;
  full_name: string | null;
  email: string;
};

type SalesDayAssignmentInput = {
  salesRepId: string;
  overrideStartTime?: string;
  overrideMeetingAddress?: string;
  overrideMeetingCity?: string;
  overrideMeetingPostalCode?: string;
  notes?: string;
};

type SalesDayAssignmentRow = {
  assignment_id: string;
  sales_rep_id: string | null;
  override_start_time?: string | null;
  override_meeting_address?: string | null;
  override_meeting_city?: string | null;
  override_meeting_postal_code?: string | null;
  notes_override?: string | null;
  sub_polygon_coordinates?: unknown;
};

type SalesClient = ReturnType<typeof createUserClient>;

type JobHistorySnapshot = {
  status: string | null;
  technician_id: string | null;
  scheduled_date: string | null;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
};

async function fetchJobHistorySnapshot(
  client: SalesClient,
  jobId: string,
  companyId: string
) {
  const { data } = await client
    .from("jobs")
    .select("status, technician_id, scheduled_date, scheduled_start_time, scheduled_end_time")
    .eq("job_id", jobId)
    .eq("company_id", companyId)
    .maybeSingle();
  return (data as JobHistorySnapshot | null) ?? null;
}

export async function POST(
  request: Request,
  { params }: { params: { action: string } }
) {
  const action = params.action;
  const isSalesDayAction = action.startsWith("sales-day");
  const auth = await requireRole(
    request,
    isSalesDayAction ? ["admin", "manager"] : ["admin", "manager", "dispatcher"],
    isSalesDayAction ? "sales" : "dispatch"
  );
  if ("response" in auth) {
    return auth.response;
  }
  const { profile, user } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const body = await request.json().catch(() => null);
  const ip = getRequestIp(request);

  if (action === "sales-day-create") {
    const parsed = salesDayCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid sales day" }, { status: 400 });
    }
    if (!isWithinNextWeek(parsed.data.salesDayDate)) {
      return NextResponse.json({ success: false, error: "La date doit être dans les 7 prochains jours" }, { status: 400 });
    }
    if (!isValidTimeRange(parsed.data.startTime, parsed.data.endTime)) {
      return NextResponse.json({ success: false, error: "Les heures sont invalides" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      action: "sales-day-create",
      payload: parsed.data,
    });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
    }
    if (idempotency.action === "in_progress") {
      return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
    }

    const { error, data } = await client
      .from("sales_days")
      .insert({
        company_id: profile.company_id,
        sales_day_date: parsed.data.salesDayDate,
        start_time: parsed.data.startTime,
        end_time: parsed.data.endTime,
        meeting_address: parsed.data.meetingAddress ?? null,
        meeting_city: parsed.data.meetingCity ?? null,
        meeting_postal_code: parsed.data.meetingPostalCode ?? null,
        notes: parsed.data.notes ?? null,
        master_polygon_coordinates: parsed.data.masterPolygonCoordinates ?? null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Impossible de créer la journée" }, { status: 400 });
    }

    await logAudit(client, profile.user_id, "sales_day_create", "sales_day", data.sales_day_id, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { sales_day_date: parsed.data.salesDayDate },
    });

    const responseBody = { success: true, data, ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 201);
    return NextResponse.json(responseBody, { status: 201 });
  }

  if (action === "sales-day-assign") {
    const parsed = salesDayAssignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid assignment" }, { status: 400 });
    }

    const { data: day } = await client
      .from("sales_days")
      .select("sales_day_date, start_time, end_time")
      .eq("sales_day_id", parsed.data.salesDayId)
      .eq("company_id", profile.company_id)
      .single();

    if (!day) {
      return NextResponse.json({ success: false, error: "Journée introuvable" }, { status: 404 });
    }
    if (!day.start_time || !day.end_time) {
      return NextResponse.json({ success: false, error: "Heures manquantes" }, { status: 400 });
    }

    const repIds = parsed.data.assignments.map((assignment) => assignment.salesRepId);
    const { data: reps } = await client
      .from("users")
      .select("user_id, role")
      .eq("company_id", profile.company_id)
      .in("user_id", repIds);

    const repMap = new Map((reps ?? []).map((rep) => [rep.user_id, rep.role]));
    const invalidRep = repIds.find((repId) => repMap.get(repId) !== "sales_rep");
    if (invalidRep) {
      return NextResponse.json({ success: false, error: "Vendeur invalide" }, { status: 400 });
    }

    const availabilityCache = new Map<string, Set<string>>();
    for (const assignment of parsed.data.assignments) {
      const startTime = assignment.overrideStartTime ?? day.start_time;
      const endTime = day.end_time;
      if (!isValidTimeRange(startTime, endTime)) {
        return NextResponse.json({ success: false, error: "Les heures sont invalides" }, { status: 400 });
      }
      const cacheKey = `${startTime}-${endTime}`;
      if (!availabilityCache.has(cacheKey)) {
        const available = await resolveAvailableSalesReps(
          client,
          profile.company_id,
          day.sales_day_date,
          startTime,
          endTime
        );
        availabilityCache.set(cacheKey, new Set(available.map((rep) => rep.user_id)));
      }
      const availableIds = availabilityCache.get(cacheKey);
      if (!availableIds?.has(assignment.salesRepId)) {
        return NextResponse.json({ success: false, error: "Vendeur indisponible" }, { status: 400 });
      }
    }

    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      action: "sales-day-assign",
      payload: parsed.data,
    });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
    }
    if (idempotency.action === "in_progress") {
      return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
    }

    const assignments: SalesDayAssignmentInput[] = parsed.data.assignments;
    const rows = assignments.map((assignment) => ({
      company_id: profile.company_id,
      sales_day_id: parsed.data.salesDayId,
      sales_rep_id: assignment.salesRepId,
      override_start_time: assignment.overrideStartTime ?? null,
      override_meeting_address: assignment.overrideMeetingAddress ?? null,
      override_meeting_city: assignment.overrideMeetingCity ?? null,
      override_meeting_postal_code: assignment.overrideMeetingPostalCode ?? null,
      notes_override: assignment.notes ?? null,
    }));

    const { error } = await client
      .from("sales_day_assignments")
      .upsert(rows, { onConflict: "sales_day_id,sales_rep_id" });

    if (error) {
      return NextResponse.json({ success: false, error: "Impossible d'assigner les vendeurs" }, { status: 400 });
    }

    await logAudit(client, profile.user_id, "sales_day_assign", "sales_day", parsed.data.salesDayId, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { assignments: rows.length },
    });

    const responseBody = { success: true, data: { ok: true }, ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "sales-day-auto-assign") {
    const parsed = salesDayAutoAssignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      action: "sales-day-auto-assign",
      payload: parsed.data,
    });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
    }
    if (idempotency.action === "in_progress") {
      return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
    }

    const { data: day } = await client
      .from("sales_days")
      .select("sales_day_date, start_time, end_time")
      .eq("sales_day_id", parsed.data.salesDayId)
      .eq("company_id", profile.company_id)
      .single();

    if (!day) {
      return NextResponse.json({ success: false, error: "Journée introuvable" }, { status: 404 });
    }
    if (!isValidTimeRange(day.start_time, day.end_time)) {
      return NextResponse.json({ success: false, error: "Les heures sont invalides" }, { status: 400 });
    }

    const available = await resolveAvailableSalesReps(client, profile.company_id, day.sales_day_date, day.start_time, day.end_time);
    const rows = available.map((rep) => ({
      company_id: profile.company_id,
      sales_day_id: parsed.data.salesDayId,
      sales_rep_id: rep.user_id,
    }));

    const { error } = await client
      .from("sales_day_assignments")
      .upsert(rows, { onConflict: "sales_day_id,sales_rep_id" });

    if (error) {
      return NextResponse.json({ success: false, error: "Impossible d'assigner les disponibilités" }, { status: 400 });
    }

    await logAudit(client, profile.user_id, "sales_day_auto_assign", "sales_day", parsed.data.salesDayId, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { assigned: rows.length },
    });

    const responseBody = { success: true, data: { assigned: rows.length }, assigned: rows.length };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "sales-day-master-zone") {
    const parsed = salesDayMasterZoneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid zone" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      action: "sales-day-master-zone",
      payload: parsed.data,
    });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
    }
    if (idempotency.action === "in_progress") {
      return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
    }

    const { error } = await client
      .from("sales_days")
      .update({ master_polygon_coordinates: parsed.data.polygonCoordinates })
      .eq("sales_day_id", parsed.data.salesDayId)
      .eq("company_id", profile.company_id);

    if (error) {
      return NextResponse.json({ success: false, error: "Impossible de sauvegarder la zone" }, { status: 400 });
    }

    await logAudit(client, profile.user_id, "sales_day_master_zone", "sales_day", parsed.data.salesDayId, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
    });

    const responseBody = { success: true, data: { ok: true }, ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "sales-day-sub-zone") {
    const parsed = salesDaySubZoneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid zone" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      action: "sales-day-sub-zone",
      payload: parsed.data,
    });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
    }
    if (idempotency.action === "in_progress") {
      return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
    }

    const { error } = await client
      .from("sales_day_assignments")
      .update({ sub_polygon_coordinates: parsed.data.polygonCoordinates })
      .eq("assignment_id", parsed.data.assignmentId)
      .eq("company_id", profile.company_id);

    if (error) {
      return NextResponse.json({ success: false, error: "Impossible de sauvegarder la zone" }, { status: 400 });
    }

    await logAudit(client, profile.user_id, "sales_day_sub_zone", "sales_day_assignment", parsed.data.assignmentId, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
    });

    const responseBody = { success: true, data: { ok: true }, ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "reassign") {
    const parsed = dispatchReassignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    const snapshot = await fetchJobHistorySnapshot(client, parsed.data.jobId, profile.company_id);

    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      action: "reassign",
      payload: parsed.data,
    });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
    }
    if (idempotency.action === "in_progress") {
      return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
    }

    const { error } = await client
      .from("jobs")
      .update({ technician_id: parsed.data.technicianId, status: "dispatched" })
      .eq("job_id", parsed.data.jobId)
      .eq("company_id", profile.company_id);

    if (error) {
      return NextResponse.json({ success: false, error: "Unable to reassign" }, { status: 400 });
    }

    await logJobHistory(client, parsed.data.jobId, profile.user_id, [
      {
        fieldName: "technician_id",
        oldValue: snapshot?.technician_id ?? null,
        newValue: parsed.data.technicianId,
        reason: "dispatch_reassign",
      },
      {
        fieldName: "status",
        oldValue: snapshot?.status ?? null,
        newValue: "dispatched",
        reason: "dispatch_reassign",
      },
    ]);

    await logAudit(client, profile.user_id, "dispatch_reassign", "job", parsed.data.jobId, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { technician_id: parsed.data.technicianId },
    });

    const responseBody = { success: true, data: { ok: true }, ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "schedule") {
    const parsed = dispatchScheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid schedule" }, { status: 400 });
    }

    const snapshot = await fetchJobHistorySnapshot(client, parsed.data.jobId, profile.company_id);

    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      action: "schedule",
      payload: parsed.data,
    });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
    }
    if (idempotency.action === "in_progress") {
      return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
    }

    const updates: Record<string, string> = {
      scheduled_date: parsed.data.scheduledDate,
      scheduled_start_time: parsed.data.scheduledStartTime,
      scheduled_end_time: parsed.data.scheduledEndTime,
    };

    if (parsed.data.technicianId) {
      updates.technician_id = parsed.data.technicianId;
    }

    const { error } = await client
      .from("jobs")
      .update(updates)
      .eq("job_id", parsed.data.jobId)
      .eq("company_id", profile.company_id);

    if (error) {
      return NextResponse.json({ success: false, error: "Unable to update schedule" }, { status: 400 });
    }

    const historyEntries = [
      {
        fieldName: "scheduled_date",
        oldValue: snapshot?.scheduled_date ?? null,
        newValue: parsed.data.scheduledDate,
        reason: "dispatch_schedule",
      },
      {
        fieldName: "scheduled_start_time",
        oldValue: snapshot?.scheduled_start_time ?? null,
        newValue: parsed.data.scheduledStartTime,
        reason: "dispatch_schedule",
      },
      {
        fieldName: "scheduled_end_time",
        oldValue: snapshot?.scheduled_end_time ?? null,
        newValue: parsed.data.scheduledEndTime,
        reason: "dispatch_schedule",
      },
    ];
    if (parsed.data.technicianId) {
      historyEntries.push({
        fieldName: "technician_id",
        oldValue: snapshot?.technician_id ?? null,
        newValue: parsed.data.technicianId,
        reason: "dispatch_schedule",
      });
    }

    await logJobHistory(client, parsed.data.jobId, profile.user_id, historyEntries);

    await logAudit(client, profile.user_id, "dispatch_schedule", "job", parsed.data.jobId, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: updates,
    });

    const responseBody = { success: true, data: { ok: true }, ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "auto-assign") {
    const idempotency = await beginIdempotency(client, request, profile.user_id, { action: "auto-assign" });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
    }
    if (idempotency.action === "in_progress") {
      return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
    }
    const { data: technicians } = await client
      .from("users")
      .select("user_id")
      .eq("company_id", profile.company_id)
      .eq("role", "technician")
      .limit(10);

    const { data: jobs } = await client
      .from("jobs")
      .select("job_id, status, technician_id")
      .is("technician_id", null)
      .eq("company_id", profile.company_id)
      .limit(10);

    if (!technicians || !jobs) {
      return NextResponse.json({ success: true, data: { ok: true }, ok: true });
    }

    for (let i = 0; i < jobs.length; i += 1) {
      const tech = technicians[i % technicians.length];
      await client
        .from("jobs")
        .update({ technician_id: tech.user_id, status: "dispatched" })
        .eq("job_id", jobs[i].job_id)
        .eq("company_id", profile.company_id);
      await logJobHistory(client, jobs[i].job_id, profile.user_id, [
        {
          fieldName: "technician_id",
          oldValue: jobs[i].technician_id ?? null,
          newValue: tech.user_id,
          reason: "dispatch_auto_assign",
        },
        {
          fieldName: "status",
          oldValue: jobs[i].status ?? null,
          newValue: "dispatched",
          reason: "dispatch_auto_assign",
        },
      ]);
    }

    await logAudit(client, profile.user_id, "dispatch_auto_assign", "job", null, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { assigned: jobs.length },
    });

    const responseBody = {
      success: true,
      data: { ok: true, assigned: jobs.length },
      ok: true,
      assigned: jobs.length,
    };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "weather-cancel") {
    const parsed = weatherCancelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    const { data: affectedJobs } = await client
      .from("jobs")
      .select("job_id, status")
      .eq("company_id", profile.company_id)
      .gte("scheduled_date", parsed.data.startDate)
      .lte("scheduled_date", parsed.data.endDate);

    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      action: "weather-cancel",
      payload: parsed.data,
    });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
    }
    if (idempotency.action === "in_progress") {
      return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
    }

    const { error } = await client
      .from("jobs")
      .update({ status: "cancelled" })
      .gte("scheduled_date", parsed.data.startDate)
      .lte("scheduled_date", parsed.data.endDate)
      .eq("company_id", profile.company_id);

    if (error) {
      return NextResponse.json({ success: false, error: "Unable to cancel jobs" }, { status: 400 });
    }

    if (affectedJobs?.length) {
      await Promise.all(
        affectedJobs.map((job) =>
          logJobHistory(client, job.job_id, profile.user_id, [
            {
              fieldName: "status",
              oldValue: job.status ?? null,
              newValue: "cancelled",
              reason: "weather_cancel",
            },
          ])
        )
      );
    }

    await logAudit(client, profile.user_id, "dispatch_weather_cancel", "job", null, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { start_date: parsed.data.startDate, end_date: parsed.data.endDate },
    });

    const responseBody = { success: true, data: { ok: true }, ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  return NextResponse.json({ success: false, error: "Unsupported action" }, { status: 400 });
}

const dayOrder: DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function resolveDayOfWeek(value: string): DayOfWeek | null {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return dayOrder[parsed.getDay()] ?? null;
}

function parseHour(value: string) {
  const hourString = value.split(":")[0];
  if (!hourString) {
    return null;
  }
  const hour = Number(hourString);
  if (Number.isNaN(hour)) {
    return null;
  }
  return hour;
}

function isValidTimeRange(startTime: string, endTime: string) {
  const startHour = parseHour(startTime);
  const endHour = parseHour(endTime);
  if (startHour === null || endHour === null) {
    return false;
  }
  return endHour > startHour;
}

function buildHourRange(startTime: string, endTime: string) {
  const startHour = parseHour(startTime);
  const endHour = parseHour(endTime);
  if (startHour === null || endHour === null || endHour <= startHour) {
    return [] as number[];
  }
  const hours: number[] = [];
  for (let hour = startHour; hour < endHour; hour += 1) {
    hours.push(hour);
  }
  return hours;
}

function isWithinNextWeek(value: string) {
  const target = new Date(`${value}T00:00:00`);
  if (Number.isNaN(target.getTime())) {
    return false;
  }
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffMs = target.getTime() - start.getTime();
  const diffDays = diffMs / (24 * 60 * 60 * 1000);
  return diffDays >= 0 && diffDays <= 7;
}

async function resolveAvailableSalesReps(
  client: SalesClient,
  companyId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<SalesRepRow[]> {
  const dayOfWeek = resolveDayOfWeek(date);
  if (!dayOfWeek) {
    return [];
  }
  const hours = buildHourRange(startTime, endTime);
  const { data: reps } = await client
    .from("users")
    .select("user_id, full_name, email")
    .eq("company_id", companyId)
    .eq("role", "sales_rep");

  if (!reps?.length) {
    return [];
  }

  if (!hours.length) {
    return reps as SalesRepRow[];
  }

  const repIds = reps.map((rep) => rep.user_id);
  const { data: slots } = await client
    .from("employee_availability")
    .select("user_id, hour, is_available")
    .eq("company_id", companyId)
    .eq("day_of_week", dayOfWeek)
    .in("user_id", repIds)
    .in("hour", hours);

  const availabilityMap = new Map<string, Set<number>>();
  (slots ?? []).forEach((slot) => {
    if (!slot.is_available) {
      return;
    }
    const existing = availabilityMap.get(slot.user_id) ?? new Set<number>();
    existing.add(slot.hour);
    availabilityMap.set(slot.user_id, existing);
  });

  return reps.filter((rep) => {
    const availableHours = availabilityMap.get(rep.user_id);
    if (!availableHours) {
      return false;
    }
    return hours.every((hour) => availableHours.has(hour));
  }) as SalesRepRow[];
}

export async function GET(
  request: Request,
  { params }: { params: { action: string } }
) {
  const action = params.action;
  const isSalesDayAction = action.startsWith("sales-day") || action === "sales-availability";
  const auth = await requireRole(
    request,
    isSalesDayAction ? ["admin", "manager", "sales_rep"] : ["admin", "manager", "dispatcher"],
    isSalesDayAction ? "sales" : "dispatch"
  );
  if ("response" in auth) {
    return auth.response;
  }
  const { profile, user } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");

  if (action === "sales-days") {
    const queryResult = salesDayQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!queryResult.success) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    if (profile.role === "sales_rep") {
      const { data, error } = await client
        .from("sales_day_assignments")
        .select(
          "assignment_id, sales_rep_id, override_start_time, override_meeting_address, override_meeting_city, override_meeting_postal_code, notes_override, sub_polygon_coordinates, sales_days (sales_day_id, sales_day_date, start_time, end_time, meeting_address, meeting_city, meeting_postal_code, notes, master_polygon_coordinates)"
        )
        .eq("company_id", profile.company_id)
        .eq("sales_rep_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ success: false, error: "Impossible de charger les journées" }, { status: 400 });
      }

      return NextResponse.json({ success: true, data: data ?? [] });
    }

    let query = client.from("sales_days").select("*").eq("company_id", profile.company_id);
    if (queryResult.data.from) {
      query = query.gte("sales_day_date", queryResult.data.from);
    }
    if (queryResult.data.to) {
      query = query.lte("sales_day_date", queryResult.data.to);
    }
    const { data, error } = await query.order("sales_day_date", { ascending: true });
    if (error) {
      return NextResponse.json({ success: false, error: "Impossible de charger les journées" }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: data ?? [] });
  }

  if (action === "sales-day-assignments") {
    if (profile.role === "sales_rep") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const queryResult = salesDayAssignmentsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!queryResult.success) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    const { data: assignments, error } = await client
      .from("sales_day_assignments")
      .select("assignment_id, sales_rep_id, override_start_time, override_meeting_address, override_meeting_city, override_meeting_postal_code, notes_override, sub_polygon_coordinates")
      .eq("company_id", profile.company_id)
      .eq("sales_day_id", queryResult.data.salesDayId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: "Impossible de charger les assignations" }, { status: 400 });
    }

    const rawAssignments = (assignments ?? []) as SalesDayAssignmentRow[];
    const repIds = rawAssignments
      .map((assignment) => assignment.sales_rep_id)
      .filter((value): value is string => Boolean(value));
    const { data: reps } = repIds.length
      ? await client.from("users").select("user_id, full_name, email").in("user_id", repIds)
      : { data: [] };
    const repMap = new Map((reps ?? []).map((rep) => [rep.user_id, rep]));

    const enriched = rawAssignments.map((assignment) => ({
      ...assignment,
      sales_rep: repMap.get(assignment.sales_rep_id ?? "") ?? null,
    }));

    return NextResponse.json({ success: true, data: enriched });
  }

  if (action === "sales-availability") {
    if (profile.role === "sales_rep") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const queryResult = salesDayAvailabilityQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!queryResult.success) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }
    if (!isWithinNextWeek(queryResult.data.date)) {
      return NextResponse.json({ success: false, error: "La date doit être dans les 7 prochains jours" }, { status: 400 });
    }
    if (!isValidTimeRange(queryResult.data.startTime, queryResult.data.endTime)) {
      return NextResponse.json({ success: false, error: "Les heures sont invalides" }, { status: 400 });
    }

    const { data: reps } = await client
      .from("users")
      .select("user_id, full_name, email")
      .eq("company_id", profile.company_id)
      .eq("role", "sales_rep")
      .order("full_name", { ascending: true });

    const available = await resolveAvailableSalesReps(
      client,
      profile.company_id,
      queryResult.data.date,
      queryResult.data.startTime,
      queryResult.data.endTime
    );
    const availableIds = new Set(available.map((rep) => rep.user_id));

    const payload = (reps ?? []).map((rep) => ({
      user_id: rep.user_id,
      full_name: rep.full_name,
      email: rep.email,
      available: availableIds.has(rep.user_id),
    }));

    return NextResponse.json({ success: true, data: payload });
  }

  if (action === "conflicts") {
    const { data, error } = await client
      .from("jobs")
      .select("job_id, technician_id, scheduled_date, scheduled_start_time, scheduled_end_time")
      .not("technician_id", "is", null)
      .order("scheduled_date", { ascending: true });

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Unable to load conflicts" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  }

  return NextResponse.json({ success: false, error: "Unsupported action" }, { status: 400 });
}
