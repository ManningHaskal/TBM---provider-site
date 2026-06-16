/**
 * Seed the first admin provider account.
 *
 * Usage:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='secure-password' ADMIN_NAME='Your Name' ADMIN_PRACTICE='TexBioMed' node scripts/seed-admin.mjs
 *
 * Set SUPER_ADMIN_EMAIL to the same email in .env.local for super-admin controls.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const fullName = process.env.ADMIN_NAME ?? "TexBioMed Admin";
const practiceName = process.env.ADMIN_PRACTICE ?? "TexBioMed";

if (!url || !serviceRoleKey || !email || !password) {
  console.error(
    "Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existingUsers } = await supabase.auth.admin.listUsers();
const existing = existingUsers.users.find((user) => user.email === email);

let userId = existing?.id;

if (!userId) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    console.error("Failed to create admin auth user:", error?.message);
    process.exit(1);
  }

  userId = data.user.id;
} else {
  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  });

  if (updateError) {
    console.error("Failed to update admin password:", updateError.message);
    process.exit(1);
  }

  console.log("Updated password for existing admin user.");
}

const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? email)
  .trim()
  .toLowerCase();
const role = email.trim().toLowerCase() === superAdminEmail ? "super_admin" : "admin";

const { data: provider, error: providerError } = await supabase
  .from("providers")
  .upsert(
    {
      user_id: userId,
      full_name: fullName,
      practice_name: practiceName,
      role,
    },
    { onConflict: "user_id" },
  )
  .select("*")
  .single();

if (providerError) {
  console.error("Failed to create admin provider profile:", providerError.message);
  process.exit(1);
}

console.log("Admin account ready:");
console.log(`  Email: ${email}`);
console.log(`  Provider ID: ${provider.id}`);
console.log("Sign in at / and visit /admin/invites to generate provider invites.");
