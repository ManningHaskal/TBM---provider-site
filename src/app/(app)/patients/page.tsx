import Link from "next/link";
import { getPatients } from "@/lib/actions/patients";
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
          <h1 className="text-2xl font-semibold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-600">
            Manage patient records and review order history.
          </p>
        </div>
        <Link
          href="/patients/new"
          className="inline-flex rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Add patient
        </Link>
      </div>

      <Card>
        <form action="/patients" method="get" className="mb-6">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Search patients</span>
            <div className="flex gap-2">
              <input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search by name or email"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
              />
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Search
              </button>
            </div>
          </label>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
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
                  <td colSpan={4} className="px-2 py-6 text-slate-500">
                    No patients found.
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="border-b border-slate-100">
                    <td className="px-2 py-3 font-medium text-slate-900">
                      {patient.full_name}
                    </td>
                    <td className="px-2 py-3">{patient.email ?? "—"}</td>
                    <td className="px-2 py-3">{patient.phone ?? "—"}</td>
                    <td className="px-2 py-3">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="font-medium text-teal-800 hover:underline"
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
