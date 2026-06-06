import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <section className={`tbm-card p-6 ${className}`}>
      {title ? (
        <h2 className="tbm-heading mb-4 text-xl font-semibold">{title}</h2>
      ) : null}
      {children}
    </section>
  );
}
