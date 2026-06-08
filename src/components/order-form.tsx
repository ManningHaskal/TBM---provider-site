"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  submitOrderAction,
  type OrderActionState,
} from "@/lib/actions/orders";
import { formatPatientName } from "@/lib/format/patient";
import {
  getInitialLineItem,
  resolveLineItemSelection,
} from "@/lib/products/grouping";
import {
  getUniquePatientAddresses,
  parseStoredAddress,
  type ShipTo,
  type StructuredAddress,
} from "@/lib/shipping/addresses";
import { emptyStructuredAddress } from "@/lib/shipping/address-model";
import type { OrderWithDetails, Product, ProductCategoryFilter } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PatientFieldInputs } from "@/components/patient-field-inputs";
import {
  OrderLineProductPicker,
  ProductCategoryFilterSelect,
} from "@/components/order-line-product-picker";
import { ShippingAddressSection } from "@/components/shipping-address-section";

const initialState: OrderActionState = {};

type PatientOption = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  allergies: string | null;
  sex: string | null;
  shipping_address: string | null;
};

type OrderFormProps = {
  products: Product[];
  patients: PatientOption[];
  clinicShippingAddress: string | null;
  reorderFrom?: OrderWithDetails & {
    patient: PatientOption;
  };
};

type LineItemRow = {
  baseName: string;
  productSku: string;
  quantity: number;
};

function getAutofillAddress({
  shipTo,
  clinicShippingAddress,
  patientMode,
  selectedPatient,
}: {
  shipTo: ShipTo;
  clinicShippingAddress: string | null;
  patientMode: "existing" | "new";
  selectedPatient?: PatientOption;
}): string {
  if (shipTo === "clinic") {
    return clinicShippingAddress?.trim() ?? "";
  }

  if (patientMode === "existing") {
    return selectedPatient?.shipping_address?.trim() ?? "";
  }

  return "";
}

