"use client";

import { deleteAllPatientOrdersForTestingAction } from "@/lib/actions/patients";
import { Button } from "@/components/ui/button";

type DeletePatientOrdersButtonProps = {
  patientId: string;
  patientName: string;
  orderCount: number;
};

export function DeletePatientOrdersButton({
  patientId,
  patientName,
  orderCount,
}: DeletePatientOrdersButtonProps) {
  if (orderCount === 0) {
    return null;
  }

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    const confirmed = window.confirm(
      `Delete all ${orderCount} order(s) for ${patientName}? This is for testing only and cannot be undone.`,
    );

    if (!confirmed) {
      event.preventDefault();
    }
  }

  return (
    <form action={deleteAllPatientOrdersForTestingAction.bind(null, patientId)}>
      <Button
        type="submit"
        variant="ghost"
        className="text-xs text-tbm-text-muted underline"
        onClick={handleClick}
      >
        Delete all orders (testing)
      </Button>
    </form>
  );
}
