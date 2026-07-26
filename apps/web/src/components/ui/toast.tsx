"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info";

type Toast = { id: number; tone: ToastTone; message: string };

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const TONE_STYLE: Record<ToastTone, { box: string; icon: string }> = {
  success: { box: "border-success/30 bg-success-soft text-success", icon: "✓" },
  error: {
    box: "border-destructive/30 bg-destructive-soft text-destructive",
    icon: "⚠",
  },
  info: { box: "border-info/30 bg-info-soft text-info", icon: "ℹ" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (tone: ToastTone, message: string) => {
      const id = ++counter.current;
      setToasts((current) => [...current.slice(-2), { id, tone, message }]);
      timers.current.push(
        setTimeout(() => dismiss(id), tone === "error" ? 7000 : 4000),
      );
    },
    [dismiss],
  );

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
      info: (message) => push("info", message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-4 sm:inset-x-auto sm:right-4 sm:items-end"
      >
        {toasts.map((toast) => {
          const style = TONE_STYLE[toast.tone];
          return (
            <div
              key={toast.id}
              role={toast.tone === "error" ? "alert" : "status"}
              className={cn(
                "animate-fade-up pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg",
                style.box,
              )}
            >
              <span aria-hidden="true" className="mt-px shrink-0">
                {style.icon}
              </span>
              <p className="min-w-0 flex-1 break-words">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Bildirimi kapat"
                className="-my-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-current/70 hover:text-current"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast, ToastProvider içinde kullanılmalıdır.");
  }
  return context;
}
