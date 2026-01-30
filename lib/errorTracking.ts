import { isProd } from "@/lib/env";
import { logger, serializeError } from "@/lib/logger";

export type ErrorContext = Record<string, unknown>;

const ERROR_TRACKING_ENDPOINT = process.env.ERROR_TRACKING_ENDPOINT ?? "";
const ERROR_TRACKING_ENABLED = Boolean(ERROR_TRACKING_ENDPOINT) && isProd();

export async function captureError(error: unknown, context: ErrorContext = {}) {
  logger.error("Server error", { ...context, error: serializeError(error) });

  if (!ERROR_TRACKING_ENABLED) {
    return;
  }

  try {
    await fetch(ERROR_TRACKING_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: serializeError(error),
        context,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (trackingError) {
    logger.warn("Error tracking failed", {
      ...context,
      error: serializeError(trackingError),
    });
  }
}
