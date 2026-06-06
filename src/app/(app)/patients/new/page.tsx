import Link from "next/link";
import { PatientForm } from "@/components/patient-form";
import { Card } from "@/components/ui/card";

export default function NewPatientPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/patients" className="text-sm font-medium text-teal-800 hover:underline">
          Back to patients
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Add patient</h1>
      </div>
      <Card>
        <PatientForm />
      </Card>
    </div>
  );
}
