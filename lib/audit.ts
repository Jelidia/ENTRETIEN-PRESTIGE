export async function logAudit(
  client: { from: (table: string) => any },
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  status: "success" | "failed" | "denied"
) {
  await client.from("user_audit_log").insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    status,
  });
}
