import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";

export async function GET(request: Request) {
  const auth = await requirePermission(request, "dispatch");
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");

  const { data: technicians } = await client
    .from("users")
    .select("user_id, full_name")
    .eq("role", "technician")
    .limit(20);

  const { data: jobs } = await client
    .from("jobs")
    .select(
      "job_id, technician_id, address, service_type, estimated_revenue, scheduled_date, scheduled_start_time, scheduled_end_time, status"
    )
    .order("scheduled_date", { ascending: true })
    .limit(200);

  if (!technicians || !jobs) {
    return NextResponse.json({ data: [] });
  }

  const data = technicians.map((tech) => ({
    technician: tech.full_name,
    technicianId: tech.user_id,
    jobs: jobs
      .filter((job) => job.technician_id === tech.user_id)
      .map((job) => ({
        id: job.job_id,
        time: formatScheduleRange(job.scheduled_start_time, job.scheduled_end_time),
        address: job.address ?? "",
        service: job.service_type ?? "",
        price: job.estimated_revenue ? `$${job.estimated_revenue}` : "",
        status: job.status ?? "",
        scheduledDate: job.scheduled_date ?? "",
        scheduledStartTime: job.scheduled_start_time ?? "",
        scheduledEndTime: job.scheduled_end_time ?? "",
      })),
  }));

  return NextResponse.json({ data });
}

function formatScheduleRange(start?: string | null, end?: string | null) {
  if (!start && !end) return "";
  const safeStart = start ? start.slice(0, 5) : "";
  const safeEnd = end ? end.slice(0, 5) : "";
  if (safeStart && safeEnd) {
    return `${safeStart}-${safeEnd}`;
  }
  return safeStart || safeEnd;
}
