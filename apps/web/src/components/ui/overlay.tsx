"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { Button, IconButton } from "./button";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Presentation = "dialog" | "sheet" | "responsive";

type OverlayProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  footer?: ReactNode;
  presentation?: Presentation;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
};

/**
 * Ortak modal kabuğu. Escape ile kapanma, focus trap, focus geri verme ve
 * arka plan scroll kilidi tek yerde çözülür.
 */
function Overlay({
  open,
  onClose,
  title,
  description,
  footer,
  presentation = "dialog",
  size = "md",
  children,
}: OverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((node) => node.offsetParent !== null || node === document.activeElement);
      if (nodes.length === 0) return;
      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === firstNode) {
        event.preventDefault();
        lastNode.focus();
      } else if (!event.shiftKey && document.activeElement === lastNode) {
        event.preventDefault();
        firstNode.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = overflow;
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: "sm:max-w-md", md: "sm:max-w-xl", lg: "sm:max-w-3xl" }[
    size
  ];

  const isSheet = presentation === "sheet";
  const isResponsive = presentation === "responsive";

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex bg-inverse/50 backdrop-blur-[2px]",
        isSheet || isResponsive
          ? "items-end sm:items-center sm:justify-center sm:p-6"
          : "items-end sm:items-center sm:justify-center sm:p-6",
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "animate-fade-up flex max-h-[92dvh] w-full flex-col overflow-hidden bg-surface shadow-overlay outline-none",
          "rounded-t-3xl sm:rounded-2xl",
          widths,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-[-0.01em] text-fg"
            >
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 text-sm leading-6 text-muted"
              >
                {description}
              </p>
            ) : null}
          </div>
          <IconButton
            label="Kapat"
            onClick={onClose}
            className="-mr-2 shrink-0"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ×
            </span>
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>
        {footer ? (
          <div className="safe-bottom flex flex-wrap justify-end gap-2 border-t border-border bg-sunken px-5 py-4 sm:px-6">
            {footer}
          </div>
        ) : (
          <div className="safe-bottom" />
        )}
      </div>
    </div>
  );
}

export function Dialog(props: Omit<OverlayProps, "presentation">) {
  return <Overlay {...props} presentation="dialog" />;
}

/** Mobilde bottom sheet, masaüstünde ortalanmış panel. */
export function Sheet(props: Omit<OverlayProps, "presentation">) {
  return <Overlay {...props} presentation="responsive" />;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  tone = "destructive",
  loading = false,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "destructive" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  return (
    <Overlay
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      presentation="dialog"
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description ? (
        <p className="text-sm leading-6 text-fg-soft">{description}</p>
      ) : null}
      {children}
    </Overlay>
  );
}

/** Onay akışını tek satırda kurmak için küçük yardımcı. */
export function useConfirm<T>() {
  const [pending, setPending] = useState<T | null>(null);
  const ask = useCallback((value: T) => setPending(value), []);
  const clear = useCallback(() => setPending(null), []);
  return { pending, ask, clear, open: pending !== null };
}
