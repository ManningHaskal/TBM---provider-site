"use client";

import { Button } from "@/components/ui/button";
import { AddressFields } from "@/components/address-fields";
import type { ShipTo } from "@/lib/shipping/addresses";
import {
  formatStructuredAddress,
  isAddressComplete,
  parseStoredAddress,
  type StructuredAddress,
} from "@/lib/shipping/address-model";

type ShippingAddressSectionProps = {
  shipTo: ShipTo;
  onShipToChange: (shipTo: ShipTo) => void;
  address: StructuredAddress;
  onAddressChange: (address: StructuredAddress) => void;
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
  const formattedAddress = formatStructuredAddress(address);
  const showReadOnly = isAddressComplete(address) && !isEditing;

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

      {shipTo === "clinic" && !clinicAddressAvailable && !formattedAddress.trim() ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No clinic address on file yet. Enter your clinic shipping address below.
        </p>
      ) : null}

      {showReadOnly ? (
        <div className="rounded-xl border border-tbm-border bg-tbm-accent-light p-4">
          <p className="text-sm font-medium text-tbm-navy">Saved shipping address</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-tbm-text-muted">
            {formattedAddress}
          </p>
          <Button type="button" variant="secondary" className="mt-3" onClick={onEdit}>
            Change address
          </Button>
          <input type="hidden" name="shipping_address" value={formattedAddress} />
        </div>
      ) : (
        <AddressFields
          value={address}
          onChange={onAddressChange}
          savedAddresses={shipTo === "patient" ? knownAddresses : []}
          hiddenFieldName="shipping_address"
          required
          idPrefix="order-shipping"
        />
      )}

      <input type="hidden" name="ship_to" value={shipTo} />
    </div>
  );
}

export { parseStoredAddress };
