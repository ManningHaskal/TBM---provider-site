/**
 * Seed the first admin provider account.
 *
 * Usage:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='secure-password' ADMIN_NAME='Your Name' ADMIN_PRACTICE='TexBioMed' node scripts/seed-admin.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.
 */

import { createClient } from "@supabase/supabase-js";

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
}

const { data: provider, error: providerError } = await supabase
  .from("providers")
  .upsert(
    {
      user_id: userId,
      full_name: fullName,
      practice_name: practiceName,
      role: "admin",
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
