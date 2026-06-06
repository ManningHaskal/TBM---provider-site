import Link from "next/link";
import { getPatients } from "@/lib/actions/patients";
import { formatPatientName } from "@/lib/format/patient";
import { Card } from "@/components/ui/card";

type PatientsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  const params = await searchParams;
  const patients = await getPatients(params.q);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="tbm-heading text-2xl font-semibold">Patients</h1>
          <p className="text-sm text-tbm-text-muted">
            Manage patient records and review order history.
          </p>
        </div>
        <Link
          href="/patients/new"
          className="inline-flex rounded-full bg-tbm-red px-6 py-3 text-sm font-semibold text-white hover:bg-tbm-red-dark"
        >
          Add patient
        </Link>
      </div>

      <Card>
        <form action="/patients" method="get" className="mb-6">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-tbm-navy">Search patients</span>
            <div className="flex gap-2">
              <input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search by name or email"
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
                <th className="px-2 py-2 font-medium">Email</th>
                <th className="px-2 py-2 font-medium">Phone</th>
                <th className="px-2 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-6 text-tbm-text-muted">
                    No patients found.
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="border-b border-tbm-border">
                    <td className="px-2 py-3 font-medium text-tbm-navy">
                      {formatPatientName(patient)}
                    </td>
                    <td className="px-2 py-3">{patient.email ?? "—"}</td>
                    <td className="px-2 py-3">{patient.phone ?? "—"}</td>
                    <td className="px-2 py-3">
                      <Link
                        href={`/patients/${patient.id}`}
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
