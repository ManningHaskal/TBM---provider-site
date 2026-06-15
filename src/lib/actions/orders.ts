"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProvider } from "@/lib/auth/session";
import { sendOrderNotificationEmail } from "@/lib/email/send-order";
import {
  appendOrderToSheet,
  calculateOrderTotal,
  formatLineItemsSummary,
  getProducts,
} from "@/lib/google/sheets";
import { formatPatientName } from "@/lib/format/patient";
import {
  readPatientFormData,
  sanitizePatientInput,
} from "@/lib/patient-form-data";
import { isDateOfBirthComplete } from "@/lib/order-form-validation";
import { normalizeShippingAddress } from "@/lib/shipping/addresses";
import { isAddressComplete, parseStoredAddress } from "@/lib/shipping/address-model";
import { createClient } from "@/lib/supabase/server";
import {
  appendShippingToNotes,
  getSchemaSupport,
  orderSelectColumnsLegacy,
  orderSelectColumnsWithShipping,
} from "@/lib/supabase/schema-support";
import type { OrderLineInput, OrderWithDetails, ShipTo } from "@/lib/types";

export type OrderActionState = {
  error?: string;
  success?: string;
  warning?: string;
  orderId?: string;
};

function parseLineItems(formData: FormData): OrderLineInput[] {
  const raw = String(formData.get("line_items") ?? "[]");

  try {
    const parsed = JSON.parse(raw) as OrderLineInput[];
    return parsed.filter(
      (item) => item.productSku && Number.isFinite(item.quantity) && item.quantity > 0,
    );
  } catch {
    return [];
  }
}

