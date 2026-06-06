import { Logo } from "@/components/logo";
import { LinkButton } from "@/components/ui/link-button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="tbm-hero-gradient overflow-hidden rounded-[30px] px-6 py-12 shadow-[0_0_7px_rgba(0,0,0,0.1)] sm:px-10">
        <div className="flex flex-col items-center gap-6 text-center">
          <span className="tbm-badge">Trusted Quality</span>
          <div className="rounded-[30px] bg-white/95 p-6 shadow-sm">
            <Logo size="lg" />
          </div>
          <div>
            <h1 className="tbm-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Precision ordering for medical providers
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-white/90">
              Place peptide orders on behalf of your patients. TexBioMed will invoice
              the patient directly and ship once payment is received.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Place an order">
          <p className="mb-5 text-sm text-tbm-text-muted">
            Start a new order or repeat a recent one for an existing patient.
          </p>
          <LinkButton href="/orders/new">Create new order</LinkButton>
        </Card>
        <Card title="Manage patients">
          <p className="mb-5 text-sm text-tbm-text-muted">
            View and update patient information and review previous orders.
          </p>
          <LinkButton href="/patients" variant="secondary">
            View patients
          </LinkButton>
        </Card>
      </div>
    </div>
  );
}
