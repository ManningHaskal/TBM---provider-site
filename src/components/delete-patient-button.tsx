"use client";

import { deletePatientAction } from "@/lib/actions/patients";
import { getPatientDeleteBlockedMessage } from "@/lib/patients/delete-eligibility";
import type { PatientDeleteEligibility } from "@/lib/patients/delete-eligibility";
import { Button } from "@/components/ui/button";

type DeletePatientButtonProps = {
  patientId: string;
  patientName: string;
  deleteEligibility: PatientDeleteEligibility;
};

export function DeletePatientButton({
  patientId,
  patientName,
  deleteEligibility,
}: DeletePatientButtonProps) {
  const blockMessage = getPatientDeleteBlockedMessage(deleteEligibility);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (!deleteEligibility.canDelete) {
      event.preventDefault();
      window.alert(blockMessage);
      return;
    }

    const orderNote =
      deleteEligibility.orderCount > 0
        ? ` This will also delete ${deleteEligibility.orderCount} order(s) on file.`
        : "";

    const confirmed = window.confirm(
      `Delete ${patientName}? This cannot be undone.${orderNote}`,
    );

    if (!confirmed) {
      event.preventDefault();
    }
  }

  return (
    <form action={deletePatientAction.bind(null, patientId)}>
      <Button
        type="submit"
        variant="secondary"
        className="border-red-200 text-tbm-red hover:bg-red-50"
        onClick={handleClick}
        disabled={!deleteEligibility.canDelete}
        title={blockMessage || undefined}
      >
        Delete patient
      </Button>
    </form>
  );
}
