import { AppNav } from "@/components/nav";
import { requireProvider } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const provider = await requireProvider();

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav provider={provider} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
