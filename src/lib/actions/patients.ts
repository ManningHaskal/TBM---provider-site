"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProvider } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { PatientFormData } from "@/lib/types";

export type PatientActionState = {
  error?: string;
  success?: string;
};

function sanitizePatientInput(data: PatientFormData) {
  return {
    full_name: data.full_name.trim(),
    email: data.email.trim() || null,
    phone: data.phone.trim() || null,
    date_of_birth: data.date_of_birth.trim() || null,
    weight: data.weight.trim() || null,
    height: data.height.trim() || null,
    sex: data.sex.trim() || null,
    shipping_address: data.shipping_address.trim() || null,
  };
}

function readPatientFormData(formData: FormData): PatientFormData {
  return {
    full_name: String(formData.get("full_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    date_of_birth: String(formData.get("date_of_birth") ?? ""),
    weight: String(formData.get("weight") ?? ""),
    height: String(formData.get("height") ?? ""),
    sex: String(formData.get("sex") ?? ""),
    shipping_address: String(formData.get("shipping_address") ?? ""),
  };
}

export async function createPatientAction(
  _prevState: PatientActionState,
  formData: FormData,
): Promise<PatientActionState> {
  const provider = await requireProvider();
  const supabase = await createClient();
  const payload = sanitizePatientInput(readPatientFormData(formData));

  if (!payload.full_name) {
    return { error: "Full name is required." };
  }

  const { error } = await supabase.from("patients").insert({
    provider_id: provider.id,
    ...payload,
  });

  if (error) {
    return { error: "Unable to create patient." };
  }

  revalidatePath("/patients");
  redirect("/patients");
}

export async function updatePatientAction(
  patientId: string,
  _prevState: PatientActionState,
  formData: FormData,
): Promise<PatientActionState> {
  await requireProvider();
  const supabase = await createClient();
  const payload = sanitizePatientInput(readPatientFormData(formData));

  if (!payload.full_name) {
    return { error: "Full name is required." };
  }

  const { error } = await supabase
    .from("patients")
    .update(payload)
    .eq("id", patientId);

  if (error) {
    return { error: "Unable to update patient." };
  }

  revalidatePath("/patients");
  revalidatePath(`/patients/${patientId}`);
  redirect(`/patients/${patientId}`);
}

export async function getPatients(search?: string) {
  const provider = await requireProvider();
  const supabase = await createClient();

  let query = supabase
    .from("patients")
    .select("*")
    .eq("provider_id", provider.id)
    .order("full_name", { ascending: true });

  if (search?.trim()) {
    const term = search.trim();
    query = query.or(
      `full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load patients.");
  }

  return data ?? [];
}

export async function getPatientById(patientId: string) {
  const provider = await requireProvider();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .eq("provider_id", provider.id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getPatientOrders(patientId: string, limit = 10) {
  const provider = await requireProvider();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("provider_id", provider.id)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error("Unable to load patient orders.");
  }

  return data ?? [];
}
