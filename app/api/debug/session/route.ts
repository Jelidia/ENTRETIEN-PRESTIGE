import { errorResponse, notFound, ok, requireRole, validationError } from "@/lib/auth";
import { getAccessTokenFromRequest } from "@/lib/session";
import { createUserClient } from "@/lib/supabaseServer";
import { emptyQuerySchema } from "@/lib/validators";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return notFound("Not found", "not_found");
  }

  const auth = await requireRole(request, ["admin"]);
  if ("response" in auth) {
    return auth.response;
  }

  const queryResult = emptyQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!queryResult.success) {
    return validationError(queryResult.error, "Invalid request");
  }

  const token = getAccessTokenFromRequest(request);

  if (!token) {
    return errorResponse(400, "session_missing", "No session token found", {
      details: {
        cookies: request.headers.get("cookie"),
        hasToken: false,
      },
    });
  }

  const client = createUserClient(token);
  const { data: userData, error: userError } = await client.auth.getUser();

  if (userError || !userData.user) {
    return errorResponse(401, "session_invalid", "Invalid session", {
      details: {
        error: userError?.message,
        hasToken: true,
        tokenValid: false,
      },
    });
  }

  const { data: profile, error: profileError } = await client
    .from("users")
    .select("user_id, email, role, full_name, company_id")
    .eq("user_id", userData.user.id)
    .single();

  if (profileError) {
    return errorResponse(500, "profile_fetch_failed", "Profile fetch failed", {
      details: {
        error: profileError.message,
        hasToken: true,
        tokenValid: true,
        canReadProfile: false,
        userId: userData.user.id,
      },
    });
  }

  const data = {
    hasToken: true,
    tokenValid: true,
    canReadProfile: true,
    user: {
      id: userData.user.id,
      email: userData.user.email,
    },
    profile: {
      user_id: profile?.user_id,
      email: profile?.email,
      role: profile?.role,
      full_name: profile?.full_name,
      company_id: profile?.company_id,
    },
  };

  return ok(data, { flatten: true });
}
