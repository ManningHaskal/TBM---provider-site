import Link from "next/link";
import type { Provider } from "@/lib/types";
import { LogoLink } from "@/components/logo";

type AppNavProps = {
  provider: Provider;
};

export function AppNav({ provider }: AppNavProps) {
  return (
    <header className="bg-tbm-navy text-white shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div className="rounded-2xl bg-white/95 px-3 py-2">
          <LogoLink size="sm" />
        </div>
        <nav className="flex items-center gap-1 text-sm font-semibold">
          <Link
            href="/home"
            className="rounded-full px-4 py-2 hover:bg-white/10"
          >
            Home
          </Link>
          <Link
            href="/patients"
            className="rounded-full px-4 py-2 hover:bg-white/10"
          >
            Patients
          </Link>
          <Link
            href="/orders"
            className="rounded-full px-4 py-2 hover:bg-white/10"
          >
            Orders
          </Link>
          {provider.role === "admin" ? (
            <>
              <Link
                href="/admin/providers"
                className="rounded-full px-4 py-2 hover:bg-white/10"
              >
                Accounts
              </Link>
              <Link
                href="/admin/invites"
                className="rounded-full px-4 py-2 hover:bg-white/10"
              >
                Invites
              </Link>
            </>
          ) : null}
        </nav>
        <Link
          href="/profile"
          className="text-right hover:opacity-90"
        >
          <p className="text-sm font-semibold">{provider.full_name}</p>
          <p className="text-xs text-white/70">{provider.practice_name}</p>
        </Link>
      </div>
    </header>
  );
}
