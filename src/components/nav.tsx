import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import type { Provider } from "@/lib/types";
import { LogoLink } from "@/components/logo";

type AppNavProps = {
  provider: Provider;
};

export function AppNav({ provider }: AppNavProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <LogoLink size="sm" />
        <nav className="flex items-center gap-1 text-sm font-medium text-slate-700">
          <Link
            href="/home"
            className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-teal-800"
          >
            Home
          </Link>
          <Link
            href="/patients"
            className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-teal-800"
          >
            Patients
          </Link>
          <Link
            href="/orders"
            className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-teal-800"
          >
            Orders
          </Link>
          {provider.role === "admin" ? (
            <Link
              href="/admin/invites"
              className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-teal-800"
            >
              Invites
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">{provider.full_name}</p>
            <p className="text-xs text-slate-500">{provider.practice_name}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
