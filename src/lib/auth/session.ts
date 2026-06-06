import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  const provider = await requireProvider();

  if (provider.role !== "admin") {
    redirect("/home");
  }

  return provider;
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
