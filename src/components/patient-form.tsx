"use client";

import { useActionState } from "react";
import {
  createPatientAction,
  updatePatientAction,
  type PatientActionState,
} from "@/lib/actions/patients";
import type { Patient } from "@/lib/types";
import { PatientFieldInputs } from "@/components/patient-field-inputs";
import { Button } from "@/components/ui/button";

const initialState: PatientActionState = {};

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
      <PatientFieldInputs patient={patient} includeShippingAddress />
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
