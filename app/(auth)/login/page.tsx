import LoginForm from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  return <LoginForm redirect={searchParams?.redirect} />;
}
