import Link from "next/link";
import { formatPatientName } from "@/lib/format/patient";
import { getRecentOrders, reorderAction } from "@/lib/actions/orders";
import { calculateOrderTotal } from "@/lib/google/sheets";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function OrdersPage() {
  const orders = await getRecentOrders();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-tbm-navy">Orders</h1>
          <p className="text-sm text-tbm-text-muted">
            Review recent orders and place new ones for your patients.
          </p>
        </div>
        <Link
          href="/orders/new"
          className="inline-flex rounded-lg bg-tbm-red px-4 py-2 text-sm font-medium text-white hover:bg-tbm-red-dark"
        >
          New order
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-tbm-border text-tbm-text-muted">
              <tr>
                <th className="px-2 py-2 font-medium">Date</th>
                <th className="px-2 py-2 font-medium">Patient</th>
                <th className="px-2 py-2 font-medium">Items</th>
                <th className="px-2 py-2 font-medium">Total</th>
                <th className="px-2 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-6 text-tbm-text-muted">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-tbm-border">
                    <td className="px-2 py-3">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                    <td className="px-2 py-3">{formatPatientName(order.patient)}</td>
                    <td className="px-2 py-3">
                      {order.order_items
                        .map((item) => `${item.product_name} x${item.quantity}`)
                        .join(", ")}
                    </td>
                    <td className="px-2 py-3">
                      ${calculateOrderTotal(order.order_items).toFixed(2)}
                    </td>
                    <td className="px-2 py-3">
                      <form action={reorderAction.bind(null, order.id)}>
                        <Button type="submit" variant="ghost">
                          Reorder
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
