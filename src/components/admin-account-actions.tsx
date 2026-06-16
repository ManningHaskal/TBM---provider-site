"use client";

import {
  deleteAccountAction,
  demoteAdminToProviderAction,
  promoteAccountToAdminAction,
} from "@/lib/actions/admin-account-actions";
import {
  getAccountDeleteBlockedMessage,
  type AccountDeleteEligibility,
} from "@/lib/providers/delete-eligibility";
import type { ProviderRole } from "@/lib/types";
import { Button } from "@/components/ui/button";

type AdminAccountActionsProps = {
  accountId: string;
  accountName: string;
  role: ProviderRole;
  deleteEligibility: AccountDeleteEligibility;
  isSelf: boolean;
  isSuperAdminViewer: boolean;
  isSuperAdminTarget: boolean;
};

export function AdminAccountActions({
  accountId,
  accountName,
  role,
  deleteEligibility,
  isSelf,
  isSuperAdminViewer,
  isSuperAdminTarget,
}: AdminAccountActionsProps) {
  if (isSelf) {
    return (
      <p className="text-sm text-tbm-text-muted">
        You cannot change or delete your own account from this page.
      </p>
    );
  }

  if (isSuperAdminTarget) {
    return (
      <p className="text-sm text-tbm-text-muted">
        This super admin account is protected from demotion and deletion.
      </p>
    );
  }

  const deleteBlockMessage = getAccountDeleteBlockedMessage(deleteEligibility);

  function handleDeleteClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (!deleteEligibility.canDelete) {
      event.preventDefault();
      window.alert(deleteBlockMessage);
      return;
    }

    const orderNote =
      deleteEligibility.orderCount > 0
        ? ` This will also delete ${deleteEligibility.orderCount} order(s), all patients, and the login for this account.`
        : " This will delete the login and any profile data for this account.";

    const confirmed = window.confirm(
      `Delete ${accountName}? This cannot be undone.${orderNote}`,
    );

    if (!confirmed) {
      event.preventDefault();
    }
  }

  const canDelete =
    deleteEligibility.canDelete &&
    (role === "provider" || (role === "admin" && isSuperAdminViewer));

  return (
    <div className="flex flex-wrap items-center gap-3">
      {role === "provider" ? (
        <form action={promoteAccountToAdminAction.bind(null, accountId)}>
          <Button type="submit" variant="secondary">
            Promote to admin
          </Button>
        </form>
      ) : null}

      {role === "admin" && isSuperAdminViewer ? (
        <form action={demoteAdminToProviderAction.bind(null, accountId)}>
          <Button type="submit" variant="secondary">
            Demote to provider
          </Button>
        </form>
      ) : null}

      {canDelete ? (
        <form action={deleteAccountAction.bind(null, accountId)}>
          <Button
            type="submit"
            variant="secondary"
            className="border-red-200 text-tbm-red hover:bg-red-50"
            onClick={handleDeleteClick}
            title={deleteBlockMessage || undefined}
          >
            Delete account
          </Button>
        </form>
      ) : role === "admin" && !isSuperAdminViewer ? (
        <p className="text-sm text-tbm-text-muted">
          Only the super admin can delete admin accounts.
        </p>
      ) : !deleteEligibility.canDelete ? (
        <p className="text-sm text-tbm-text-muted">{deleteBlockMessage}</p>
      ) : null}
    </div>
  );
}
