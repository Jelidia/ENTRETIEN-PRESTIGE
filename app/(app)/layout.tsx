import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { resolvePermissions } from "@/lib/permissions";
import { getAccessTokenFromCookies } from "@/lib/session";
import { createUserClient } from "@/lib/supabaseServer";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const token = getAccessTokenFromCookies();
  const pathname = headers().get("x-original-path") ?? "/dashboard";
  if (!token) {
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  const client = createUserClient(token);
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) {
    redirect(`/login?redirect=${encodeURIComponent(pathname)}&message=session-expired`);
  }
  let initialRole: string | null = null;
  let initialPermissions = null;
  let initialCompany: { name?: string | null } | null = null;
  const { data: profile } = await client
    .from("users")
    .select("user_id, company_id, role, access_permissions")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (profile) {
    initialRole = profile.role;
    const { data: company } = await client
      .from("companies")
      .select("role_permissions, name")
      .eq("company_id", profile.company_id)
      .single();
    initialPermissions = resolvePermissions(
      profile.role,
      company?.role_permissions ?? null,
      profile.access_permissions ?? null
    );
    initialCompany = { name: company?.name ?? null };
  }

  return (
    <AppShell
      initialRole={initialRole}
      initialPermissions={initialPermissions}
      initialCompany={initialCompany}
    >
      {children}
    </AppShell>
  );
}
