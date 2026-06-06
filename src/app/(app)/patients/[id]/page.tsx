import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPatientById,
  getPatientOrders,
} from "@/lib/actions/patients";
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
          <Link href="/patients" className="text-sm font-medium text-teal-800 hover:underline">
            Back to patients
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            {patient.full_name}
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
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900">{patient.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Phone</dt>
              <dd className="font-medium text-slate-900">{patient.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Date of birth</dt>
              <dd className="font-medium text-slate-900">
                {patient.date_of_birth ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Weight</dt>
              <dd className="font-medium text-slate-900">{patient.weight ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Height</dt>
              <dd className="font-medium text-slate-900">{patient.height ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Sex</dt>
              <dd className="font-medium text-slate-900">{patient.sex ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Shipping address</dt>
              <dd className="font-medium text-slate-900 whitespace-pre-wrap">
                {patient.shipping_address ?? "—"}
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="Recent orders">
          {orders.length === 0 ? (
            <p className="text-sm text-slate-600">No orders yet for this patient.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
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
