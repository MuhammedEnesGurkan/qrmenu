"use client";

import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import type { MenuProduct } from "@/lib/menu";
import { ProductImage } from "./product-image";

type TileProps = {
  product: MenuProduct;
  onSelect: (product: MenuProduct) => void;
};

const shell =
  "menu-card group w-full text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--menu-primary)]";

function SoldOutFlag() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sunken px-2 py-0.5 text-[0.7rem] font-semibold text-muted ring-1 ring-inset ring-border-strong">
      <span aria-hidden="true">✕</span>
      Tükendi
    </span>
  );
}

/** branding.layout === "CARDS": görsel ağırlıklı, iştah açıcı kart. */
export function ProductCard({ product, onSelect }: TileProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className={cn(
        shell,
        "flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xs hover:border-[color:var(--menu-primary)]/40 hover:shadow-md",
        !product.available && "opacity-70",
      )}
    >
      <span className="relative block aspect-[4/3] w-full overflow-hidden bg-sunken">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="size-full transition duration-300 group-hover:scale-[1.03]"
        />
      </span>
      <span className="flex flex-1 flex-col p-4">
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0 text-base font-semibold leading-6 tracking-[-0.01em] text-fg [overflow-wrap:anywhere]">
            {product.name}
          </span>
          {!product.available && <SoldOutFlag />}
        </span>
        {product.description ? (
          <span className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted [overflow-wrap:anywhere]">
            {product.description}
          </span>
        ) : null}
        <span className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="text-base font-semibold tabular-nums text-[color:var(--menu-primary)]">
            {formatMoney(product.price, product.currency)}
          </span>
          {product.allergenInfo ? (
            <span className="text-[0.7rem] font-medium text-warning">
              <span aria-hidden="true">⚠</span> Alerjen
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

/** branding.layout === "COMPACT": daha çok ürünü ekrana sığdıran yoğun liste. */
export function ProductRow({ product, onSelect }: TileProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className={cn(
        shell,
        "flex items-center gap-3.5 rounded-xl border border-border bg-surface p-3 hover:border-[color:var(--menu-primary)]/40",
        !product.available && "opacity-70",
      )}
    >
      <span className="relative block size-16 shrink-0 overflow-hidden rounded-lg bg-sunken">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          sizes="4rem"
          className="size-full"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="min-w-0 truncate text-sm font-semibold text-fg">
            {product.name}
          </span>
          {!product.available && <SoldOutFlag />}
        </span>
        {product.description ? (
          <span className="mt-0.5 line-clamp-1 block text-xs leading-5 text-muted">
            {product.description}
          </span>
        ) : null}
        {product.allergenInfo ? (
          <span className="mt-0.5 block text-[0.7rem] font-medium text-warning">
            <span aria-hidden="true">⚠</span> Alerjen bilgisi var
          </span>
        ) : null}
      </span>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-[color:var(--menu-primary)]">
        {formatMoney(product.price, product.currency)}
      </span>
    </button>
  );
}
