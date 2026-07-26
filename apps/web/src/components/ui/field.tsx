"use client";

import {
  createContext,
  useContext,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

type FieldContextValue = {
  controlId: string;
  describedBy?: string;
  invalid: boolean;
};

const FieldContext = createContext<FieldContextValue | null>(null);

function useFieldParts() {
  const context = useContext(FieldContext);
  return {
    id: context?.controlId,
    "aria-describedby": context?.describedBy,
    "aria-invalid": context?.invalid || undefined,
  };
}

/**
 * Label + açıklama + hata + zorunluluk göstergesini tek yerde standartlaştırır.
 * İçindeki Input/Select/Textarea otomatik olarak id ve aria bağlarını alır.
 */
export function FormField({
  label,
  description,
  error,
  required = false,
  hideLabel = false,
  className,
  children,
}: {
  label: string;
  description?: ReactNode;
  error?: string;
  required?: boolean;
  hideLabel?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const controlId = useId();
  const descriptionId = `${controlId}-description`;
  const errorId = `${controlId}-error`;
  const describedBy =
    [description ? descriptionId : null, error ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <FieldContext.Provider
      value={{ controlId, describedBy, invalid: Boolean(error) }}
    >
      <div className={cn("grid gap-1.5", className)}>
        {/*
          Zorunluluk yıldızı CSS ::after ile basılır; böylece label'ın erişilebilir
          adı ve metni yalnız alan adından oluşur (bkz. globals.css).
        */}
        <label
          htmlFor={controlId}
          data-required={required || undefined}
          className={cn("text-sm font-medium text-fg", hideLabel && "sr-only")}
        >
          {label}
          {required ? null : (
            <span className="ml-1 text-xs font-normal text-muted">
              (isteğe bağlı)
            </span>
          )}
        </label>
        {description ? (
          <p id={descriptionId} className="text-xs leading-5 text-muted">
            {description}
          </p>
        ) : null}
        {children}
        {error ? (
          <p
            id={errorId}
            role="alert"
            className="flex items-start gap-1.5 text-xs font-medium text-destructive"
          >
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

const controlBase =
  "w-full rounded-lg border bg-surface px-3 text-base text-fg transition " +
  "placeholder:text-muted/80 " +
  "focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring " +
  "disabled:cursor-not-allowed disabled:bg-sunken disabled:text-muted " +
  "aria-[invalid=true]:border-destructive";

export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  const parts = useFieldParts();
  return (
    <input
      {...parts}
      {...rest}
      className={cn(controlBase, "min-h-11 border-input", className)}
    />
  );
}

export function Textarea({
  className,
  rows = 3,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const parts = useFieldParts();
  return (
    <textarea
      {...parts}
      {...rest}
      rows={rows}
      className={cn(controlBase, "min-h-24 border-input py-2.5", className)}
    />
  );
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const parts = useFieldParts();
  return (
    <select
      {...parts}
      {...rest}
      className={cn(controlBase, "min-h-11 border-input pr-9", className)}
    >
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  description,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  description?: ReactNode;
}) {
  const generated = useId();
  const id = rest.id ?? generated;
  return (
    <div className={cn("flex min-h-11 items-start gap-3 py-1.5", className)}>
      <input
        {...rest}
        id={id}
        type="checkbox"
        className="mt-0.5 size-5 shrink-0 rounded border-input accent-primary"
      />
      <label htmlFor={id} className="text-sm leading-6 text-fg">
        {label}
        {description ? (
          <span className="block text-xs text-muted">{description}</span>
        ) : null}
      </label>
    </div>
  );
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  name,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  name?: string;
}) {
  const id = useId();
  return (
    <div className="flex min-h-11 items-center justify-between gap-4">
      <label htmlFor={id} className="text-sm leading-6 text-fg">
        {label}
        {description ? (
          <span className="block text-xs text-muted">{description}</span>
        ) : null}
      </label>
      <button
        id={id}
        name={name}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked
            ? "border-primary bg-primary"
            : "border-input bg-sunken",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "size-5 rounded-full bg-surface shadow-sm transition",
            checked ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}
