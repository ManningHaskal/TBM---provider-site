"use client";

import { useActionState } from "react";
import {
  createPatientAction,
  updatePatientAction,
  type PatientActionState,
} from "@/lib/actions/patients";
import type { Patient } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: PatientActionState = {};

const sexOptions = ["Female", "Male", "Other", "Prefer not to say"];

type PatientFormProps = {
  patient?: Patient;
};

export function PatientForm({ patient }: PatientFormProps) {
  const action = patient
    ? updatePatientAction.bind(null, patient.id)
    : createPatientAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        label="Full name"
        name="full_name"
        defaultValue={patient?.full_name ?? ""}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Email"
          name="email"
          type="email"
          defaultValue={patient?.email ?? ""}
        />
        <Input
          label="Phone #"
          name="phone"
          type="tel"
          defaultValue={patient?.phone ?? ""}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Date of birth"
          name="date_of_birth"
          placeholder="MM/DD/YYYY"
          defaultValue={patient?.date_of_birth ?? ""}
        />
        <Input
          label="Weight"
          name="weight"
          placeholder="e.g. 165 lbs"
          defaultValue={patient?.weight ?? ""}
        />
        <Input
          label="Height"
          name="height"
          placeholder={'e.g. 5\'10"'}
          defaultValue={patient?.height ?? ""}
        />
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-tbm-navy">Sex</span>
        <select
          name="sex"
          defaultValue={patient?.sex ?? ""}
          className="rounded-lg border border-tbm-border px-3 py-2 text-tbm-navy outline-none ring-tbm-blue/20 focus:border-tbm-blue focus:ring-4"
        >
          <option value="">Select</option>
          {sexOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-tbm-navy">Shipping address</span>
        <textarea
          name="shipping_address"
          rows={3}
          defaultValue={patient?.shipping_address ?? ""}
          className="rounded-lg border border-tbm-border px-3 py-2 text-tbm-navy outline-none ring-tbm-blue/20 focus:border-tbm-blue focus:ring-4"
        />
      </label>
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
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : patient ? "Update patient" : "Create patient"}
      </Button>
    </form>
  );
}
