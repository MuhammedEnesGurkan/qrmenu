import Image from "next/image";
import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Ürün görseli. Aynı origin yolları Next optimizasyonundan geçer;
 * dış https adresleri optimize edilmeden gösterilir (host allow-list gerekmez).
 */
export function ProductImage({
  src,
  alt,
  className,
  sizes = "(min-width: 640px) 20rem, 100vw",
  priority = false,
}: {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "grid place-items-center bg-sunken text-border-strong",
          className,
        )}
      >
        <UtensilsCrossed
          aria-hidden="true"
          className="size-1/4 max-h-10 min-h-5"
        />
        <span className="sr-only">Bu ürün için görsel eklenmemiş</span>
      </div>
    );
  }

  const isRemote = /^https?:\/\//i.test(src);
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={isRemote}
      className={cn("object-cover", className)}
    />
  );
}
