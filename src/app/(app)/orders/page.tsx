import Link from "next/link";
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
          <h1 className="text-2xl font-semibold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-600">
            Review recent orders and place new ones for your patients.
          </p>
        </div>
        <Link
          href="/orders/new"
          className="inline-flex rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          New order
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
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
                  <td colSpan={5} className="px-2 py-6 text-slate-500">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100">
                    <td className="px-2 py-3">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                    <td className="px-2 py-3">{order.patient.full_name}</td>
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
