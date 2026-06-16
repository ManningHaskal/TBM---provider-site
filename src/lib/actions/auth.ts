"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  buildInviteUrl,
  generateInviteToken,
  getInviteExpiryDate,
  hashInviteToken,
  isPermanentInviteToken,
} from "@/lib/auth/invites";
import { isAdminRole } from "@/lib/auth/super-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeShippingAddress } from "@/lib/shipping/addresses";
import { isAddressComplete, parseStoredAddress } from "@/lib/shipping/address-model";

export type AuthActionState = {
  error?: string;
  success?: string;
};

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Invalid email or password." };
  }

  redirect("/home");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function signupAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const inviteToken = String(formData.get("invite") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const practiceName = String(formData.get("practice_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const clinicShippingAddress = String(
    formData.get("clinic_shipping_address") ?? "",
  ).trim();

  if (!inviteToken) {
    return { error: "A valid invite link is required to create an account." };
  }

  if (!email || !password || !fullName || !practiceName) {
    return { error: "Please complete all required fields." };
  }

  if (
    clinicShippingAddress &&
    !isAddressComplete(parseStoredAddress(clinicShippingAddress))
  ) {
    return {
      error: "Please complete clinic address line 1, city, state, and ZIP code.",
    };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const admin = createAdminClient();
  const usingPermanentInvite = isPermanentInviteToken(inviteToken);

  if (!usingPermanentInvite) {
    const tokenHash = hashInviteToken(inviteToken);

    const { data: invite, error: inviteError } = await admin
      .from("invite_tokens")
      .select("*")
      .eq("token_hash", tokenHash)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (inviteError || !invite) {
      return { error: "This invite link is invalid or has expired." };
    }
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Unable to create account." };
  }

  const { data: provider, error: providerError } = await admin
    .from("providers")
    .insert({
      user_id: authData.user.id,
      full_name: fullName,
      practice_name: practiceName,
      phone: phone || null,
      clinic_shipping_address: clinicShippingAddress
        ? normalizeShippingAddress(clinicShippingAddress)
        : null,
      role: "provider",
    })
    .select("*")
    .single();

  if (providerError || !provider) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: "Unable to create provider profile." };
  }

  if (!usingPermanentInvite) {
    const tokenHash = hashInviteToken(inviteToken);
    const { data: invite } = await admin
      .from("invite_tokens")
      .select("id")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (invite) {
      const { error: markUsedError } = await admin
        .from("invite_tokens")
        .update({
          used_at: new Date().toISOString(),
          used_by: provider.id,
        })
        .eq("id", invite.id);

      if (markUsedError) {
        return { error: "Account created but invite could not be marked as used." };
      }
    }
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return {
      success: "Account created. Please sign in with your new credentials.",
    };
  }

  redirect("/home");
}

export async function validateInviteToken(token: string): Promise<boolean> {
  if (!token) {
    return false;
  }

  if (isPermanentInviteToken(token)) {
    return true;
  }

  const admin = createAdminClient();
  const tokenHash = hashInviteToken(token);

  const { data: invite } = await admin
    .from("invite_tokens")
    .select("id")
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  return Boolean(invite);
}

export async function createInviteAction(): Promise<{
  error?: string;
  inviteUrl?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data: provider } = await supabase
    .from("providers")
    .select("id, role")
    .eq("user_id", user.id)
    .single();

  if (!provider || !isAdminRole(provider.role)) {
    return { error: "Only admins can create invites." };
  }

  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);

  const { error } = await supabase.from("invite_tokens").insert({
    token_hash: tokenHash,
    created_by: provider.id,
    expires_at: getInviteExpiryDate().toISOString(),
  });

  if (error) {
    return { error: "Unable to create invite." };
  }

  revalidatePath("/admin/invites");
  return { inviteUrl: buildInviteUrl(token) };
}
