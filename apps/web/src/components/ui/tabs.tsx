"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TabItem = {
  value: string;
  label: ReactNode;
  badge?: ReactNode;
};

/**
 * Erişilebilir tab listesi. Ok tuşlarıyla gezinme desteklenir.
 * Panel içeriğini çağıran taraf yönetir (tek panel senaryosu yaygın).
 */
export function Tabs({
  items,
  value,
  onChange,
  ariaLabel,
  size = "md",
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (next: string) => void;
  ariaLabel: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  function onKeyDown(event: React.KeyboardEvent) {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const index = items.findIndex((item) => item.value === value);
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : event.key === "ArrowRight"
            ? (index + 1) % items.length
            : (index - 1 + items.length) % items.length;
    onChange(items[nextIndex].value);
    listRef.current
      ?.querySelectorAll<HTMLButtonElement>("[role=tab]")
      [nextIndex]?.focus();
  }

  const sizing = {
    sm: "min-h-10 px-3 text-sm",
    md: "min-h-11 px-4 text-sm",
    lg: "min-h-12 px-5 text-base",
  }[size];

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn(
        "-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-lg font-medium transition",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              sizing,
              selected
                ? "bg-primary text-primary-fg shadow-xs"
                : "border border-border bg-surface text-fg-soft hover:border-primary/40 hover:text-primary",
            )}
          >
            <span className="truncate">{item.label}</span>
            {item.badge != null ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.7rem] font-semibold tabular-nums",
                  selected ? "bg-primary-fg/20" : "bg-sunken text-muted",
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** İki-üç seçenekli, birbirini dışlayan seçimler için kompakt segment kontrolü. */
export function SegmentedControl({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  items: { value: string; label: ReactNode; hint?: string }[];
  value: string;
  onChange: (next: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "grid gap-1 rounded-xl border border-border bg-sunken p-1",
        items.length === 2 ? "grid-cols-2" : "grid-cols-3",
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(item.value)}
            className={cn(
              "min-h-11 rounded-lg px-3 text-sm font-semibold transition",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              selected
                ? "bg-surface text-fg shadow-sm"
                : "text-muted hover:text-fg",
            )}
          >
            <span className="block truncate">{item.label}</span>
            {item.hint ? (
              <span className="block text-[0.7rem] font-normal text-muted">
                {item.hint}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
