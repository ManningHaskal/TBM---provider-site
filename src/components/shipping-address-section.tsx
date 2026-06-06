"use client";

import { Button } from "@/components/ui/button";
import type { ShipTo } from "@/lib/shipping/addresses";

type ShippingAddressSectionProps = {
  shipTo: ShipTo;
  onShipToChange: (shipTo: ShipTo) => void;
  address: string;
  onAddressChange: (address: string) => void;
  isEditing: boolean;
  onEdit: () => void;
  knownAddresses: string[];
  clinicAddressAvailable: boolean;
};

export function ShippingAddressSection({
  shipTo,
  onShipToChange,
  address,
  onAddressChange,
  isEditing,
  onEdit,
  knownAddresses,
  clinicAddressAvailable,
}: ShippingAddressSectionProps) {
  const showReadOnly = Boolean(address.trim()) && !isEditing;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onShipToChange("clinic")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            shipTo === "clinic"
              ? "bg-tbm-red text-white"
              : "bg-tbm-accent text-tbm-navy"
          }`}
        >
          Ship to clinic
        </button>
        <button
          type="button"
          onClick={() => onShipToChange("patient")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            shipTo === "patient"
              ? "bg-tbm-red text-white"
              : "bg-tbm-accent text-tbm-navy"
          }`}
        >
          Ship to patient
        </button>
      </div>

      {shipTo === "clinic" && !clinicAddressAvailable && !address.trim() ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No clinic address on file yet. Enter your clinic shipping address below.
        </p>
      ) : null}

      {showReadOnly ? (
        <div className="rounded-xl border border-tbm-border bg-tbm-accent-light p-4">
          <p className="text-sm font-medium text-tbm-navy">Shipping address</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-tbm-text-muted">{address}</p>
          <Button type="button" variant="secondary" className="mt-3" onClick={onEdit}>
            Change address
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {knownAddresses.length > 0 ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-tbm-navy">Use saved address (optional)</span>
              <select
                value=""
                onChange={(event) => {
                  if (event.target.value) {
                    onAddressChange(event.target.value);
                  }
                }}
                className="rounded-xl border border-tbm-border px-3 py-2 text-tbm-navy"
              >
                <option value="">Select a saved address</option>
                {knownAddresses.map((knownAddress) => (
                  <option key={knownAddress} value={knownAddress}>
                    {knownAddress}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-tbm-navy">Shipping address</span>
            <textarea
              name="shipping_address"
              rows={4}
              value={address}
              onChange={(event) => onAddressChange(event.target.value)}
              className="rounded-xl border border-tbm-border px-3 py-2 text-tbm-navy outline-none ring-tbm-blue/20 focus:border-tbm-blue focus:ring-4"
              placeholder="Street address, city, state, ZIP"
              required
            />
            {address.trim() ? (
              <Button
                type="button"
                variant="ghost"
                className="self-start px-0"
                onClick={() => onAddressChange("")}
              >
                Clear address
              </Button>
            ) : null}
          </label>
        </div>
      )}

      {showReadOnly ? (
        <input type="hidden" name="shipping_address" value={address} />
      ) : null}
      <input type="hidden" name="ship_to" value={shipTo} />
    </div>
  );
}
