import { ProfileForm } from "@/components/profile-form";
import { logoutAction } from "@/lib/actions/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireProvider } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getSchemaSupport } from "@/lib/supabase/schema-support";

type ProfilePageProps = {
  searchParams: Promise<{ success?: string }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const query = await searchParams;
  const provider = await requireProvider();
  const supabase = await createClient();
  const schemaSupport = await getSchemaSupport(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="tbm-heading text-2xl font-semibold">Profile</h1>
        <p className="mt-2 text-sm text-tbm-text-muted">
          Update your provider and clinic information used for orders.
        </p>
      </div>

      <Card title="Provider information">
        <ProfileForm
          key={`${provider.full_name}-${provider.practice_name}-${provider.phone ?? ""}-${provider.clinic_shipping_address ?? ""}`}
          provider={provider}
          email={user?.email ?? ""}
          clinicShippingEnabled={schemaSupport.providerClinicShipping}
          initialSuccess={query.success === "updated"}
        />
      </Card>

      <form action={logoutAction} className="border-t border-tbm-border pt-6">
        <Button type="submit" variant="secondary" className="border-red-200 text-tbm-red hover:bg-red-50">
          Sign out
        </Button>
      </form>
    </div>
  );
}
