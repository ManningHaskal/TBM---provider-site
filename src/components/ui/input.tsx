import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ label, className = "", id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-tbm-navy">{label}</span>
      <input
        id={inputId}
        className={`rounded-xl border border-tbm-border bg-white px-3 py-2.5 text-tbm-navy outline-none ring-tbm-blue/20 focus:border-tbm-blue focus:ring-4 ${className}`}
        {...props}
      />
    </label>
  );
}
