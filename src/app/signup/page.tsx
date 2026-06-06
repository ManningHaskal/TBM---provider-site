import { SignupForm } from "@/components/signup-form";
import { validateInviteToken } from "@/lib/actions/auth";

type SignupPageProps = {
  searchParams: Promise<{ invite?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const inviteToken = params.invite?.trim() ?? "";
  const inviteValid = inviteToken ? await validateInviteToken(inviteToken) : false;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <SignupForm inviteToken={inviteToken} inviteValid={inviteValid} />
    </div>
  );
}
