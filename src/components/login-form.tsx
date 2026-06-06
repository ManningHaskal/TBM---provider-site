"use client";

import { useActionState } from "react";
import { loginAction, type AuthActionState } from "@/lib/actions/auth";
import { Logo } from "@/components/logo";
import { TextLink } from "@/components/ui/link-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8">
      <div className="flex flex-col items-center gap-3">
        <span className="tbm-badge">Trusted Quality</span>
        <Logo size="lg" showTagline variant="hero" />
      </div>
      <form action={formAction} className="tbm-card p-8">
        <h1 className="tbm-heading mb-2 text-2xl font-semibold">Sign in</h1>
        <p className="mb-6 text-sm text-tbm-text-muted">
          Access the TexBioMed provider ordering portal.
        </p>
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
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-tbm-red">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </form>
      <p className="text-center text-sm text-white/90">
        Received an invite from TexBioMed?{" "}
        <TextLink href="/signup" className="text-white hover:text-white/80">
          Create your account
        </TextLink>
      </p>
    </div>
  );
}
