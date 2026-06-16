import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAccountDeleteEligibilityForAccount,
} from "@/lib/actions/admin-account-actions";
import { getProviderAccountById } from "@/lib/actions/admin-providers";
import { isSuperAdminAccount, resolveSuperAdminViewer } from "@/lib/auth/super-admin";
import { requireAdmin } from "@/lib/auth/session";
import { formatAllergiesDisplay, formatPatientName } from "@/lib/format/patient";
import { calculateOrderTotal } from "@/lib/google/sheets";
import { getAccountDeleteBlockedMessage } from "@/lib/providers/delete-eligibility";
import { createClient } from "@/lib/supabase/server";
import type { ProviderRole } from "@/lib/types";
import { AdminAccountActions } from "@/components/admin-account-actions";
import { Card } from "@/components/ui/card";

type AdminProviderDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

function getErrorMessage(
  error?: string,
  deleteEligibility?: Awaited<ReturnType<typeof getAccountDeleteEligibilityForAccount>>,
): string | null {
  if (error === "delete_cooldown" && deleteEligibility) {
    return getAccountDeleteBlockedMessage(deleteEligibility);
  }

  if (error === "self_action") {
    return "You cannot perform that action on your own account.";
  }

  if (error === "already_admin") {
    return "This account is already an admin.";
  }

  if (error === "not_admin") {
    return "This account is not an admin.";
  }

  if (error === "super_admin_protected") {
    return "The super admin account cannot be demoted or deleted.";
  }

  if (error === "admin_delete_forbidden") {
    return "Only the super admin can delete admin accounts.";
  }

  if (error === "promote_failed" || error === "demote_failed" || error === "delete_failed") {
    return "That action could not be completed. Please try again.";
  }

  return null;
}

function getSuccessMessage(success?: string): string | null {
  if (success === "promoted") {
    return "This account was promoted to admin.";
  }

  if (success === "demoted") {
    return "This account was demoted to a regular provider.";
  }

  return null;
}

export default async function AdminProviderDetailPage({
  params,
  searchParams,
}: AdminProviderDetailPageProps) {
  const currentAdmin = await requireAdmin();
  const { id } = await params;
  const query = await searchParams;
  const account = await getProviderAccountById(id);

  if (!account) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const viewer = user
    ? await resolveSuperAdminViewer(
        currentAdmin.id,
        user.id,
        currentAdmin.role,
        user.email,
      )
    : { isSuperAdmin: false, email: null, role: currentAdmin.role };

  const isSuperAdminViewer = viewer.isSuperAdmin;
  const isSuperAdminTarget = isSuperAdminAccount(
    account.role as ProviderRole,
    account.email,
  );
  const isSelf = currentAdmin.id === account.id;
  const deleteEligibility = await getAccountDeleteEligibilityForAccount(account.id);
  const errorMessage = getErrorMessage(query.error, deleteEligibility);
  const successMessage = getSuccessMessage(query.success);

  const totalOrders = account.patients.reduce(
    (count, patient) => count + patient.orders.length,
    0,
  );

  const roleLabel =
    account.role === "super_admin"
      ? "Super admin"
      : account.role === "admin"
        ? "Admin"
        : "Provider";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/providers"
            className="text-sm font-medium text-tbm-red hover:underline"
          >
            Back to accounts
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-tbm-navy">
            {account.full_name}
          </h1>
          <p className="text-sm text-tbm-text-muted">
            {account.practice_name} · {roleLabel}
          </p>
        </div>
        <AdminAccountActions
          accountId={account.id}
          accountName={account.full_name}
          role={account.role}
          deleteEligibility={deleteEligibility}
          isSelf={isSelf}
          isSuperAdminViewer={isSuperAdminViewer}
          isSuperAdminTarget={isSuperAdminTarget}
        />
      </div>

      {successMessage ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
      ) : null}

      <Card title="Account information">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-tbm-text-muted">Email</dt>
            <dd className="font-medium text-tbm-navy">{account.email}</dd>
          </div>
          <div>
            <dt className="text-tbm-text-muted">Phone</dt>
            <dd className="font-medium text-tbm-navy">{account.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-tbm-text-muted">Patients</dt>
            <dd className="font-medium text-tbm-navy">{account.patients.length}</dd>
          </div>
          <div>
            <dt className="text-tbm-text-muted">Orders</dt>
            <dd className="font-medium text-tbm-navy">{totalOrders}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-tbm-text-muted">Clinic shipping address</dt>
            <dd className="whitespace-pre-wrap font-medium text-tbm-navy">
              {account.clinic_shipping_address ?? "—"}
            </dd>
          </div>
        </dl>
      </Card>

      {account.role === "provider" ? (
        account.patients.length === 0 ? (
          <Card title="Patients">
            <p className="text-sm text-tbm-text-muted">No patients for this account.</p>
          </Card>
        ) : (
          account.patients.map((patient) => (
            <Card key={patient.id} title={formatPatientName(patient)}>
              <div className="grid gap-6 lg:grid-cols-2">
                <dl className="grid gap-3 text-sm">
                  <div>
                    <dt className="text-tbm-text-muted">Email</dt>
                    <dd className="font-medium text-tbm-navy">{patient.email ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-tbm-text-muted">Phone</dt>
                    <dd className="font-medium text-tbm-navy">{patient.phone ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-tbm-text-muted">Date of birth</dt>
                    <dd className="font-medium text-tbm-navy">
                      {patient.date_of_birth ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-tbm-text-muted">Sex</dt>
                    <dd className="font-medium text-tbm-navy">{patient.sex ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-tbm-text-muted">Allergies</dt>
                    <dd className="font-medium text-tbm-navy">
                      {formatAllergiesDisplay(patient.allergies)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-tbm-text-muted">Shipping address</dt>
                    <dd className="whitespace-pre-wrap font-medium text-tbm-navy">
                      {patient.shipping_address ?? "—"}
                    </dd>
                  </div>
                </dl>

                <div>
                  <h3 className="mb-3 text-sm font-semibold text-tbm-navy">Orders</h3>
                  {patient.orders.length === 0 ? (
                    <p className="text-sm text-tbm-text-muted">No orders for this patient.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {patient.orders.map((order) => (
                        <div
                          key={order.id}
                          className="rounded-xl border border-tbm-border p-4 text-sm"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="font-medium text-tbm-navy">
                              {new Date(order.created_at).toLocaleString()}
                            </p>
                            <p className="font-medium text-tbm-navy">
                              ${calculateOrderTotal(order.order_items).toFixed(2)}
                            </p>
                          </div>
                          <p className="mt-2 text-tbm-text-muted">
                            {order.order_items
                              .map((item) => `${item.product_name} x${item.quantity}`)
                              .join(", ")}
                          </p>
                          {order.ship_to ? (
                            <p className="mt-2 text-tbm-text-muted">
                              Ship to: {order.ship_to === "clinic" ? "Clinic" : "Patient"}
                            </p>
                          ) : null}
                          {order.shipping_address ? (
                            <p className="mt-1 whitespace-pre-wrap text-tbm-text-muted">
                              {order.shipping_address}
                            </p>
                          ) : null}
                          {order.notes ? (
                            <p className="mt-2 text-tbm-text-muted">Notes: {order.notes}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )
      ) : (
        <Card title="Patients and orders">
          <p className="text-sm text-tbm-text-muted">
            Admin accounts do not have their own patient records.
          </p>
        </Card>
      )}
    </div>
  );
}
