type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

type SerializedError = {
  name?: string;
  message?: string;
  stack?: string;
};

function isError(value: unknown): value is Error {
  return value instanceof Error;
}

export function serializeError(error: unknown): SerializedError {
  if (!isError(error)) {
    return { message: String(error) };
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}

function normalizeContext(context: LogContext = {}) {
  const normalized: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    normalized[key] = isError(value) ? serializeError(value) : value;
  }
  return normalized;
}

function writeLog(level: LogLevel, message: string, context?: LogContext) {
  const payload = {
    level,
    message,
    time: new Date().toISOString(),
    ...normalizeContext(context),
  };
  const output = JSON.stringify(payload);
  if (level === "error") {
    console.error(output);
    return;
  }
  console.log(output);
}

export const logger = {
  debug(message: string, context?: LogContext) {
    writeLog("debug", message, context);
  },
  info(message: string, context?: LogContext) {
    writeLog("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    writeLog("warn", message, context);
  },
  error(message: string, context?: LogContext) {
    writeLog("error", message, context);
  },
  withContext(baseContext: LogContext) {
    return {
      debug(message: string, context?: LogContext) {
        writeLog("debug", message, { ...baseContext, ...context });
      },
      info(message: string, context?: LogContext) {
        writeLog("info", message, { ...baseContext, ...context });
      },
      warn(message: string, context?: LogContext) {
        writeLog("warn", message, { ...baseContext, ...context });
      },
      error(message: string, context?: LogContext) {
        writeLog("error", message, { ...baseContext, ...context });
      },
    };
  },
};
