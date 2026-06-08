"use client";

import { useActionState, useState } from "react";
import { signupAction, type AuthActionState } from "@/lib/actions/auth";
import { AddressFields } from "@/components/address-fields";
import { TextLink } from "@/components/ui/link-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { emptyStructuredAddress } from "@/lib/shipping/address-model";

const initialState: AuthActionState = {};

type SignupFormProps = {
  inviteToken?: string;
  inviteValid: boolean;
};

export function SignupForm({ inviteToken, inviteValid }: SignupFormProps) {
  const [state, formAction, pending] = useActionState(signupAction, initialState);
  const [clinicAddress, setClinicAddress] = useState(emptyStructuredAddress);

  if (!inviteValid || !inviteToken) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 text-center">
        <Logo size="lg" showTagline variant="hero" />
        <div className="tbm-card px-6 py-8 text-sm text-tbm-text-muted">
          Account creation requires a valid invite link from your TexBioMed representative.
        </div>
        <TextLink href="/" className="text-white hover:text-white/80">
          Back to sign in
        </TextLink>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8">
      <Logo size="lg" showTagline variant="hero" />
      <form action={formAction} className="tbm-card p-8">
        <input type="hidden" name="invite" value={inviteToken} />
        <h1 className="tbm-heading mb-2 text-2xl font-semibold">Create account</h1>
        <p className="mb-6 text-sm text-tbm-text-muted">
          Complete your provider profile to start placing orders.
        </p>
        <div className="flex flex-col gap-4">
          <Input label="Full name" name="full_name" required />
          <Input label="Practice name" name="practice_name" required />
          <Input label="Email" name="email" type="email" autoComplete="email" required />
          <Input label="Phone (optional)" name="phone" type="tel" />
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-tbm-navy">Clinic shipping address</span>
            <AddressFields
              value={clinicAddress}
              onChange={setClinicAddress}
              hiddenFieldName="clinic_shipping_address"
              required
              idPrefix="signup-clinic"
            />
          </div>
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          {state.error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-tbm-red">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">
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