async function resolvePatientId(
  formData: FormData,
  providerId: string,
): Promise<{ patientId?: string; error?: string }> {
  const mode = String(formData.get("patient_mode") ?? "existing");
  const supabase = await createClient();

  if (mode === "existing") {
    const patientId = String(formData.get("patient_id") ?? "").trim();
    if (!patientId) {
      return { error: "Please select a patient." };
    }

    const { data } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .eq("provider_id", providerId)
      .maybeSingle();

    if (!data) {
      return { error: "Selected patient was not found." };
    }

    return { patientId };
  }

  const patientData = readPatientFormData(formData);
  const payload = sanitizePatientInput(patientData);

  if (!payload.first_name || !payload.last_name) {
    return { error: "Patient first and last name are required." };
  }

  if (!payload.email) {
    return { error: "Patient email is required." };
  }

  if (!payload.date_of_birth || !isDateOfBirthComplete(payload.date_of_birth)) {
    return { error: "Patient date of birth is required (MM/DD/YYYY)." };
  }

  if (!payload.sex) {
    return { error: "Patient sex is required." };
  }

  const { data, error } = await supabase
    .from("patients")
    .insert({
      provider_id: providerId,
      ...payload,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Unable to create patient for this order." };
  }

  return { patientId: data.id };
}

function parseShippingFromFormData(formData: FormData): {
  shipTo?: ShipTo;
  shippingAddress?: string;
  error?: string;
} {
  const shipTo = String(formData.get("ship_to") ?? "").trim() as ShipTo;
  const shippingAddress = normalizeShippingAddress(
    String(formData.get("shipping_address") ?? ""),
  );

  if (shipTo !== "clinic" && shipTo !== "patient") {
    return { error: "Please choose a shipping destination." };
  }

  if (!shippingAddress) {
    return { error: "Shipping address is required." };
  }

  if (!isAddressComplete(parseStoredAddress(shippingAddress))) {
    return {
      error: "Please complete address line 1, city, state, and ZIP code.",
    };
  }

  return { shipTo, shippingAddress: normalizeShippingAddress(shippingAddress) };
}

async function persistShippingAddress({
  shipTo,
  shippingAddress,
  providerId,
  patientId,
  providerClinicAddress,
  patientAddress,
}: {
  shipTo: ShipTo;
  shippingAddress: string;
  providerId: string;
  patientId: string;
  providerClinicAddress: string | null;
  patientAddress: string | null;
}) {
  const supabase = await createClient();
  const schemaSupport = await getSchemaSupport(supabase);

  if (
    shipTo === "clinic" &&
    schemaSupport.providerClinicShipping &&
    shippingAddress !== normalizeShippingAddress(providerClinicAddress ?? "")
  ) {
    await supabase
      .from("providers")
      .update({ clinic_shipping_address: shippingAddress })
      .eq("id", providerId);
  }

  if (
    shipTo === "patient" &&
    shippingAddress !== normalizeShippingAddress(patientAddress ?? "")
  ) {
    await supabase
      .from("patients")
      .update({ shipping_address: shippingAddress })
      .eq("id", patientId);
  }
}

export async function submitOrderAction(
  _prevState: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const provider = await requireProvider();
  const supabase = await createClient();
  const schemaSupport = await getSchemaSupport(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const lineItemsInput = parseLineItems(formData);
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (lineItemsInput.length === 0) {
    return { error: "Add at least one product to the order." };
  }

  const { patientId, error: patientError } = await resolvePatientId(
    formData,
    provider.id,
  );

  if (patientError || !patientId) {
    return { error: patientError ?? "Patient is required." };
  }

  const { shipTo, shippingAddress, error: shippingError } =
    parseShippingFromFormData(formData);

  if (shippingError || !shipTo || !shippingAddress) {
    return { error: shippingError ?? "Shipping address is required." };
  }

  const products = await getProducts(true);
  const productMap = new Map(products.map((product) => [product.sku, product]));

  const orderItems = lineItemsInput.map((item) => {
    const product = productMap.get(item.productSku);
    if (!product) {
      throw new Error(`Unknown product SKU: ${item.productSku}`);
    }

    return {
      product_name: product.name,
      product_sku: product.sku,
      unit_price: product.price,
      quantity: item.quantity,
    };
  });

  type InsertedOrder = {
    id: string;
    created_at: string;
    provider_id: string;
    patient_id: string;
    notes: string | null;
    sync_error: string | null;
    ship_to?: ShipTo | null;
    shipping_address?: string | null;
  };

  let order: InsertedOrder | null = null;
  let orderError: { code?: string; message: string } | null = null;

  if (schemaSupport.orderShipping) {
    const result = await supabase
      .from("orders")
      .insert({
        provider_id: provider.id,
        patient_id: patientId,
        notes,
        ship_to: shipTo,
        shipping_address: shippingAddress,
      })
      .select(orderSelectColumnsWithShipping)
      .single();
    order = result.data;
    orderError = result.error;
  } else {
    const result = await supabase
      .from("orders")
      .insert({
        provider_id: provider.id,
        patient_id: patientId,
        notes: appendShippingToNotes(notes, shipTo, shippingAddress),
      })
      .select(orderSelectColumnsLegacy)
      .single();
    order = result.data;
    orderError = result.error;
  }

  if (orderError || !order) {
    console.error("Order insert failed:", orderError);
    return {
      error:
        orderError?.code === "PGRST204"
          ? "Database is missing shipping columns. Run supabase/migrations/005_shipping.sql in the Supabase SQL editor."
          : "Unable to create order.",
    };
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    orderItems.map((item) => ({
      order_id: order.id,
      ...item,
    })),
  );

  if (itemsError) {
    return { error: "Unable to save order items." };
  }

  const { data: patient } = await supabase
    .from("patients")
    .select(
      "id, first_name, last_name, email, phone, date_of_birth, allergies, sex, shipping_address",
    )
    .eq("id", patientId)
    .single();

  await persistShippingAddress({
    shipTo,
    shippingAddress,
    providerId: provider.id,
    patientId,
    providerClinicAddress: provider.clinic_shipping_address,
    patientAddress: patient?.shipping_address ?? null,
  });

  const orderWithDetails: OrderWithDetails = {
    ...order,
    ship_to: schemaSupport.orderShipping ? order.ship_to ?? shipTo : shipTo,
    shipping_address: schemaSupport.orderShipping
      ? order.shipping_address ?? shippingAddress
      : shippingAddress,
    patient: patient!,
    order_items: orderItems.map((item, index) => ({
      id: `${order.id}-${index}`,
      order_id: order.id,
      ...item,
    })),
  };

  let syncError: string | null = null;

  try {
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    await appendOrderToSheet({
      orderId: order.id,
      providerName: provider.full_name,
      providerEmail: user?.email ?? "",
      patientName: patient ? formatPatientName(patient) : "",
      patientEmail: patient?.email ?? "",
      patientPhone: patient?.phone ?? "",
      shippingAddress,
      lineItemsSummary: formatLineItemsSummary(orderItems),
      orderTotal: calculateOrderTotal(orderItems),
      portalUrl: `${appUrl.replace(/\/$/, "")}/orders`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync order to Google Sheets.";
    syncError = message;
    console.error("Google Sheets sync failed:", error);
  }

  try {
    await sendOrderNotificationEmail({
      order: orderWithDetails,
      providerName: provider.full_name,
      providerEmail: user?.email ?? "",
      providerPractice: provider.practice_name,
      providerPhone: provider.phone,
      shipTo,
      shippingAddress,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send order notification email.";
    syncError = syncError ? `${syncError} ${message}` : message;
    console.error("Order email failed:", error);
  }

  if (syncError) {
    await supabase
      .from("orders")
      .update({ sync_error: syncError })
      .eq("id", order.id);
  }

  revalidatePath("/orders");
  revalidatePath("/patients");
  revalidatePath(`/patients/${patientId}`);

  return {
    success: "Order submitted successfully.",
    warning: syncError ?? undefined,
    orderId: order.id,
  };
}

export async function getRecentOrders(limit = 20) {
  const provider = await requireProvider();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*, patient:patients(id, first_name, last_name, email, phone, date_of_birth, allergies, sex, shipping_address), order_items(*)")
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error("Unable to load orders.");
  }

  return (data ?? []) as OrderWithDetails[];
}

export async function getOrderById(orderId: string) {
  const provider = await requireProvider();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*, patient:patients(id, first_name, last_name, email, phone, date_of_birth, allergies, sex, shipping_address), order_items(*)")
    .eq("id", orderId)
    .eq("provider_id", provider.id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as OrderWithDetails & {
    patient: OrderWithDetails["patient"] & { date_of_birth: string | null };
  };
}

export async function reorderAction(orderId: string) {
  redirect(`/orders/new?reorder=${orderId}`);
}

export async function getInvites() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invite_tokens")
    .select("id, created_at, expires_at, used_at, used_by, created_by")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error("Unable to load invites.");
  }

  return data ?? [];
}

export async function loadProductsForOrderForm() {
  return getProducts();
}

export async function loadPatientsForOrderForm() {
  const provider = await requireProvider();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("patients")
    .select(
      "id, first_name, last_name, email, phone, date_of_birth, allergies, sex, shipping_address",
    )
    .eq("provider_id", provider.id)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) {
    throw new Error("Unable to load patients.");
  }

  return data ?? [];
}

export async function loadProviderShippingForOrderForm() {
  const provider = await requireProvider();
  return provider.clinic_shipping_address;
}
