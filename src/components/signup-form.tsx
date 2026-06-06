"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";

const initialState: AuthActionState = {};

type SignupFormProps = {
  inviteToken?: string;
  inviteValid: boolean;
};

export function SignupForm({ inviteToken, inviteValid }: SignupFormProps) {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  if (!inviteValid || !inviteToken) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 text-center">
        <Logo size="lg" showTagline />
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          Account creation requires a valid invite link from your TexBioMed representative.
        </div>
        <Link href="/" className="text-sm font-medium text-teal-800 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8">
      <Logo size="lg" showTagline />
      <form action={formAction} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <input type="hidden" name="invite" value={inviteToken} />
        <h1 className="mb-2 text-xl font-semibold text-slate-900">Create account</h1>
        <p className="mb-6 text-sm text-slate-600">
          Complete your provider profile to start placing orders.
        </p>
        <div className="flex flex-col gap-4">
          <Input label="Full name" name="full_name" required />
          <Input label="Practice name" name="practice_name" required />
          <Input label="Email" name="email" type="email" autoComplete="email" required />
          <Input label="Phone (optional)" name="phone" type="tel" />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          {state.error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              {state.success}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Creating account..." : "Create account"}
          </Button>
        </div>
      </form>
    </div>
  );
}
