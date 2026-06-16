import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAuthEmail,
  isAdminRole,
  syncSuperAdminRoleIfNeeded,
} from "@/lib/auth/super-admin";
import type { Provider } from "@/lib/types";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return user;
}

export async function requireProvider(): Promise<Provider> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: provider, error } = await supabase
    .from("providers")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !provider) {
    redirect("/");
  }

  return provider as Provider;
}

export async function requireAdmin(): Promise<Provider> {
  const user = await requireUser();
  const provider = await requireProvider();

  if (!isAdminRole(provider.role)) {
    redirect("/home");
  }

  const email = getAuthEmail(user);
  const role = await syncSuperAdminRoleIfNeeded(provider.id, provider.role, email);

  return { ...provider, role };
}

export async function getOptionalProvider(): Promise<Provider | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: provider } = await supabase
    .from("providers")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (provider as Provider | null) ?? null;
}
