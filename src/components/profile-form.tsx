"use client";

import { useActionState, useState } from "react";
import { updateProfileAction, type ProfileActionState } from "@/lib/actions/profile";
import { AddressFields } from "@/components/address-fields";
import { FieldLabel } from "@/components/ui/field-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  extractLocalPhoneDigits,
  formatLocalPhoneDigits,
  formatPhoneForStorage,
  parsePhoneToLocalDigits,
} from "@/lib/format/phone";
import { parseStoredAddress, type StructuredAddress } from "@/lib/shipping/address-model";
import type { Provider } from "@/lib/types";

const initialState: ProfileActionState = {};

type ProfileFormProps = {
  provider: Provider;
  email: string;
  clinicShippingEnabled: boolean;
  initialSuccess?: boolean;
};

export function ProfileForm({
  provider,
  email,
  clinicShippingEnabled,
  initialSuccess = false,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const [fullName, setFullName] = useState(provider.full_name);
  const [practiceName, setPracticeName] = useState(provider.practice_name);
  const [phoneDigits, setPhoneDigits] = useState(() =>
    parsePhoneToLocalDigits(provider.phone),
  );
  const [clinicAddress, setClinicAddress] = useState<StructuredAddress>(() =>
    parseStoredAddress(provider.clinic_shipping_address),
  );

  const showSuccess = initialSuccess || Boolean(state.success);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <p className="text-xs text-tbm-text-muted">
        Fields marked with <span className="text-tbm-red">*</span> are required.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <FieldLabel>Sign-in email</FieldLabel>
          <input
            type="email"
            value={email}
            readOnly
            className="rounded-xl border border-tbm-border bg-tbm-accent-light px-3 py-2.5 text-tbm-text-muted"
          />
          <span className="text-xs text-tbm-text-muted">
            Contact TexBioMed if you need to change your sign-in email.
          </span>
        </label>

        <Input
          label="Full name"
          name="full_name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
        <Input
          label="Practice name"
          name="practice_name"
          value={practiceName}
          onChange={(event) => setPracticeName(event.target.value)}
          required
        />
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <FieldLabel>Phone #</FieldLabel>
        <div className="flex overflow-hidden rounded-xl border border-tbm-border bg-white focus-within:border-tbm-blue focus-within:ring-4 focus-within:ring-tbm-blue/20">
          <span className="flex items-center border-r border-tbm-border bg-tbm-accent-light px-3 text-sm font-medium text-tbm-navy">
            +1
          </span>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={formatLocalPhoneDigits(phoneDigits)}
            onChange={(event) =>
              setPhoneDigits(extractLocalPhoneDigits(event.target.value))
            }
            className="min-w-0 flex-1 border-0 px-3 py-2.5 text-tbm-navy outline-none"
            placeholder="(555) - 555 - 5555"
          />
        </div>
        <input type="hidden" name="phone" value={formatPhoneForStorage(phoneDigits)} />
      </label>

      {clinicShippingEnabled ? (
        <div className="flex flex-col gap-1 text-sm">
          <FieldLabel required>Clinic shipping address</FieldLabel>
          <p className="text-xs text-tbm-text-muted">
            Used when orders are shipped to your clinic.
          </p>
          <AddressFields
            value={clinicAddress}
            onChange={setClinicAddress}
            hiddenFieldName="clinic_shipping_address"
            required
            idPrefix="profile-clinic"
          />
        </div>
      ) : (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Clinic shipping address is not available yet. Run the shipping migration in
          Supabase to enable saving clinic addresses on your profile.
        </p>
      )}

      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      {showSuccess ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Profile updated successfully.
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
