import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "violet"
  | "accent";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-sunken text-muted ring-border",
  primary: "bg-primary-soft text-primary ring-primary/15",
  success: "bg-success-soft text-success ring-success/15",
  warning: "bg-warning-soft text-warning ring-warning/20",
  destructive: "bg-destructive-soft text-destructive ring-destructive/15",
  info: "bg-info-soft text-info ring-info/15",
  violet: "bg-violet-soft text-violet ring-violet/15",
  accent: "bg-accent-soft text-accent ring-accent/20",
};

export function Badge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        // Durum değişince rozet yeni rengine erir; sert takas dikkat çeker.
        "transition-colors duration-200 ease-out",
        tones[tone],
        className,
      )}
    >
      {/* Renk tek başına durum taşımasın diye ikon + metin birlikte gösterilir. */}
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <span className="truncate">{children}</span>
    </span>
  );
}
