import { cn } from "@/lib/cn";

/**
 * QRMenü işareti: köşe hizalayıcıları ve orta modülüyle bir QR karesi.
 * Ürünün fiziksel dünyadaki karşılığı masadaki karekoddur.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("grid size-9 shrink-0 place-items-center text-primary", className)}
    >
      <svg viewBox="0 0 32 32" className="size-full" fill="none">
        {/* Üç köşe hizalayıcı */}
        <path
          d="M4 11V6a2 2 0 0 1 2-2h5M21 4h5a2 2 0 0 1 2 2v5M28 21v5a2 2 0 0 1-2 2h-5M11 28H6a2 2 0 0 1-2-2v-5"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* Veri modülleri */}
        <rect x="9" y="9" width="4.5" height="4.5" rx="1.1" fill="currentColor" />
        <rect
          x="18.5"
          y="9"
          width="4.5"
          height="4.5"
          rx="1.1"
          fill="currentColor"
          opacity=".45"
        />
        <rect
          x="9"
          y="18.5"
          width="4.5"
          height="4.5"
          rx="1.1"
          fill="currentColor"
          opacity=".45"
        />
        <rect
          x="18.5"
          y="18.5"
          width="4.5"
          height="4.5"
          rx="1.1"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

/** Logo + kelime işareti. Sidebar, üst bar ve auth ekranlarında ortak. */
export function BrandLockup({
  className,
  subtitle,
}: {
  className?: string;
  subtitle?: string;
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <BrandMark className="size-8" />
      <span className="min-w-0">
        <span className="type-display block truncate text-base text-primary">
          QRMenü
        </span>
        {subtitle ? (
          <span className="block truncate text-xs text-muted">{subtitle}</span>
        ) : null}
      </span>
    </span>
  );
}
