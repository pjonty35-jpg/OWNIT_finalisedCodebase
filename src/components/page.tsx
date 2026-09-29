import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <section className={cn("wrap py-16 lg:py-24", className)}>
      {label ? <p className="label-caps mb-3">{label}</p> : null}
      {children}
    </section>
  );
}

export function PageHero({
  eyebrow,
  title,
  note,
  children,
}: {
  eyebrow: string;
  title: string;
  note?: string;
  children?: ReactNode;
}) {
  return (
    <div className="wrap pt-32 pb-12 lg:pt-40 lg:pb-16">
      <p className="label-caps">{eyebrow}</p>
      <h1 className="headline mt-3 text-4xl sm:text-6xl lg:text-7xl">{title}</h1>
      {note ? <p className="mt-5 max-w-xl text-base text-mute">{note}</p> : null}
      {children}
    </div>
  );
}
