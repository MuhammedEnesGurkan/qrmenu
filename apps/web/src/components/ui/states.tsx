import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-lg bg-sunken", className)}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={cn("h-3.5", index === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonCards({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("grid gap-4 sm:grid-cols-2", className)}
    >
      <span className="sr-only">İçerik yükleniyor…</span>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-border bg-surface p-5"
        >
          <Skeleton className="h-4 w-1/3" />
          <SkeletonText className="mt-4" lines={2} />
          <Skeleton className="mt-5 h-9 w-28" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // w-full + min-w-0: grid/flex kabında içerik genişliğine göre büyümesin
        "flex w-full min-w-0 flex-col items-center rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <span
          aria-hidden="true"
          className="mb-4 grid size-12 place-items-center rounded-full bg-sunken text-muted"
        >
          {icon}
        </span>
      ) : null}
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "İçerik yüklenemedi",
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex w-full min-w-0 flex-col items-center rounded-2xl border border-destructive/25 bg-destructive-soft px-6 py-10 text-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="mb-3 grid size-11 place-items-center rounded-full bg-surface text-lg text-destructive"
      >
        ⚠
      </span>
      <h3 className="text-base font-semibold text-destructive">{title}</h3>
      {message ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-fg-soft">{message}</p>
      ) : null}
      {onRetry ? (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          Yeniden dene
        </Button>
      ) : null}
    </div>
  );
}

/** Form üstünde gösterilen genel uyarı/hata bandı. */
export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "warning" | "destructive" | "success";
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const styles = {
    info: "border-info/25 bg-info-soft text-info",
    warning: "border-warning/30 bg-warning-soft text-warning",
    destructive: "border-destructive/25 bg-destructive-soft text-destructive",
    success: "border-success/25 bg-success-soft text-success",
  }[tone];
  const icons = {
    info: "ℹ",
    warning: "⚠",
    destructive: "⚠",
    success: "✓",
  }[tone];

  return (
    <div
      role={tone === "destructive" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-6",
        styles,
        className,
      )}
    >
      <span aria-hidden="true" className="mt-px shrink-0 font-bold">
        {icons}
      </span>
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={cn(title && "mt-0.5", "text-fg-soft")}>{children}</div>
      </div>
    </div>
  );
}
