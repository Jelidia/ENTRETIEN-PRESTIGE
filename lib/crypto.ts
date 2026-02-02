import crypto from "crypto";
import { getEncryptionKey, isProd, validateEncryptionKey } from "./env";

const missingKeyMessage =
  "APP_ENCRYPTION_KEY is required in production and must be base64-encoded 32 bytes.";

const encryptionValidation = validateEncryptionKey();
if (isProd() && !encryptionValidation.key) {
  throw new Error(missingKeyMessage);
}

function requireEncryptionKey() {
  const key = getEncryptionKey();
  if (!key && isProd()) {
    throw new Error(missingKeyMessage);
  }
  return key;
}

export function encryptPayload(payload: string) {
  const encryptionKey = requireEncryptionKey();
  if (!encryptionKey) {
    return payload;
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptPayload(payload: string) {
  const encryptionKey = requireEncryptionKey();
  if (!encryptionKey) {
    return payload;
  }
  const [ivPart, tagPart, dataPart] = payload.split(":");
  if (!ivPart || !tagPart || !dataPart) {
    return "";
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey,
    Buffer.from(ivPart, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function hashCode(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function timingSafeEqualHex(left: string, right: string) {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) {
    return false;
  }
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
