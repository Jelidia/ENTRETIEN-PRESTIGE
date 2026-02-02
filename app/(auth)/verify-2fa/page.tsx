import VerifyTwoFactorForm from "@/components/auth/VerifyTwoFactorForm";

export const dynamic = "force-dynamic";

export default function VerifyTwoFactorPage({
  searchParams,
}: {
  searchParams: { challenge?: string; redirect?: string };
}) {
  return (
    <VerifyTwoFactorForm
      challengeId={searchParams?.challenge}
      redirect={searchParams?.redirect}
    />
  );
}
