import {
  formatHeightFromFeetInches,
  formatWeightWithLbs,
} from "@/lib/format/patient";
import type { PatientFormData } from "@/lib/types";

export function readPatientFormData(formData: FormData): PatientFormData {
  const feet = String(formData.get("height_feet") ?? "").trim();
  const inches = String(formData.get("height_inches") ?? "").trim();
  const hiddenHeight = String(formData.get("height") ?? "").trim();

  return {
    first_name: String(formData.get("first_name") ?? ""),
    last_name: String(formData.get("last_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    date_of_birth: String(formData.get("date_of_birth") ?? ""),
    weight: String(formData.get("weight") ?? ""),
    height: hiddenHeight || formatHeightFromFeetInches(feet, inches) || "",
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
    weight: formatWeightWithLbs(data.weight),
    height: data.height.trim() || null,
    sex: data.sex.trim() || null,
    shipping_address: data.shipping_address.trim() || null,
  };
}
