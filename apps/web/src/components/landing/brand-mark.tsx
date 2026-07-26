import { cn } from "@/lib/cn";

/** MasaAkış işareti: masa yüzeyi ve üzerinden geçen akış çizgisi. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-[0.7rem] bg-primary text-primary-fg",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none">
        <path
          d="M4 9.5h16M6.5 9.5v8M17.5 9.5v8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M6 6c2.2-2 4-2 6 0s3.8 2 6 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity=".65"
        />
      </svg>
    </span>
  );
}
