"use client";

import { useEffect, useState } from "react";
import { AddressFields } from "@/components/address-fields";
import { FieldLabel } from "@/components/ui/field-label";
import type { Patient } from "@/lib/types";
import {
  extractDateDigits,
  formatDateOfBirth,
  parseDateOfBirth,
} from "@/lib/format/date";
import {
  extractLocalPhoneDigits,
  formatLocalPhoneDigits,
  formatPhoneForStorage,
  parsePhoneToLocalDigits,
} from "@/lib/format/phone";
import { isNewPatientComplete } from "@/lib/order-form-validation";
import { Input } from "@/components/ui/input";
import {
  parseStoredAddress,
  type StructuredAddress,
} from "@/lib/shipping/address-model";

const sexOptions = ["Female", "Male", "Other", "Prefer not to say"];

type PatientFieldInputsProps = {
  includeShippingAddress?: boolean;
  requireCoreFields?: boolean;
  onValidityChange?: (valid: boolean) => void;
  patient?: Pick<
    Patient,
    | "first_name"
    | "last_name"
    | "email"
    | "phone"
    | "date_of_birth"
    | "allergies"
    | "sex"
    | "shipping_address"
  >;
};

export function PatientFieldInputs({
  patient,
  includeShippingAddress = false,
  requireCoreFields = false,
  onValidityChange,
}: PatientFieldInputsProps) {
  const [firstName, setFirstName] = useState(patient?.first_name ?? "");
  const [lastName, setLastName] = useState(patient?.last_name ?? "");
  const [email, setEmail] = useState(patient?.email ?? "");
  const [sex, setSex] = useState(patient?.sex ?? "");
  const [phoneDigits, setPhoneDigits] = useState(() =>
    parsePhoneToLocalDigits(patient?.phone),
  );
  const [dateOfBirth, setDateOfBirth] = useState(() =>
    parseDateOfBirth(patient?.date_of_birth),
  );
  const [shippingAddress, setShippingAddress] = useState<StructuredAddress>(() =>
    parseStoredAddress(patient?.shipping_address),
  );

  useEffect(() => {
    if (!requireCoreFields || !onValidityChange) {
      return;
    }

    onValidityChange(
      isNewPatientComplete({
        firstName,
        lastName,
        email,
        dateOfBirth,
        sex,
      }),
    );
  }, [
    requireCoreFields,
    onValidityChange,
    firstName,
    lastName,
    email,
    dateOfBirth,
    sex,
  ]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="First name"
          name="first_name"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          required={requireCoreFields}
        />
        <Input
          label="Last name"
          name="last_name"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          required={requireCoreFields}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required={requireCoreFields}
        />
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
          <input
            type="hidden"
            name="phone"
            value={formatPhoneForStorage(phoneDigits)}
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <FieldLabel required={requireCoreFields}>Date of birth</FieldLabel>
          <input
            name="date_of_birth"
            type="text"
            inputMode="numeric"
            autoComplete="bday"
            value={formatDateOfBirth(dateOfBirth)}
            onChange={(event) =>
              setDateOfBirth(extractDateDigits(event.target.value))
            }
            className="rounded-xl border border-tbm-border bg-white px-3 py-2.5 text-tbm-navy outline-none ring-tbm-blue/20 focus:border-tbm-blue focus:ring-4"
            placeholder="MM/DD/YYYY"
            required={requireCoreFields}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <FieldLabel required={requireCoreFields}>Sex</FieldLabel>
          <select
            name="sex"
            value={sex}
            onChange={(event) => setSex(event.target.value)}
            className="rounded-xl border border-tbm-border px-3 py-2 text-tbm-navy outline-none ring-tbm-blue/20 focus:border-tbm-blue focus:ring-4"
            required={requireCoreFields}
          >
            <option value="">Select</option>
            {sexOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <FieldLabel>Allergies</FieldLabel>
        <span className="text-xs text-tbm-text-muted">Leave blank for no allergies.</span>
        <textarea
          name="allergies"
          rows={3}
          defaultValue={patient?.allergies ?? ""}
          className="rounded-xl border border-tbm-border px-3 py-2 text-tbm-navy outline-none ring-tbm-blue/20 focus:border-tbm-blue focus:ring-4"
          placeholder="e.g. Penicillin, latex"
        />
      </label>
      {includeShippingAddress ? (
        <div className="flex flex-col gap-1 text-sm">
          <FieldLabel>Shipping address (optional)</FieldLabel>
          <AddressFields
            value={shippingAddress}
            onChange={setShippingAddress}
            hiddenFieldName="shipping_address"
            idPrefix="patient-shipping"
          />
        </div>
      ) : null}
    </>
  );
}
