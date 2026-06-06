import { requireAdmin } from "@/lib/auth/session";
import { getInvites } from "@/lib/actions/orders";
import { InviteAdminPanel } from "@/components/invite-admin-panel";

export default async function AdminInvitesPage() {
  await requireAdmin();
  const invites = await getInvites();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-tbm-navy">Provider invites</h1>
        <p className="text-sm text-tbm-text-muted">
          Generate secure invite links for medical providers.
        </p>
      </div>
      <InviteAdminPanel invites={invites} />
    </div>
  );
}
