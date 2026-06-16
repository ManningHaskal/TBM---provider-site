import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { getProviderAccounts } from "@/lib/actions/admin-providers";
import { Card } from "@/components/ui/card";

type AdminProvidersPageProps = {
  searchParams: Promise<{ q?: string; success?: string }>;
};

function getSuccessMessage(success?: string): string | null {
  if (success === "account_deleted") {
    return "The account was deleted.";
  }

  return null;
}

export default async function AdminProvidersPage({
  searchParams,
}: AdminProvidersPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const accounts = await getProviderAccounts(params.q);
  const successMessage = getSuccessMessage(params.success);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-tbm-navy">Accounts</h1>
        <p className="text-sm text-tbm-text-muted">
          Review provider and admin accounts, patients, and order history.
        </p>
      </div>

      {successMessage ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMessage}
        </p>
      ) : null}

      <Card>
        <form action="/admin/providers" method="get" className="mb-6">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-tbm-navy">Search accounts</span>
            <div className="flex gap-2">
              <input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search by name, practice, or phone"
                className="flex-1 rounded-lg border border-tbm-border px-3 py-2"
              />
              <button
                type="submit"
                className="rounded-lg border border-tbm-border px-4 py-2 text-sm font-medium text-tbm-navy hover:bg-tbm-accent-light"
              >
                Search
              </button>
            </div>
          </label>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-tbm-border text-tbm-text-muted">
              <tr>
                <th className="px-2 py-2 font-medium">Name</th>
                <th className="px-2 py-2 font-medium">Practice</th>
                <th className="px-2 py-2 font-medium">Email</th>
                <th className="px-2 py-2 font-medium">Role</th>
                <th className="px-2 py-2 font-medium">Patients</th>
                <th className="px-2 py-2 font-medium">Orders</th>
                <th className="px-2 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-6 text-tbm-text-muted">
                    No accounts found.
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr key={account.id} className="border-b border-tbm-border">
                    <td className="px-2 py-3 font-medium text-tbm-navy">
                      {account.full_name}
                    </td>
                    <td className="px-2 py-3">{account.practice_name}</td>
                    <td className="px-2 py-3">{account.email}</td>
                    <td className="px-2 py-3 capitalize">
                      {account.role === "super_admin" ? "Super admin" : account.role}
                    </td>
                    <td className="px-2 py-3">{account.patientCount}</td>
                    <td className="px-2 py-3">{account.orderCount}</td>
                    <td className="px-2 py-3">
                      <Link
                        href={`/admin/providers/${account.id}`}
                        className="font-medium text-tbm-red hover:underline"
                      >
                        View
                      </Link>
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
