import type { PatientFormData } from "@/lib/types";

export function readPatientFormData(formData: FormData): PatientFormData {
  return {
    first_name: String(formData.get("first_name") ?? ""),
    last_name: String(formData.get("last_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    date_of_birth: String(formData.get("date_of_birth") ?? ""),
    allergies: String(formData.get("allergies") ?? ""),
    sex: String(formData.get("sex") ?? ""),
    shipping_address: String(formData.get("shipping_address") ?? ""),
  };
}

export function sanitizePatientInput(data: PatientFormData) {
  return {
    first_name: data.first_name.trim(),
    last_name: data.last_name.trim(),
    email: data.email.trim() || null,
    phone: data.phone.trim() || null,
    date_of_birth: data.date_of_birth.trim() || null,
    allergies: data.allergies.trim() || null,
    sex: data.sex.trim() || null,
    shipping_address: data.shipping_address.trim() || null,
  };
}
