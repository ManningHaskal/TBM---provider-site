"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProvider } from "@/lib/auth/session";
import { formatPatientName } from "@/lib/format/patient";
import {
  readPatientFormData,
  sanitizePatientInput,
} from "@/lib/patient-form-data";
import {
  getPatientDeleteBlockedMessage,
  getPatientDeleteEligibility,
} from "@/lib/patients/delete-eligibility";
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

export async function getPatientDeleteEligibilityForPatient(patientId: string) {
  const provider = await requireProvider();
  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", patientId)
    .eq("provider_id", provider.id);

  if (countError) {
    throw new Error("Unable to check patient orders.");
  }

  const orderCount = count ?? 0;

  if (orderCount === 0) {
    return getPatientDeleteEligibility(0, null);
  }

  const { data: lastOrder, error: lastOrderError } = await supabase
    .from("orders")
    .select("created_at")
    .eq("patient_id", patientId)
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastOrderError) {
    throw new Error("Unable to check patient orders.");
  }

  return getPatientDeleteEligibility(orderCount, lastOrder?.created_at ?? null);
}

export async function deletePatientAction(patientId: string) {
  const provider = await requireProvider();
  const supabase = await createClient();
  const eligibility = await getPatientDeleteEligibilityForPatient(patientId);

  if (!eligibility.canDelete) {
    redirect(`/patients/${patientId}?error=delete_cooldown`);
  }

  if (eligibility.orderCount > 0) {
    const { error: ordersError } = await supabase
      .from("orders")
      .delete()
      .eq("patient_id", patientId)
      .eq("provider_id", provider.id);

    if (ordersError) {
      redirect(`/patients/${patientId}?error=delete_failed`);
    }
  }

  const { error } = await supabase
    .from("patients")
    .delete()
    .eq("id", patientId)
    .eq("provider_id", provider.id);

  if (error) {
    redirect(`/patients/${patientId}?error=delete_failed`);
  }

  revalidatePath("/patients");
  revalidatePath("/orders");
  redirect("/patients");
}

export async function deleteAllPatientOrdersForTestingAction(patientId: string) {
  const provider = await requireProvider();
  const supabase = await createClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .eq("provider_id", provider.id)
    .maybeSingle();

  if (!patient) {
    redirect(`/patients/${patientId}?error=delete_orders_failed`);
  }

  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("patient_id", patientId)
    .eq("provider_id", provider.id);

  if (error) {
    redirect(`/patients/${patientId}?error=delete_orders_failed`);
  }

  revalidatePath("/orders");
  revalidatePath("/patients");
  revalidatePath(`/patients/${patientId}`);
  redirect(`/patients/${patientId}?success=orders_deleted`);
}

export async function getPatientOrderCount(patientId: string): Promise<number> {
  const provider = await requireProvider();
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", patientId)
    .eq("provider_id", provider.id);

  if (error) {
    throw new Error("Unable to count patient orders.");
  }

  return count ?? 0;
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
