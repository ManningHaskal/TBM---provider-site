"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProvider } from "@/lib/auth/session";
import { formatPatientName } from "@/lib/format/patient";
import {
  readPatientFormData,
  sanitizePatientInput,
} from "@/lib/patient-form-data";
import { createClient } from "@/lib/supabase/server";

export type PatientActionState = {
  error?: string;
  success?: string;
};

export async function createPatientAction(
  _prevState: PatientActionState,
  formData: FormData,
): Promise<PatientActionState> {
  const provider = await requireProvider();
  const supabase = await createClient();
  const payload = sanitizePatientInput(readPatientFormData(formData));

  if (!payload.first_name || !payload.last_name) {
    return { error: "First and last name are required." };
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

  if (!payload.first_name || !payload.last_name) {
    return { error: "First and last name are required." };
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
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (search?.trim()) {
    const term = search.trim();
    query = query.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`,
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

export { formatPatientName };
