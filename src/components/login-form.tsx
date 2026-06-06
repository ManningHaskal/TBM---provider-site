"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthActionState } from "@/lib/actions/auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8">
      <Logo size="lg" showTagline />
      <form action={formAction} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold text-slate-900">Sign in</h1>
        <div className="flex flex-col gap-4">
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          {state.error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </form>
      <p className="text-center text-sm text-slate-600">
        Received an invite from TexBioMed?{" "}
        <Link href="/signup" className="font-medium text-teal-800 hover:underline">
          Create your account
        </Link>
      </p>
    </div>
  );
}
