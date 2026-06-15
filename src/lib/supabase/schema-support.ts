import type { SupabaseClient } from "@supabase/supabase-js";

type SchemaSupport = {
  orderShipping: boolean;
  providerClinicShipping: boolean;
};

async function columnExists(
  supabase: SupabaseClient,
  table: "orders" | "providers",
  column: string,
): Promise<boolean> {
  const { error } = await supabase.from(table).select(column).limit(1);

  if (!error) {
    return true;
  }

  if (
    error.code === "PGRST204" ||
    error.message.toLowerCase().includes("does not exist")
  ) {
    return false;
  }

  return false;
}

export async function getSchemaSupport(
  supabase: SupabaseClient,
): Promise<SchemaSupport> {
  const [orderShipping, providerClinicShipping] = await Promise.all([
    columnExists(supabase, "orders", "ship_to"),
    columnExists(supabase, "providers", "clinic_shipping_address"),
  ]);

  return { orderShipping, providerClinicShipping };
}

export function appendShippingToNotes(
  notes: string | null,
  shipTo: "clinic" | "patient",
  shippingAddress: string,
): string {
  const shippingBlock = [
    `Ship to: ${shipTo === "clinic" ? "Clinic" : "Patient"}`,
    `Shipping address:\n${shippingAddress}`,
  ].join("\n");

  return notes?.trim() ? `${notes.trim()}\n\n${shippingBlock}` : shippingBlock;
}

export const orderSelectColumnsWithShipping =
  "id, created_at, provider_id, patient_id, notes, ship_to, shipping_address, sync_error";

export const orderSelectColumnsLegacy =
  "id, created_at, provider_id, patient_id, notes, sync_error";
