import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
};

const variants = {
  primary:
    "bg-teal-700 text-white hover:bg-teal-800 disabled:bg-teal-400",
  secondary:
    "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:text-slate-400",
  ghost: "text-teal-800 hover:bg-teal-50 disabled:text-slate-400",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
