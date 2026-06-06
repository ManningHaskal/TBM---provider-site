import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ label, className = "", id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        id={inputId}
        className={`rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-teal-700/20 focus:border-teal-700 focus:ring-4 ${className}`}
        {...props}
      />
    </label>
  );
}
