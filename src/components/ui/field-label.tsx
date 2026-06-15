import type { ReactNode } from "react";

type FieldLabelProps = {
  children: ReactNode;
  required?: boolean;
  className?: string;
};

export function FieldLabel({
  children,
  required = false,
  className = "",
}: FieldLabelProps) {
  return (
    <span className={`font-medium text-tbm-navy ${className}`}>
      {children}
      {required ? (
        <span className="text-tbm-red" aria-hidden="true">
          {" "}
          *
        </span>
      ) : null}
    </span>
  );
}
