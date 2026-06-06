import Link from "next/link";
import { notFound } from "next/navigation";
import { getPatientById } from "@/lib/actions/patients";
import { PatientForm } from "@/components/patient-form";
import { Card } from "@/components/ui/card";

type EditPatientPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPatientPage({ params }: EditPatientPageProps) {
  const { id } = await params;
  const patient = await getPatientById(id);

  if (!patient) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/patients/${patient.id}`}
          className="text-sm font-medium text-tbm-red hover:underline"
        >
          Back to patient
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-tbm-navy">Edit patient</h1>
      </div>
      <Card>
        <PatientForm patient={patient} />
      </Card>
    </div>
  );
}
