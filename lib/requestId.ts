export const REQUEST_ID_HEADER = "x-request-id";

export function generateRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getRequestId(request: Request) {
  return request.headers.get(REQUEST_ID_HEADER) ?? generateRequestId();
}

export function getRequestContext(
  request: Request,
  extra: Record<string, unknown> = {}
) {
  return {
    request_id: getRequestId(request),
    route: new URL(request.url).pathname,
    ...extra,
  };
}
