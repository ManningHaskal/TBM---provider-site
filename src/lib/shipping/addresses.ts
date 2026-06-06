export type ShipTo = "clinic" | "patient";

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
  return value.trim().replace(/\s+/g, " ");
}
