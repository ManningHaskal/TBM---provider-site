import Link from "next/link";
import {
  getOrderById,
  loadPatientsForOrderForm,
  loadProductsForOrderForm,
} from "@/lib/actions/orders";
import { OrderForm } from "@/components/order-form";

type NewOrderPageProps = {
  searchParams: Promise<{ reorder?: string }>;
};

export default async function NewOrderPage({ searchParams }: NewOrderPageProps) {
  const params = await searchParams;
  const [products, patients, reorderFrom] = await Promise.all([
    loadProductsForOrderForm(),
    loadPatientsForOrderForm(),
    params.reorder ? getOrderById(params.reorder) : Promise.resolve(null),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/orders" className="text-sm font-medium text-teal-800 hover:underline">
          Back to orders
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          {reorderFrom ? "Reorder" : "New order"}
        </h1>
        <p className="text-sm text-slate-600">
          Select a patient and choose peptide products for this order.
        </p>
      </div>

      <OrderForm
        products={products}
        patients={patients}
        reorderFrom={reorderFrom ?? undefined}
      />
    </div>
  );
}
