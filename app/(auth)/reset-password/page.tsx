import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  return <ResetPasswordForm code={searchParams?.code} />;
}
