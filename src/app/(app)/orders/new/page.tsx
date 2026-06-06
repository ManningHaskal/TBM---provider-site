import Link from "next/link";
import {
  getOrderById,
  loadPatientsForOrderForm,
  loadProductsForOrderForm,
  loadProviderShippingForOrderForm,
} from "@/lib/actions/orders";
import { OrderForm } from "@/components/order-form";

type NewOrderPageProps = {
  searchParams: Promise<{ reorder?: string }>;
};

export default async function NewOrderPage({ searchParams }: NewOrderPageProps) {
  const params = await searchParams;
  const [products, patients, clinicShippingAddress, reorderFrom] = await Promise.all([
    loadProductsForOrderForm(),
    loadPatientsForOrderForm(),
    loadProviderShippingForOrderForm(),
    params.reorder ? getOrderById(params.reorder) : Promise.resolve(null),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/orders" className="text-sm font-medium text-tbm-red hover:underline">
          Back to orders
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-tbm-navy">
          {reorderFrom ? "Reorder" : "New order"}
        </h1>
        <p className="text-sm text-tbm-text-muted">
          Select a patient and choose peptide products for this order.
        </p>
      </div>

      <OrderForm
        products={products}
        patients={patients}
        clinicShippingAddress={clinicShippingAddress}
        reorderFrom={reorderFrom ?? undefined}
      />
    </div>
  );
}
