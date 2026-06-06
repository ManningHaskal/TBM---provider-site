"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  submitOrderAction,
  type OrderActionState,
} from "@/lib/actions/orders";
import type { OrderWithDetails, Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const initialState: OrderActionState = {};

type PatientOption = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  shipping_address: string | null;
  date_of_birth: string | null;
  weight: string | null;
  height: string | null;
  sex: string | null;
};

type OrderFormProps = {
  products: Product[];
  patients: PatientOption[];
  reorderFrom?: OrderWithDetails & {
    patient: PatientOption;
  };
};

type LineItemRow = {
  productSku: string;
  quantity: number;
};

export function OrderForm({ products, patients, reorderFrom }: OrderFormProps) {
  const [state, formAction, pending] = useActionState(submitOrderAction, initialState);
  const [patientMode, setPatientMode] = useState<"existing" | "new">(
    reorderFrom ? "existing" : "existing",
  );
  const [selectedPatientId, setSelectedPatientId] = useState(
    reorderFrom?.patient_id ?? patients[0]?.id ?? "",
  );
  const [lineItems, setLineItems] = useState<LineItemRow[]>(
    reorderFrom?.order_items.map((item) => ({
      productSku: item.product_sku,
      quantity: item.quantity,
    })) ?? [{ productSku: products[0]?.sku ?? "", quantity: 1 }],
  );

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.sku, product])),
    [products],
  );

  const orderTotal = lineItems.reduce((total, item) => {
    const product = productMap.get(item.productSku);
    if (!product) return total;
    return total + product.price * item.quantity;
  }, 0);

  function updateLineItem(index: number, updates: Partial<LineItemRow>) {
    setLineItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...updates } : item,
      ),
    );
  }

  function addLineItem() {
    setLineItems((current) => [
      ...current,
      { productSku: products[0]?.sku ?? "", quantity: 1 },
    ]);
  }

  function removeLineItem(index: number) {
    setLineItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="patient_mode" value={patientMode} />
      <input type="hidden" name="patient_id" value={selectedPatientId} />
      <input type="hidden" name="line_items" value={JSON.stringify(lineItems)} />

      <Card title="Patient">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPatientMode("existing")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              patientMode === "existing"
                ? "bg-teal-700 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Existing patient
          </button>
          <button
            type="button"
            onClick={() => setPatientMode("new")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              patientMode === "new"
                ? "bg-teal-700 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            New patient
          </button>
        </div>

        {patientMode === "existing" ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Select patient</span>
            <select
              value={selectedPatientId}
              onChange={(event) => setSelectedPatientId(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            >
              <option value="">Choose a patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" name="full_name" required className="sm:col-span-2" />
            <Input label="Email" name="email" type="email" />
            <Input label="Phone #" name="phone" type="tel" />
            <Input label="Date of birth" name="date_of_birth" placeholder="MM/DD/YYYY" />
            <Input label="Weight" name="weight" placeholder="e.g. 165 lbs" />
            <Input label="Height" name="height" placeholder={'e.g. 5\'10"'} />
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Sex</span>
              <select
                name="sex"
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              >
                <option value="">Select</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">Shipping address</span>
              <textarea
                name="shipping_address"
                rows={3}
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </label>
          </div>
        )}
      </Card>

      <Card title="Order items">
        <div className="flex flex-col gap-4">
          {lineItems.map((item, index) => {
            const product = productMap.get(item.productSku);
            return (
              <div
                key={`${item.productSku}-${index}`}
                className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[2fr_1fr_auto]"
              >
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">Product</span>
                  <select
                    value={item.productSku}
                    onChange={(event) =>
                      updateLineItem(index, { productSku: event.target.value })
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {products.map((productOption) => (
                      <option key={productOption.sku} value={productOption.sku}>
                        {productOption.name} — ${productOption.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">Quantity</span>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(event) =>
                      updateLineItem(index, {
                        quantity: Number.parseInt(event.target.value, 10) || 1,
                      })
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <div className="flex items-end justify-between gap-3 sm:flex-col sm:items-stretch">
                  <p className="text-sm text-slate-600">
                    Line total: $
                    {((product?.price ?? 0) * item.quantity).toFixed(2)}
                  </p>
                  {lineItems.length > 1 ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => removeLineItem(index)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
          <Button type="button" variant="secondary" onClick={addLineItem}>
            Add product
          </Button>
        </div>
      </Card>

      <Card title="Notes">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Order notes (optional)</span>
          <textarea
            name="notes"
            rows={3}
            defaultValue={reorderFrom?.notes ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
        </label>
      </Card>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-600">Estimated order total</p>
          <p className="text-2xl font-semibold text-slate-900">
            ${orderTotal.toFixed(2)}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/orders">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={pending || products.length === 0}>
            {pending ? "Submitting..." : "Submit order"}
          </Button>
        </div>
      </div>

      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          <p>{state.success}</p>
          {state.orderId ? (
            <p className="mt-1 font-medium">
              Order reference: {state.orderId.slice(0, 8).toUpperCase()}
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
