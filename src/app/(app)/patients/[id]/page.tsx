import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPatientById,
  getPatientDeleteEligibilityForPatient,
  getPatientOrderCount,
  getPatientOrders,
} from "@/lib/actions/patients";
import { formatAllergiesDisplay, formatPatientName } from "@/lib/format/patient";
import {
  formatPatientDeleteEligibleDate,
  getPatientDeleteBlockedMessage,
} from "@/lib/patients/delete-eligibility";
import { reorderAction } from "@/lib/actions/orders";
import { DeletePatientButton } from "@/components/delete-patient-button";
import { DeletePatientOrdersButton } from "@/components/delete-patient-orders-button";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PatientDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

function getErrorMessage(
  error?: string,
  deleteEligibility?: Awaited<ReturnType<typeof getPatientDeleteEligibilityForPatient>>,
): string | null {
  if (error === "delete_cooldown" && deleteEligibility) {
    return getPatientDeleteBlockedMessage(deleteEligibility);
  }

  if (error === "has_orders") {
    return "This patient cannot be deleted yet because their last order was less than 30 days ago.";
  }

  if (error === "delete_failed") {
    return "Unable to delete this patient. Please try again.";
  }

  if (error === "delete_orders_failed") {
    return "Unable to delete orders. Please try again.";
  }

  return null;
}

function getSuccessMessage(success?: string): string | null {
  if (success === "orders_deleted") {
    return "All orders for this patient were deleted.";
  }

  return null;
}

export default async function PatientDetailPage({
  params,
  searchParams,
}: PatientDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const patient = await getPatientById(id);

  if (!patient) {
    notFound();
  }

  const orders = await getPatientOrders(id);
  const orderCount = await getPatientOrderCount(id);
  const deleteEligibility = await getPatientDeleteEligibilityForPatient(id);
  const errorMessage = getErrorMessage(query.error, deleteEligibility);
  const successMessage = getSuccessMessage(query.success);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/patients" className="text-sm font-medium text-tbm-red hover:underline">
            Back to patients
          </Link>
          <h1 className="tbm-heading mt-2 text-2xl font-semibold">
            {formatPatientName(patient)}
          </h1>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex flex-wrap gap-3">
            <Link href={`/patients/${patient.id}/edit`}>
              <Button variant="secondary">Edit patient</Button>
            </Link>
            <DeletePatientButton
              patientId={patient.id}
              patientName={formatPatientName(patient)}
              deleteEligibility={deleteEligibility}
            />
          </div>
          {!deleteEligibility.canDelete && deleteEligibility.eligibleAt ? (
            <p className="max-w-sm text-right text-xs text-tbm-text-muted">
              Deletion available on{" "}
              {formatPatientDeleteEligibleDate(deleteEligibility.eligibleAt)}.
            </p>
          ) : null}
          <DeletePatientOrdersButton
            patientId={patient.id}
            patientName={formatPatientName(patient)}
            orderCount={orderCount}
          />
        </div>
      </div>

      {successMessage ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Patient information">
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-tbm-text-muted">Email</dt>
              <dd className="font-medium text-tbm-navy">{patient.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-tbm-text-muted">Phone</dt>
              <dd className="font-medium text-tbm-navy">{patient.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-tbm-text-muted">Date of birth</dt>
              <dd className="font-medium text-tbm-navy">
                {patient.date_of_birth ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-tbm-text-muted">Allergies</dt>
              <dd className="font-medium text-tbm-navy">
                {formatAllergiesDisplay(patient.allergies)}
              </dd>
            </div>
            <div>
              <dt className="text-tbm-text-muted">Sex</dt>
              <dd className="font-medium text-tbm-navy">{patient.sex ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-tbm-text-muted">Shipping address</dt>
              <dd className="whitespace-pre-wrap font-medium text-tbm-navy">
                {patient.shipping_address ?? "—"}
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="Recent orders">
          {orders.length === 0 ? (
            <p className="text-sm text-tbm-text-muted">No orders yet for this patient.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-tbm-border p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-tbm-navy">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                      <p className="mt-1 text-sm text-tbm-text-muted">
                        {order.order_items
                          ?.map(
                            (item: {
                              product_name: string;
                              quantity: number;
                            }) => `${item.product_name} x${item.quantity}`,
                          )
                          .join(", ")}
                      </p>
                    </div>
                    <form action={reorderAction.bind(null, order.id)}>
                      <Button type="submit" variant="ghost">
                        Reorder
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
