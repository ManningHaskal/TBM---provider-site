import {
  formatStructuredAddress,
  parseStoredAddress,
} from "@/lib/shipping/address-model";

export type ShipTo = "clinic" | "patient";

export {
  formatStructuredAddress,
  parseStoredAddress,
  type StructuredAddress,
} from "@/lib/shipping/address-model";

export function getUniquePatientAddresses(
  addresses: Array<string | null | undefined>,
): string[] {
  const unique = new Set<string>();

  for (const address of addresses) {
    const trimmed = address?.trim();
    if (trimmed) {
      unique.add(trimmed);
    }
  }

  return [...unique].sort((a, b) => a.localeCompare(b));
}

export function normalizeShippingAddress(value: string): string {
  const parsed = parseStoredAddress(value);
  const formatted = formatStructuredAddress(parsed);

  if (formatted.trim()) {
    return formatted;
  }

  return value.trim().replace(/\s+/g, " ");
}
