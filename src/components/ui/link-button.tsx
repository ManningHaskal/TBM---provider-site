import Link from "next/link";
import type { ReactNode } from "react";

type LinkButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
};

export function LinkButton({
  href,
  children,
  variant = "primary",
  className = "",
}: LinkButtonProps) {
  const styles =
    variant === "primary"
      ? "bg-tbm-red text-white hover:bg-tbm-red-dark"
      : "border border-tbm-border bg-tbm-surface text-tbm-navy hover:bg-tbm-accent";

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-colors ${styles} ${className}`}
    >
      {children}
    </Link>
  );
}

export function TextLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`font-semibold text-tbm-red hover:text-tbm-red-dark hover:underline ${className}`}
    >
      {children}
    </Link>
  );
}
