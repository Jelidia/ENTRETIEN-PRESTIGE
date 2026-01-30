import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { emptyQuerySchema } from "@/lib/validators";

export async function GET(request: Request) {
  const auth = await requireRole(request, ["admin", "manager"], "reports");
  if ("response" in auth) {
    return auth.response;
  }

  const queryResult = emptyQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!queryResult.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");

  const { data, error } = await client.from("jobs").select("job_id, service_type, status, scheduled_date, estimated_revenue");
  if (error || !data) {
    return NextResponse.json({ error: "Unable to export" }, { status: 400 });
  }

  const header = "job_id,service_type,status,scheduled_date,estimated_revenue";
  const rows = data.map((row) =>
    [row.job_id, row.service_type, row.status, row.scheduled_date, row.estimated_revenue].join(",")
  );
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=jobs.csv",
    },
  });
}
