import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Crumb = { label: string; href?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Sayfa yolu">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? (
              <span aria-hidden="true" className="text-border-strong">
                /
              </span>
            ) : null}
            {item.href && index < items.length - 1 ? (
              <Link
                href={item.href}
                className="rounded transition hover:text-primary"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(index === items.length - 1 && "font-medium text-fg-soft")}
                aria-current={index === items.length - 1 ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  className,
}: {
  title: string;
  description?: ReactNode;
  breadcrumb?: Crumb[];
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("grid gap-3", className)}>
      {breadcrumb ? <Breadcrumb items={breadcrumb} /> : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="type-display text-2xl text-fg sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

export function SectionHeader({
  title,
  description,
  actions,
  level = 2,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  level?: 2 | 3;
  className?: string;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-3 gap-y-2",
        className,
      )}
    >
      <div className="min-w-0">
        <Heading className="type-display text-lg text-fg">{title}</Heading>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
