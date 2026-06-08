"use client";

import { deletePatientAction } from "@/lib/actions/patients";
import { Button } from "@/components/ui/button";

type DeletePatientButtonProps = {
  patientId: string;
  patientName: string;
  hasOrders: boolean;
};

export function DeletePatientButton({
  patientId,
  patientName,
  hasOrders,
}: DeletePatientButtonProps) {
  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (hasOrders) {
      event.preventDefault();
      window.alert(
        "This patient cannot be deleted because they have existing orders on file.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete ${patientName}? This cannot be undone.`,
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
        disabled={hasOrders}
      >
        Delete patient
      </Button>
    </form>
  );
}
