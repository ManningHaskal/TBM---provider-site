"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getAuthEmail,
  isAdminRole,
  isSuperAdminAccount,
  resolveSuperAdminViewer,
} from "@/lib/auth/super-admin";
import { getAccountDeleteEligibility } from "@/lib/providers/delete-eligibility";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ProviderRole } from "@/lib/types";

type AdminActor = {
  providerId: string;
  email: string;
  isSuperAdmin: boolean;
};

async function requireAdminActor(): Promise<AdminActor | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: provider } = await supabase
    .from("providers")
    .select("id, role")
    .eq("user_id", user.id)
    .single();

  if (!provider || !isAdminRole(provider.role as ProviderRole)) {
    return null;
  }

  const viewer = await resolveSuperAdminViewer(
    provider.id,
    user.id,
    provider.role as ProviderRole,
    getAuthEmail(user),
  );

  return {
    providerId: provider.id,
    email: viewer.email ?? "",
    isSuperAdmin: viewer.isSuperAdmin,
  };
}

async function getTargetAccount(providerId: string) {
  const admin = createAdminClient();

  const { data: provider, error } = await admin
    .from("providers")
    .select("id, user_id, role, full_name")
    .eq("id", providerId)
    .maybeSingle();

  if (error || !provider) {
    return null;
  }

  const { data: authData } = await admin.auth.admin.getUserById(provider.user_id);
  const email = getAuthEmail(authData.user ?? null);

  return {
    ...provider,
    email,
    isSuperAdminTarget: isSuperAdminAccount(
      provider.role as ProviderRole,
      email,
    ),
  };
}

async function getAccountDeleteEligibilityForProvider(providerId: string) {
  const admin = createAdminClient();

  const { count, error: countError } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", providerId);

  if (countError) {
    throw new Error("Unable to check account orders.");
  }

  const { data: lastOrder, error: lastOrderError } = await admin
    .from("orders")
    .select("created_at")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastOrderError) {
    throw new Error("Unable to check account orders.");
  }

  return getAccountDeleteEligibility(count ?? 0, lastOrder?.created_at ?? null);
}

export async function getAccountDeleteEligibilityForAccount(providerId: string) {
  return getAccountDeleteEligibilityForProvider(providerId);
}

export async function promoteAccountToAdminAction(providerId: string) {
  const actor = await requireAdminActor();
  if (!actor) {
    redirect("/home");
  }

  if (actor.providerId === providerId) {
    redirect(`/admin/providers/${providerId}?error=self_action`);
  }

  const target = await getTargetAccount(providerId);
  if (!target) {
    redirect("/admin/providers?error=not_found");
  }

  if (target.role === "admin" || target.role === "super_admin") {
    redirect(`/admin/providers/${providerId}?error=already_admin`);
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("providers")
    .update({ role: "admin" })
    .eq("id", providerId);

  if (error) {
    redirect(`/admin/providers/${providerId}?error=promote_failed`);
  }

  revalidatePath("/admin/providers");
  revalidatePath(`/admin/providers/${providerId}`);
  redirect(`/admin/providers/${providerId}?success=promoted`);
}

export async function demoteAdminToProviderAction(providerId: string) {
  const actor = await requireAdminActor();
  if (!actor?.isSuperAdmin) {
    redirect("/home");
  }

  if (actor.providerId === providerId) {
    redirect(`/admin/providers/${providerId}?error=self_action`);
  }

  const target = await getTargetAccount(providerId);
  if (!target) {
    redirect("/admin/providers?error=not_found");
  }

  if (target.role !== "admin") {
    redirect(`/admin/providers/${providerId}?error=not_admin`);
  }

  if (target.isSuperAdminTarget) {
    redirect(`/admin/providers/${providerId}?error=super_admin_protected`);
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("providers")
    .update({ role: "provider" })
    .eq("id", providerId);

  if (error) {
    redirect(`/admin/providers/${providerId}?error=demote_failed`);
  }

  revalidatePath("/admin/providers");
  revalidatePath(`/admin/providers/${providerId}`);
  redirect(`/admin/providers/${providerId}?success=demoted`);
}

export async function deleteAccountAction(providerId: string) {
  const actor = await requireAdminActor();
  if (!actor) {
    redirect("/home");
  }

  if (actor.providerId === providerId) {
    redirect(`/admin/providers/${providerId}?error=self_action`);
  }

  const target = await getTargetAccount(providerId);
  if (!target) {
    redirect("/admin/providers?error=not_found");
  }

  if (target.isSuperAdminTarget) {
    redirect(`/admin/providers/${providerId}?error=super_admin_protected`);
  }

  if (
    (target.role === "admin" || target.role === "super_admin") &&
    !actor.isSuperAdmin
  ) {
    redirect(`/admin/providers/${providerId}?error=admin_delete_forbidden`);
  }

  const eligibility = await getAccountDeleteEligibilityForProvider(providerId);
  if (!eligibility.canDelete) {
    redirect(`/admin/providers/${providerId}?error=delete_cooldown`);
  }

  const admin = createAdminClient();

  const { error: providerDeleteError } = await admin
    .from("providers")
    .delete()
    .eq("id", providerId);

  if (providerDeleteError) {
    redirect(`/admin/providers/${providerId}?error=delete_failed`);
  }

  const { error: authDeleteError } = await admin.auth.admin.deleteUser(target.user_id);
  if (authDeleteError) {
    redirect(`/admin/providers/${providerId}?error=delete_failed`);
  }

  revalidatePath("/admin/providers");
  redirect("/admin/providers?success=account_deleted");
}
