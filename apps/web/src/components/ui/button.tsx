import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "inverse";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition " +
  "disabled:pointer-events-none disabled:opacity-50 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-fg shadow-xs hover:bg-primary-hover active:bg-primary-hover",
  secondary:
    "bg-primary-soft text-primary hover:bg-primary-soft/70 active:bg-primary-soft",
  outline:
    "border border-border-strong bg-surface text-fg hover:border-primary hover:text-primary",
  ghost: "text-fg-soft hover:bg-sunken hover:text-fg",
  destructive:
    "bg-destructive text-primary-fg shadow-xs hover:bg-destructive-hover",
  inverse:
    "bg-inverse text-inverse-fg shadow-xs hover:bg-inverse/90",
};

/* 44px dokunma hedefi: sm dahil hiçbir boy bunun altına inmez. */
const sizes: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {loading ? <Spinner /> : leadingIcon}
      <span className={cn("min-w-0 truncate", loading && "opacity-80")}>
        {children}
      </span>
      {!loading && trailingIcon}
    </button>
  );
}

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  variant?: ButtonVariant;
  size?: "sm" | "md";
};

export function IconButton({
  label,
  variant = "ghost",
  size = "md",
  className,
  children,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        base,
        variants[variant],
        size === "sm" ? "size-11 p-0" : "size-11 p-0 sm:size-12",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}
