"use client";

import { useState, type InputHTMLAttributes } from "react";
import { FieldLabel } from "@/components/ui/field-label";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  showPasswordToggle?: boolean;
};

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

export function Input({
  label,
  className = "",
  id,
  type,
  showPasswordToggle,
  required,
  ...props
}: InputProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const inputId = id ?? props.name;
  const isPassword = type === "password";
  const toggleEnabled = isPassword && showPasswordToggle !== false;
  const inputType = toggleEnabled && passwordVisible ? "text" : type;

  return (
    <label className="flex flex-col gap-1 text-sm">
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className={toggleEnabled ? "relative" : undefined}>
        <input
          id={inputId}
          type={inputType}
          className={`w-full rounded-xl border border-tbm-border bg-white px-3 py-2.5 text-tbm-navy outline-none ring-tbm-blue/20 focus:border-tbm-blue focus:ring-4 ${toggleEnabled ? "pr-11" : ""} ${className}`}
          {...props}
        />
        {toggleEnabled ? (
          <button
            type="button"
            onClick={() => setPasswordVisible((visible) => !visible)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-tbm-text-muted hover:text-tbm-navy"
            aria-label={passwordVisible ? "Hide password" : "Show password"}
          >
            {passwordVisible ? (
              <EyeOffIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        ) : null}
      </div>
    </label>
  );
}
