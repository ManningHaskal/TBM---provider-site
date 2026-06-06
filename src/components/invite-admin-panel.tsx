"use client";

import { useState, useTransition } from "react";
import { createInviteAction } from "@/lib/actions/auth";
import type { InviteToken } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type InviteAdminPanelProps = {
  invites: InviteToken[];
};

export function InviteAdminPanel({ invites }: InviteAdminPanelProps) {
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
      <Card title="Generate invite">
        <p className="mb-4 text-sm text-slate-600">
          Create a single-use invite link valid for 7 days. Send it to the provider
          so they can create their account.
        </p>
        <Button onClick={handleGenerateInvite} disabled={isPending}>
          {isPending ? "Generating..." : "Generate invite link"}
        </Button>
        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {inviteUrl ? (
          <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-4">
            <p className="mb-2 text-sm font-medium text-teal-900">New invite link</p>
            <p className="break-all text-sm text-teal-800">{inviteUrl}</p>
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

      <Card title="Recent invites">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-2 py-2 font-medium">Created</th>
                <th className="px-2 py-2 font-medium">Expires</th>
                <th className="px-2 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-2 py-4 text-slate-500">
                    No invites yet.
                  </td>
                </tr>
              ) : (
                invites.map((invite) => (
                  <tr key={invite.id} className="border-b border-slate-100">
                    <td className="px-2 py-3">
                      {new Date(invite.created_at).toLocaleString()}
                    </td>
                    <td className="px-2 py-3">
                      {new Date(invite.expires_at).toLocaleString()}
                    </td>
                    <td className="px-2 py-3">
                      {invite.used_at ? (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
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
