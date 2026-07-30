"use client";

import Link from "next/link";
import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AnimatedCounter } from "@/components/motion";

export function Card({
  as: Tag = "section",
  padded = true,
  className,
  children,
}: {
  as?: ElementType;
  padded?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-xs",
        padded && "p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 gap-y-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-[-0.01em] text-fg">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex min-w-0 flex-wrap gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon,
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "neutral" | "primary" | "warning" | "destructive";
  icon?: ReactNode;
  href?: string;
}) {
  const toneRing = {
    neutral: "",
    primary: "ring-1 ring-inset ring-primary/15",
    warning: "ring-1 ring-inset ring-warning/25",
    destructive: "ring-1 ring-inset ring-destructive/25",
  }[tone];

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          {label}
        </p>
        {icon ? (
          <span aria-hidden="true" className="text-muted">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-[-0.02em] text-fg">
        {/* Sayısal değerler yenilemede sıçramak yerine yeni değere yürür. */}
        {typeof value === "number" ? <AnimatedCounter value={value} /> : value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </>
  );

  const className = cn(
    "block rounded-2xl border border-border bg-surface p-4 shadow-xs",
    toneRing,
    href &&
      "transition duration-150 hover:border-primary/40 hover:shadow-sm active:scale-[0.99]",
  );

  // Link: tam sayfa yeniden yükleme yerine istemci geçişi — sayfa animasyonu
  // ancak bu şekilde çalışır.
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
