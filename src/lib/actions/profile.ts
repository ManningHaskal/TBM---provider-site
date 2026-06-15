"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProvider, requireUser } from "@/lib/auth/session";
import { normalizeShippingAddress } from "@/lib/shipping/addresses";
import { isAddressComplete, parseStoredAddress } from "@/lib/shipping/address-model";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSchemaSupport } from "@/lib/supabase/schema-support";

export type ProfileActionState = {
  error?: string;
  success?: string;
};

export async function updateProfileAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireUser();
  const provider = await requireProvider();

  if (provider.user_id !== user.id) {
    return { error: "Unable to verify your account." };
  }

  const supabase = await createClient();
  const schemaSupport = await getSchemaSupport(supabase);

  const fullName = String(formData.get("full_name") ?? "").trim();
  const practiceName = String(formData.get("practice_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const clinicShippingAddress = String(
    formData.get("clinic_shipping_address") ?? "",
  ).trim();

  if (!fullName || !practiceName) {
    return { error: "Full name and practice name are required." };
  }

  if (schemaSupport.providerClinicShipping) {
    if (
      !clinicShippingAddress ||
      !isAddressComplete(parseStoredAddress(clinicShippingAddress))
    ) {
      return {
        error: "Please complete clinic address line 1, city, state, and ZIP code.",
      };
    }
  }

  const updatePayload: {
    full_name: string;
    practice_name: string;
    phone: string | null;
    clinic_shipping_address?: string;
  } = {
    full_name: fullName,
    practice_name: practiceName,
    phone,
  };

  if (schemaSupport.providerClinicShipping && clinicShippingAddress) {
    updatePayload.clinic_shipping_address =
      normalizeShippingAddress(clinicShippingAddress);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("providers")
    .update(updatePayload)
    .eq("id", provider.id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error) {
    console.error("Profile update failed:", error);
    return { error: "Unable to update profile. Please try again." };
  }

  if (!data) {
    return { error: "Unable to update profile. No matching provider record was found." };
  }

  revalidatePath("/profile");
  revalidatePath("/orders/new");
  revalidatePath("/home", "layout");
  redirect("/profile?success=updated");
}
