import { ok, requirePermission, serverError, validationError } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { globalSearchQuerySchema } from "@/lib/validators";

type CustomerResult = {
  customer_id: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  city?: string | null;
};

type JobResult = {
  job_id: string;
  service_type: string;
  scheduled_date?: string | null;
  address?: string | null;
  city?: string | null;
};

type LeadResult = {
  lead_id: string;
  first_name: string;
  last_name: string;
  estimated_job_value?: number | null;
  city?: string | null;
};

type SearchResponse = {
  customers: CustomerResult[];
  jobs: JobResult[];
  leads: LeadResult[];
};

const resultLimit = 5;

export async function GET(request: Request) {
  const auth = await requirePermission(request, ["customers", "jobs", "sales"]);
  if ("response" in auth) {
    return auth.response;
  }

  const { profile, user } = auth;
  const permissionMap = "permissions" in auth ? auth.permissions : null;
  if (!permissionMap) {
    return serverError("Permissions unavailable", "permissions_missing");
  }
  const { searchParams } = new URL(request.url);
  const parsed = globalSearchQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return validationError(parsed.error, "Invalid search query");
  }

  const search = parsed.data.q.trim();
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const like = `%${search}%`;

  const customersPromise = permissionMap.customers
    ? client
        .from("customers")
        .select("customer_id, first_name, last_name, phone, city")
        .eq("company_id", profile.company_id)
        .or(
          [
            "first_name.ilike." + like,
            "last_name.ilike." + like,
            "email.ilike." + like,
            "phone.ilike." + like,
            "address.ilike." + like,
            "city.ilike." + like,
          ].join(",")
        )
        .order("created_at", { ascending: false })
        .limit(resultLimit)
    : Promise.resolve({ data: [] as CustomerResult[], error: null });

  const jobsPromise = (() => {
    if (!permissionMap.jobs) {
      return Promise.resolve({ data: [] as JobResult[], error: null });
    }
    let query = client
      .from("jobs")
      .select("job_id, service_type, scheduled_date, address, city")
      .eq("company_id", profile.company_id)
      .or(
        [
          "service_type.ilike." + like,
          "address.ilike." + like,
          "city.ilike." + like,
        ].join(",")
      )
      .order("scheduled_date", { ascending: true })
      .limit(resultLimit);

    if (profile.role === "technician") {
      query = query.eq("technician_id", user.id);
    } else if (profile.role === "sales_rep") {
      query = query.eq("sales_rep_id", user.id);
    }
    return query;
  })();

  const leadsPromise = (() => {
    if (!permissionMap.sales) {
      return Promise.resolve({ data: [] as LeadResult[], error: null });
    }
    let query = client
      .from("leads")
      .select("lead_id, first_name, last_name, estimated_job_value, city")
      .eq("company_id", profile.company_id)
      .or(
        [
          "first_name.ilike." + like,
          "last_name.ilike." + like,
          "email.ilike." + like,
          "phone.ilike." + like,
          "address.ilike." + like,
          "city.ilike." + like,
        ].join(",")
      )
      .order("created_at", { ascending: false })
      .limit(resultLimit);

    if (profile.role === "sales_rep") {
      query = query.eq("sales_rep_id", user.id);
    }
    return query;
  })();

  const [customersResult, jobsResult, leadsResult] = await Promise.all([
    customersPromise,
    jobsPromise,
    leadsPromise,
  ]);

  if (customersResult.error || jobsResult.error || leadsResult.error) {
    return serverError("Unable to run search", "search_failed");
  }

  const responseBody: SearchResponse = {
    customers: customersResult.data ?? [],
    jobs: jobsResult.data ?? [],
    leads: leadsResult.data ?? [],
  };

  return ok(responseBody);
}
