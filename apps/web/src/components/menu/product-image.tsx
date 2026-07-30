"use client";

import Image from "next/image";
import { useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Ürün görseli. Aynı origin yolları Next optimizasyonundan geçer;
 * dış https adresleri optimize edilmeden gösterilir (host allow-list gerekmez).
 *
 * Görsel inene kadar altında bir skeleton bekler ve yükleme bitince ikisi
 * birbirine erir — kart hiçbir anda boş bir dikdörtgen olarak görünmez.
 * Geçiş saf CSS opacity: yüzlerce kartın olduğu menüde JS animasyonu
 * gereksiz maliyet olurdu.
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
  const [loaded, setLoaded] = useState(false);

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
    <>
      {!loaded ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-sunken"
        />
      ) : null}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={isRemote}
        onLoad={() => setLoaded(true)}
        className={cn(
          "object-cover transition-opacity duration-300 ease-out",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
      />
    </>
  );
}
