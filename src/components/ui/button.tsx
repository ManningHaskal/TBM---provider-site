import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
};

const variants = {
  primary:
    "rounded-full bg-tbm-red px-6 py-3 text-sm font-semibold tracking-wide text-white hover:bg-tbm-red-dark disabled:bg-tbm-red/50",
  secondary:
    "rounded-full border border-tbm-border bg-tbm-surface px-6 py-3 text-sm font-semibold text-tbm-navy hover:bg-tbm-accent disabled:text-tbm-text-muted/50",
  ghost:
    "rounded-full px-4 py-2 text-sm font-semibold text-tbm-blue hover:bg-tbm-accent disabled:text-tbm-text-muted/50",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
