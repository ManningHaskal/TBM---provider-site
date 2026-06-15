"use client";

import { useState, useTransition } from "react";
import { createInviteAction } from "@/lib/actions/auth";
import type { InviteToken } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type InviteAdminPanelProps = {
  invites: InviteToken[];
  permanentInviteUrl: string | null;
};

export function InviteAdminPanel({ invites, permanentInviteUrl }: InviteAdminPanelProps) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerateInvite() {
    startTransition(async () => {
      setError(null);
      const result = await createInviteAction();
      if (result.error) {
        setError(result.error);
        setInviteUrl(null);
        return;
      }
      setInviteUrl(result.inviteUrl ?? null);
    });
  }

  async function copyInviteUrl(url: string) {
    await navigator.clipboard.writeText(url);
  }

  return (
    <div className="flex flex-col gap-6">
      {permanentInviteUrl ? (
        <Card title="Permanent signup link">
          <p className="mb-4 text-sm text-tbm-text-muted">
            This link never expires and can be used by unlimited providers. Share it
            with anyone who needs to create an account.
          </p>
          <div className="rounded-lg border border-tbm-red/20 bg-red-50 p-4">
            <p className="break-all text-sm text-tbm-red">{permanentInviteUrl}</p>
            <Button
              type="button"
              variant="secondary"
              className="mt-3"
              onClick={() => copyInviteUrl(permanentInviteUrl)}
            >
              Copy permanent link
            </Button>
          </div>
        </Card>
      ) : (
        <Card title="Permanent signup link">
          <p className="text-sm text-tbm-text-muted">
            Set <code className="text-tbm-navy">PERMANENT_INVITE_TOKEN</code> in your
            environment to enable a reusable signup link.
          </p>
        </Card>
      )}

      <Card title="One-time invite (optional)">
        <p className="mb-4 text-sm text-tbm-text-muted">
          Generate a single-use invite link valid for 7 days if you need a temporary
          link instead.
        </p>
        <Button onClick={handleGenerateInvite} disabled={isPending} variant="secondary">
          {isPending ? "Generating..." : "Generate one-time invite"}
        </Button>
        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {inviteUrl ? (
          <div className="mt-4 rounded-lg border border-tbm-border bg-tbm-accent-light p-4">
            <p className="mb-2 text-sm font-medium text-tbm-navy">One-time invite link</p>
            <p className="break-all text-sm text-tbm-red">{inviteUrl}</p>
            <Button
              type="button"
              variant="secondary"
              className="mt-3"
              onClick={() => copyInviteUrl(inviteUrl)}
            >
              Copy link
            </Button>
          </div>
        ) : null}
      </Card>

      <Card title="Recent one-time invites">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-tbm-border text-tbm-text-muted">
              <tr>
                <th className="px-2 py-2 font-medium">Created</th>
                <th className="px-2 py-2 font-medium">Expires</th>
                <th className="px-2 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-2 py-4 text-tbm-text-muted">
                    No one-time invites yet.
                  </td>
                </tr>
              ) : (
                invites.map((invite) => (
                  <tr key={invite.id} className="border-b border-tbm-border">
                    <td className="px-2 py-3">
                      {new Date(invite.created_at).toLocaleString()}
                    </td>
                    <td className="px-2 py-3">
                      {new Date(invite.expires_at).toLocaleString()}
                    </td>
                    <td className="px-2 py-3">
                      {invite.used_at ? (
                        <span className="rounded-full bg-tbm-accent px-2 py-1 text-xs font-medium text-tbm-navy">
                          Used
                        </span>
                      ) : new Date(invite.expires_at) < new Date() ? (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                          Expired
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
