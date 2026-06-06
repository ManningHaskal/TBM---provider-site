import Link from "next/link";
import { Logo } from "@/components/logo";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-teal-700 to-teal-900 px-6 py-12 text-white shadow-sm sm:px-10">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="rounded-3xl bg-white/95 p-6 shadow-sm">
            <Logo size="lg" variant="hero" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Welcome to the TexBioMed provider portal
            </h1>
            <p className="mt-3 max-w-2xl text-teal-50">
              Place peptide orders on behalf of your patients. TexBioMed will invoice
              the patient directly and ship once payment is received.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Place an order">
          <p className="mb-4 text-sm text-slate-600">
            Start a new order or repeat a recent one for an existing patient.
          </p>
          <Link
            href="/orders/new"
            className="inline-flex rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            Create new order
          </Link>
        </Card>
        <Card title="Manage patients">
          <p className="mb-4 text-sm text-slate-600">
            View and update patient information and review previous orders.
          </p>
          <Link
            href="/patients"
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            View patients
          </Link>
        </Card>
      </div>
    </div>
  );
}
