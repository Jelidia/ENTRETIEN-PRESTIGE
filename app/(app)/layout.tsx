import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
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
  return <AppShell>{children}</AppShell>;
}
