"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type DropdownItem = {
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  tone?: "default" | "destructive";
  disabled?: boolean;
};

/**
 * İkincil aksiyonları tek düğme altında toplayan menü.
 * Escape ve dışarı tıklama ile kapanır, ok tuşlarıyla gezilir.
 */
export function DropdownMenu({
  label,
  items,
  align = "end",
  trigger,
  className,
}: {
  label: string;
  items: DropdownItem[];
  align?: "start" | "end";
  trigger?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        rootRef.current?.querySelector("button")?.focus();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const nodes = Array.from(
        menuRef.current?.querySelectorAll<HTMLButtonElement>(
          "[role=menuitem]:not([disabled])",
        ) ?? [],
      );
      if (nodes.length === 0) return;
      event.preventDefault();
      const current = nodes.indexOf(document.activeElement as HTMLButtonElement);
      const next =
        event.key === "ArrowDown"
          ? (current + 1) % nodes.length
          : (current - 1 + nodes.length) % nodes.length;
      nodes[next].focus();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-fg-soft transition",
          "hover:border-primary/40 hover:text-primary",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        )}
      >
        {trigger ?? (
          <span aria-hidden="true" className="text-lg leading-none">
            ⋯
          </span>
        )}
      </button>
      {open ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          className={cn(
            "animate-fade-up absolute z-40 mt-1 min-w-52 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-lg",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={cn(
                "flex w-full min-h-11 items-center gap-2.5 rounded-lg px-3 text-left text-sm font-medium transition",
                "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                "disabled:cursor-not-allowed disabled:opacity-45",
                item.tone === "destructive"
                  ? "text-destructive hover:bg-destructive-soft"
                  : "text-fg hover:bg-sunken",
              )}
            >
              {item.icon ? (
                <span aria-hidden="true" className="shrink-0">
                  {item.icon}
                </span>
              ) : null}
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
