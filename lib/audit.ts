type AuditStatus = "success" | "failed" | "denied";

import type { SupabaseClient } from "@supabase/supabase-js";

type AuditOptions = {
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  reason?: string | null;
};

export async function logAudit(
  client: Pick<SupabaseClient, "from">,
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null,
  status: AuditStatus,
  options?: AuditOptions
) {
  await client.from("user_audit_log").insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    status,
    old_values: options?.oldValues ?? null,
    new_values: options?.newValues ?? null,
    ip_address: options?.ipAddress ?? null,
    user_agent: options?.userAgent ?? null,
    reason: options?.reason ?? null,
  });
}
