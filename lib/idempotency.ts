import { hashCode } from "@/lib/crypto";
import { getRequestIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { getRequestContext } from "@/lib/requestId";

type IdempotencyState =
  | { action: "proceed"; scope: string; requestHash: string }
  | { action: "replay"; status: number; body: unknown }
  | { action: "conflict" }
  | { action: "in_progress" };

type IdempotencyClient = {
  from: (table: string) => any;
};

function getHeaderValue(request: Request) {
  return (
    request.headers.get("idempotency-key") ??
    request.headers.get("Idempotency-Key") ??
    request.headers.get("x-idempotency-key")
  );
}

export function getIdempotencyScope(request: Request, userId?: string | null) {
  if (userId) {
    return `user:${userId}`;
  }

  const ip = getRequestIp(request);
  const userAgent = request.headers.get("user-agent") ?? "";
  return `ip:${hashCode(`${ip}|${userAgent}`)}`;
}

export function getIdempotencyRequestHash(payload: unknown) {
  return hashCode(JSON.stringify(payload ?? {}));
}

export async function beginIdempotency(
  client: IdempotencyClient,
  request: Request,
  userId: string | null | undefined,
  payload: unknown
): Promise<IdempotencyState> {
  const key = getHeaderValue(request);
  if (!key) {
    return { action: "proceed", scope: "", requestHash: "" };
  }

  const scope = getIdempotencyScope(request, userId ?? null);
  const requestHash = getIdempotencyRequestHash(payload);

  const { data, error } = await client
    .from("idempotency_keys")
    .select("request_hash, response_status, response_body, status")
    .eq("idempotency_key", key)
    .eq("scope", scope)
    .maybeSingle();

  if (error) {
    logger.error(
      "Idempotency lookup failed",
      getRequestContext(request, {
        idempotency_key: key,
        scope,
        error,
      })
    );
    return { action: "proceed", scope, requestHash };
  }

  if (data) {
    if (data.request_hash !== requestHash) {
      return { action: "conflict" };
    }
    if (data.status === "completed" && data.response_body) {
      return { action: "replay", status: data.response_status ?? 200, body: data.response_body };
    }
    return { action: "in_progress" };
  }

  const { error: insertError } = await client.from("idempotency_keys").insert({
    idempotency_key: key,
    scope,
    request_hash: requestHash,
    status: "processing",
  });

  if (insertError) {
    logger.error(
      "Idempotency insert failed",
      getRequestContext(request, {
        idempotency_key: key,
        scope,
        error: insertError,
      })
    );
  }

  return { action: "proceed", scope, requestHash };
}

export async function completeIdempotency(
  client: IdempotencyClient,
  request: Request,
  scope: string,
  requestHash: string,
  responseBody: unknown,
  status: number
) {
  const key = getHeaderValue(request);
  if (!key || !scope || !requestHash) {
    return;
  }

  const { error } = await client
    .from("idempotency_keys")
    .update({
      status: "completed",
      response_body: responseBody,
      response_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("idempotency_key", key)
    .eq("scope", scope)
    .eq("request_hash", requestHash);

  if (error) {
    logger.error(
      "Idempotency completion failed",
      getRequestContext(request, {
        idempotency_key: key,
        scope,
        error,
      })
    );
  }
}
