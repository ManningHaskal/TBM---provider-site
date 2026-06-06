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
import { normalizeShippingAddress } from "@/lib/shipping/addresses";
import { createClient } from "@/lib/supabase/server";
import type { OrderLineInput, OrderWithDetails, ShipTo } from "@/lib/types";

export type OrderActionState = {
  error?: string;
  success?: string;
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

  return { shipTo, shippingAddress };
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

  if (
    shipTo === "clinic" &&
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

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      provider_id: provider.id,
      patient_id: patientId,
      notes,
      ship_to: shipTo,
      shipping_address: shippingAddress,
    })
    .select("id, created_at, provider_id, patient_id, notes, ship_to, shipping_address, sync_error")
    .single();

  if (orderError || !order) {
    return { error: "Unable to create order." };
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
      "id, first_name, last_name, email, phone, date_of_birth, weight, height, sex, shipping_address",
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

    await sendOrderNotificationEmail({
      order: orderWithDetails,
      providerName: provider.full_name,
      providerEmail: user?.email ?? "",
      shipTo,
      shippingAddress,
    });
  } catch (error) {
    syncError =
      error instanceof Error ? error.message : "Failed to sync order externally.";
    await supabase
      .from("orders")
      .update({ sync_error: syncError })
      .eq("id", order.id);
  }

  revalidatePath("/orders");
  revalidatePath("/patients");
  revalidatePath(`/patients/${patientId}`);

  return {
    success: syncError
      ? "Order saved, but external notification had an issue."
      : "Order submitted successfully.",
    orderId: order.id,
  };
}

export async function getRecentOrders(limit = 20) {
  const provider = await requireProvider();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*, patient:patients(id, first_name, last_name, email, phone, date_of_birth, weight, height, sex, shipping_address), order_items(*)")
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
    .select("*, patient:patients(id, first_name, last_name, email, phone, date_of_birth, weight, height, sex, shipping_address), order_items(*)")
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
      "id, first_name, last_name, email, phone, date_of_birth, weight, height, sex, shipping_address",
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
