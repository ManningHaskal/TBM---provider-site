import { createAdminClient } from "@/lib/supabase/admin";
import type { ProviderRole } from "@/lib/types";

export function getSuperAdminEmail(): string | null {
  const email =
    process.env.SUPER_ADMIN_EMAIL?.trim() || process.env.ADMIN_EMAIL?.trim();
  return email ? email.toLowerCase() : null;
}

export function getAuthEmail(
  user: {
    email?: string | null;
    user_metadata?: Record<string, unknown> | null;
  } | null,
): string | null {
  if (!user) {
    return null;
  }

  if (user.email?.trim()) {
    return user.email.trim();
  }

  const metadataEmail = user.user_metadata?.email;
  if (typeof metadataEmail === "string" && metadataEmail.trim()) {
    return metadataEmail.trim();
  }

  return null;
}

export async function getAuthEmailForUserId(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  return getAuthEmail(data.user ?? null);
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const superAdminEmail = getSuperAdminEmail();
  return Boolean(superAdminEmail && email.trim().toLowerCase() === superAdminEmail);
}

export function isAdminRole(role: ProviderRole): boolean {
  return role === "admin" || role === "super_admin";
}

export function isSuperAdminRole(role: ProviderRole): boolean {
  return role === "super_admin";
}

export function isSuperAdminAccount(
  role: ProviderRole,
  email: string | null | undefined,
): boolean {
  return isSuperAdminRole(role) || isSuperAdminEmail(email);
}

export async function syncSuperAdminRoleIfNeeded(
  providerId: string,
  role: ProviderRole,
  email: string | null | undefined,
): Promise<ProviderRole> {
  if (isSuperAdminRole(role) || !isSuperAdminEmail(email)) {
    return role;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("providers")
    .update({ role: "super_admin" })
    .eq("id", providerId);

  if (error) {
    return role;
  }

  return "super_admin";
}

export async function resolveSuperAdminViewer(
  providerId: string,
  userId: string,
  role: ProviderRole,
  sessionEmail: string | null | undefined,
): Promise<{ role: ProviderRole; isSuperAdmin: boolean; email: string | null }> {
  const email = sessionEmail?.trim() || (await getAuthEmailForUserId(userId));
  const syncedRole = await syncSuperAdminRoleIfNeeded(providerId, role, email);

  return {
    role: syncedRole,
    email,
    isSuperAdmin: isSuperAdminAccount(syncedRole, email),
  };
}
