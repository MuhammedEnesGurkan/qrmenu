"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useReducedMotion,
} from "motion/react";
import { cn } from "@/lib/cn";
import { duration, ease, reducedTween, spring, tween } from "@/lib/motion";
import { Button, IconButton } from "./button";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * dialog  — her boyutta ortalanmış pencere.
 * sheet   — mobilde alttan, masaüstünde ortalanmış.
 * drawer  — mobilde alttan, masaüstünde sağdan tam boy çekmece.
 */
type Presentation = "dialog" | "sheet" | "drawer";

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

/** Masaüstü kırılımı (Tailwind `sm`). Panelin hangi yönden geleceğini belirler. */
function useIsWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    setWide(query.matches);
    const onChange = (event: MediaQueryListEvent) => setWide(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return wide;
}

/**
 * Ortak modal kabuğu. Escape ile kapanma, focus trap, focus geri verme ve
 * arka plan scroll kilidi tek yerde çözülür.
 *
 * Panel `AnimatePresence` içinde durur: kapanış animasyonu bitmeden DOM'dan
 * kaldırılmaz, dolayısıyla scroll kilidi ve focus geri verme de çıkış
 * tamamlandıktan sonra çalışır.
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
  return (
    <AnimatePresence>
      {open ? (
        <OverlayPanel
          onClose={onClose}
          title={title}
          description={description}
          footer={footer}
          presentation={presentation}
          size={size}
        >
          {children}
        </OverlayPanel>
      ) : null}
    </AnimatePresence>
  );
}

function OverlayPanel({
  onClose,
  title,
  description,
  footer,
  presentation,
  size,
  children,
}: Omit<OverlayProps, "open" | "presentation" | "size"> & {
  presentation: Presentation;
  size: "sm" | "md" | "lg";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const reduced = useReducedMotion();
  const wide = useIsWide();
  const dragControls = useDragControls();

  useEffect(() => {
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
      ).filter(
        (node) => node.offsetParent !== null || node === document.activeElement,
      );
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
  }, [onClose]);

  const isDrawer = presentation === "drawer";
  // Mobilde drawer ve sheet aynı şeydir: alttan gelen yaprak.
  const asBottomSheet = !wide && presentation !== "dialog";
  const asSideDrawer = wide && isDrawer;

  const widths = { sm: "sm:max-w-md", md: "sm:max-w-xl", lg: "sm:max-w-3xl" }[
    size
  ];

  /*
   * Yalnız transform ve opacity animate edilir. Panelin konumu flex ile
   * kurulduğu için width/height/top/left'e hiç dokunulmaz.
   */
  const panelMotion = reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: reducedTween,
      }
    : asBottomSheet
      ? {
          initial: { y: "100%" },
          animate: { y: 0 },
          exit: { y: "100%" },
          transition: spring.surface,
        }
      : asSideDrawer
        ? {
            initial: { x: "100%" },
            animate: { x: 0 },
            exit: { x: "100%" },
            transition: { duration: duration.normal, ease },
          }
        : {
            initial: { opacity: 0, scale: 0.97, y: 8 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.98, y: 4 },
            transition: { duration: duration.normal, ease },
          };

  return (
    <motion.div
      className={cn(
        "fixed inset-0 z-50 flex bg-inverse/50 backdrop-blur-[2px]",
        asSideDrawer
          ? "justify-end"
          : "items-end sm:items-center sm:justify-center sm:p-6",
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={reduced ? reducedTween : tween.fast}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        {...panelMotion}
        /*
         * Aşağı kaydırarak kapatma yalnız mobil yaprakta ve yalnız tutamaktan
         * başlatılır; içerik alanının kendi scroll'u bozulmasın diye
         * dragListener kapalı.
         */
        drag={asBottomSheet && !reduced ? "y" : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.4 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120 || info.velocity.y > 600) onClose();
        }}
        className={cn(
          "flex w-full flex-col overflow-hidden bg-surface shadow-overlay outline-none",
          asSideDrawer
            ? "h-dvh max-w-lg rounded-l-2xl"
            : "max-h-[92dvh] rounded-t-3xl sm:rounded-2xl",
          !asSideDrawer && widths,
        )}
      >
        {asBottomSheet && !reduced ? (
          <div
            aria-hidden="true"
            onPointerDown={(event) => dragControls.start(event)}
            className="flex shrink-0 cursor-grab touch-none justify-center pt-2.5 active:cursor-grabbing"
          >
            <span className="h-1 w-9 rounded-full bg-border-strong" />
          </div>
        ) : null}

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
      </motion.div>
    </motion.div>
  );
}

export function Dialog(props: Omit<OverlayProps, "presentation">) {
  return <Overlay {...props} presentation="dialog" />;
}

/** Mobilde bottom sheet, masaüstünde ortalanmış panel. */
export function Sheet(props: Omit<OverlayProps, "presentation">) {
  return <Overlay {...props} presentation="sheet" />;
}

/** Mobilde bottom sheet, masaüstünde sağdan tam boy çekmece. */
export function Drawer(props: Omit<OverlayProps, "presentation">) {
  return <Overlay {...props} presentation="drawer" />;
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
