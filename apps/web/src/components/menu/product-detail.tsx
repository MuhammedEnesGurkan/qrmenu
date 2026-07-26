"use client";

import { Sheet } from "@/components/ui/overlay";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";
import type { MenuProduct } from "@/lib/menu";
import { ProductImage } from "./product-image";

export function ProductDetail({
  product,
  onClose,
}: {
  product: MenuProduct | null;
  onClose: () => void;
}) {
  if (!product) return null;
  return (
    <Sheet
      open
      onClose={onClose}
      title={product.name}
      description={product.available ? undefined : "Bu ürün şu an tükendi."}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          sizes="(min-width: 640px) 36rem, 100vw"
          className="size-full"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <p className="text-2xl font-semibold tabular-nums tracking-[-0.02em] text-[color:var(--menu-primary)]">
          {formatMoney(product.price, product.currency)}
        </p>
        {product.available ? (
          <Badge tone="success" icon="✓">
            Mevcut
          </Badge>
        ) : (
          <Badge tone="neutral" icon="✕">
            Tükendi
          </Badge>
        )}
      </div>

      {product.description ? (
        <p className="mt-4 text-sm leading-7 text-fg-soft">
          {product.description}
        </p>
      ) : null}

      {product.allergenInfo ? (
        <div className="mt-5 rounded-xl border border-warning/25 bg-warning-soft px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-warning">
            Alerjen bilgisi
          </p>
          <p className="mt-1 text-sm leading-6 text-fg-soft">
            {product.allergenInfo}
          </p>
        </div>
      ) : null}

      <p className="mt-5 text-xs leading-5 text-muted">
        Bu ekran menü görüntüleme modudur. Fiyatlar güncel menü verisinden
        gösterilir.
      </p>
    </Sheet>
  );
}
