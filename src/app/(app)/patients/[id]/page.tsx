import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPatientById,
  getPatientOrders,
} from "@/lib/actions/patients";
import { formatPatientName } from "@/lib/format/patient";
import { reorderAction } from "@/lib/actions/orders";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PatientDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const { id } = await params;
  const patient = await getPatientById(id);

  if (!patient) {
    notFound();
  }

  const orders = await getPatientOrders(id);

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
        <Link href={`/patients/${patient.id}/edit`}>
          <Button variant="secondary">Edit patient</Button>
        </Link>
      </div>

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
              <dt className="text-tbm-text-muted">Weight</dt>
              <dd className="font-medium text-tbm-navy">{patient.weight ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-tbm-text-muted">Height</dt>
              <dd className="font-medium text-tbm-navy">{patient.height ?? "—"}</dd>
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