export function OrderForm({
  products,
  patients,
  clinicShippingAddress,
  reorderFrom,
}: OrderFormProps) {
  const [state, formAction, pending] = useActionState(submitOrderAction, initialState);
  const [categoryFilter, setCategoryFilter] = useState<ProductCategoryFilter>("all");
  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing");
  const [selectedPatientId, setSelectedPatientId] = useState(
    reorderFrom?.patient_id ?? patients[0]?.id ?? "",
  );
  const [shipTo, setShipTo] = useState<ShipTo>("clinic");
  const [shippingAddress, setShippingAddress] = useState<StructuredAddress>(
    emptyStructuredAddress,
  );
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [lineItems, setLineItems] = useState<LineItemRow[]>(() => {
    if (reorderFrom?.order_items.length) {
      return reorderFrom.order_items.map((item) => {
        const initial = getInitialLineItem(products, "all", item.product_sku);
        return {
          baseName: initial.baseName,
          productSku: item.product_sku,
          quantity: item.quantity,
        };
      });
    }

    const initial = getInitialLineItem(products, "all");
    return [{ ...initial, quantity: 1 }];
  });

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId),
    [patients, selectedPatientId],
  );

  const knownAddresses = useMemo(
    () => getUniquePatientAddresses(patients.map((patient) => patient.shipping_address)),
    [patients],
  );

  const autofillAddress = useMemo(
    () =>
      getAutofillAddress({
        shipTo,
        clinicShippingAddress,
        patientMode,
        selectedPatient,
      }),
    [shipTo, clinicShippingAddress, patientMode, selectedPatient],
  );

  useEffect(() => {
    setShippingAddress(parseStoredAddress(autofillAddress));
    setIsEditingAddress(!autofillAddress.trim());
  }, [autofillAddress, shipTo, selectedPatientId, patientMode]);

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.sku, product])),
    [products],
  );

  useEffect(() => {
    setLineItems((current) =>
      current.map((item) => {
        const resolved = resolveLineItemSelection(
          products,
          categoryFilter,
          item.baseName,
          item.productSku,
        );
        return { ...item, ...resolved };
      }),
    );
  }, [categoryFilter, products]);

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
    const initial = getInitialLineItem(products, categoryFilter);
    setLineItems((current) => [...current, { ...initial, quantity: 1 }]);
  }

  function removeLineItem(index: number) {
    setLineItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleShipToChange(nextShipTo: ShipTo) {
    setShipTo(nextShipTo);
    setIsEditingAddress(false);
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
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              patientMode === "existing"
                ? "bg-tbm-red text-white"
                : "bg-tbm-accent text-tbm-navy"
            }`}
          >
            Existing patient
          </button>
          <button
            type="button"
            onClick={() => setPatientMode("new")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              patientMode === "new"
                ? "bg-tbm-red text-white"
                : "bg-tbm-accent text-tbm-navy"
            }`}
          >
            New patient
          </button>
        </div>

        {patientMode === "existing" ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-tbm-navy">Select patient</span>
            <select
              value={selectedPatientId}
              onChange={(event) => setSelectedPatientId(event.target.value)}
              className="rounded-lg border border-tbm-border px-3 py-2 text-tbm-navy"
            >
              <option value="">Choose a patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {formatPatientName(patient)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <PatientFieldInputs />
        )}
      </Card>

      <Card title="Order items">
        <div className="mb-4">
          <ProductCategoryFilterSelect
            products={products}
            value={categoryFilter}
            onChange={setCategoryFilter}
          />
        </div>
        <div className="flex flex-col gap-4">
          {lineItems.map((item, index) => {
            const product = productMap.get(item.productSku);
            const lineTotal = ((product?.price ?? 0) * item.quantity).toFixed(2);

            return (
              <div
                key={`line-${index}`}
                className="rounded-xl border border-tbm-border p-4"
              >
                <OrderLineProductPicker
                  products={products}
                  categoryFilter={categoryFilter}
                  baseName={item.baseName}
                  sku={item.productSku}
                  onBaseNameChange={(baseName) => updateLineItem(index, { baseName })}
                  onSkuChange={(productSku) => updateLineItem(index, { productSku })}
                />
                <div className="mt-3 grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-end">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-tbm-navy">Quantity</span>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) =>
                        updateLineItem(index, {
                          quantity: Number.parseInt(event.target.value, 10) || 1,
                        })
                      }
                      className="rounded-lg border border-tbm-border px-3 py-2"
                    />
                  </label>
                  <div className="flex min-w-0 items-center rounded-lg bg-tbm-accent-light px-3 py-2 text-sm text-tbm-text-muted">
                    <span className="truncate">
                      Line total:{" "}
                      <span className="font-semibold text-tbm-navy">${lineTotal}</span>
                    </span>
                  </div>
                  {lineItems.length > 1 ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => removeLineItem(index)}
                      className="w-full sm:w-auto"
                    >
                      Remove
                    </Button>
                  ) : (
                    <div />
                  )}
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
          <span className="font-medium text-tbm-navy">Order notes (optional)</span>
          <textarea
            name="notes"
            rows={3}
            defaultValue={reorderFrom?.notes ?? ""}
            className="rounded-lg border border-tbm-border px-3 py-2 text-tbm-navy"
          />
        </label>
      </Card>

      <Card title="Shipping address">
        <ShippingAddressSection
          shipTo={shipTo}
          onShipToChange={handleShipToChange}
          address={shippingAddress}
          onAddressChange={setShippingAddress}
          isEditing={isEditingAddress}
          onEdit={() => setIsEditingAddress(true)}
          knownAddresses={
            shipTo === "patient" ? knownAddresses : []
          }
          clinicAddressAvailable={Boolean(clinicShippingAddress?.trim())}
        />
      </Card>

      <div className="flex flex-col gap-4 rounded-2xl border border-tbm-border bg-tbm-accent-light p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-tbm-text-muted">Estimated order total</p>
          <p className="text-2xl font-semibold text-tbm-navy">
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
