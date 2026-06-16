"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { OrderItem, Patient, Provider, ProviderRole } from "@/lib/types";

export type ProviderAccountRow = {
  id: string;
  full_name: string;
  practice_name: string;
  phone: string | null;
  email: string;
  role: ProviderRole;
  patientCount: number;
  orderCount: number;
  created_at: string;
};

export type ProviderPatientWithOrders = Patient & {
  orders: Array<{
    id: string;
    created_at: string;
    notes: string | null;
    ship_to: string | null;
    shipping_address: string | null;
    order_items: OrderItem[];
  }>;
};

export type ProviderAccountDetail = Provider & {
  email: string;
  patients: ProviderPatientWithOrders[];
};

async function getEmailForUserId(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

export async function getProviderAccounts(search?: string): Promise<ProviderAccountRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("providers")
    .select("id, full_name, practice_name, phone, user_id, role, created_at")
    .order("role")
    .order("practice_name")
    .order("full_name");

  if (search?.trim()) {
    const term = search.trim();
    query = query.or(
      `full_name.ilike.%${term}%,practice_name.ilike.%${term}%,phone.ilike.%${term}%`,
    );
  }

  const { data: providers, error } = await query;

  if (error || !providers) {
    throw new Error("Unable to load provider accounts.");
  }

  const [{ data: patients }, { data: orders }] = await Promise.all([
    supabase.from("patients").select("id, provider_id"),
    supabase.from("orders").select("id, provider_id"),
  ]);

  const patientCountByProvider = new Map<string, number>();
  for (const patient of patients ?? []) {
    patientCountByProvider.set(
      patient.provider_id,
      (patientCountByProvider.get(patient.provider_id) ?? 0) + 1,
    );
  }

  const orderCountByProvider = new Map<string, number>();
  for (const order of orders ?? []) {
    orderCountByProvider.set(
      order.provider_id,
      (orderCountByProvider.get(order.provider_id) ?? 0) + 1,
    );
  }

  const rows: ProviderAccountRow[] = [];

  for (const provider of providers) {
    const email = await getEmailForUserId(provider.user_id);
    if (!email) {
      continue;
    }

    rows.push({
      id: provider.id,
      full_name: provider.full_name,
      practice_name: provider.practice_name,
      phone: provider.phone,
      email,
      role: provider.role as ProviderRole,
      patientCount: patientCountByProvider.get(provider.id) ?? 0,
      orderCount: orderCountByProvider.get(provider.id) ?? 0,
      created_at: provider.created_at,
    });
  }

  return rows;
}

export async function getProviderAccountById(
  providerId: string,
): Promise<ProviderAccountDetail | null> {
  const supabase = await createClient();

  const { data: provider, error } = await supabase
    .from("providers")
    .select("*")
    .eq("id", providerId)
    .maybeSingle();

  if (error || !provider) {
    return null;
  }

  const email = await getEmailForUserId(provider.user_id);
  if (!email) {
    return null;
  }

  const [{ data: patients }, { data: orders }] = await Promise.all([
    supabase
      .from("patients")
      .select("*")
      .eq("provider_id", providerId)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true }),
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false }),
  ]);

  const ordersByPatient = new Map<string, ProviderPatientWithOrders["orders"]>();

  for (const order of orders ?? []) {
    const patientOrders = ordersByPatient.get(order.patient_id) ?? [];
    patientOrders.push({
      id: order.id,
      created_at: order.created_at,
      notes: order.notes,
      ship_to: order.ship_to,
      shipping_address: order.shipping_address,
      order_items: (order.order_items ?? []) as OrderItem[],
    });
    ordersByPatient.set(order.patient_id, patientOrders);
  }

  const patientsWithOrders: ProviderPatientWithOrders[] = (patients ?? []).map((patient) => ({
    ...(patient as Patient),
    orders: ordersByPatient.get(patient.id) ?? [],
  }));

  return {
    ...(provider as Provider),
    email,
    patients: patientsWithOrders,
  };
}
