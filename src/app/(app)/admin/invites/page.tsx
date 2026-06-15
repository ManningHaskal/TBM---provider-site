import { requireAdmin } from "@/lib/auth/session";
import { getPermanentInviteUrl } from "@/lib/auth/invites";
import { getInvites } from "@/lib/actions/orders";
import { InviteAdminPanel } from "@/components/invite-admin-panel";

export default async function AdminInvitesPage() {
  await requireAdmin();
  const [invites, permanentInviteUrl] = await Promise.all([
    getInvites(),
    Promise.resolve(getPermanentInviteUrl()),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-tbm-navy">Provider invites</h1>
        <p className="text-sm text-tbm-text-muted">
          Share the permanent signup link with providers, or generate one-time invites.
        </p>
      </div>
      <InviteAdminPanel invites={invites} permanentInviteUrl={permanentInviteUrl} />
    </div>
  );
}
