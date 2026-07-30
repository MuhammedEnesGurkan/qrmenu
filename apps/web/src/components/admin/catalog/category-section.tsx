"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Archive,
  ChevronDown,
  Eye,
  EyeOff,
  ImageOff,
  Pencil,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import type { Category, Product } from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/field";
import {
  AnimatePresence,
  Highlight,
  motion,
  StaggerItem,
  useReducedMotion,
} from "@/components/motion";
import { tween } from "@/lib/motion";

export type CategoryActions = {
  onToggleVisibility: (category: Category) => void;
  onRename: (category: Category) => void;
  onArchive: (category: Category) => void;
  onAddProduct: (category: Category) => void;
  onEditProduct: (product: Product) => void;
  onArchiveProduct: (product: Product) => void;
  onToggleAvailability: (product: Product) => void;
  onSavePrice: (product: Product, price: number) => void;
};

export function CategorySection({
  category,
  canWrite,
  busy,
  actions,
  defaultOpen,
}: {
  category: Category;
  canWrite: boolean;
  busy: boolean;
  actions: CategoryActions;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const reduced = useReducedMotion();
  const soldOut = category.products.filter((item) => !item.available).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={`category-panel-${category.id}`}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg text-left"
        >
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={cn(
              "shrink-0 text-muted transition",
              !open && "-rotate-90",
            )}
          />
          <span className="min-w-0">
            <span className="block truncate text-base font-semibold text-fg">
              {category.name}
            </span>
            <span className="block text-xs text-muted">
              {category.products.length} ürün
              {soldOut > 0 ? ` · ${soldOut} tükendi` : ""}
            </span>
          </span>
        </button>

        <Badge
          tone={category.active ? "success" : "neutral"}
          icon={category.active ? "✓" : "✕"}
        >
          {category.active ? "Yayında" : "Gizli"}
        </Badge>

        {canWrite ? (
          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              leadingIcon={<Plus size={15} aria-hidden="true" />}
              onClick={() => actions.onAddProduct(category)}
            >
              <span className="hidden sm:inline">Ürün ekle</span>
              <span className="sm:hidden">Ürün</span>
            </Button>
            <DropdownMenu
              label={`${category.name} kategori işlemleri`}
              items={[
                {
                  label: "Kategoriyi yeniden adlandır",
                  icon: <Pencil size={15} />,
                  onSelect: () => actions.onRename(category),
                  disabled: busy,
                },
                {
                  label: category.active
                    ? "Menüden gizle"
                    : "Menüde göster",
                  icon: category.active ? (
                    <EyeOff size={15} />
                  ) : (
                    <Eye size={15} />
                  ),
                  onSelect: () => actions.onToggleVisibility(category),
                  disabled: busy,
                },
                {
                  label: "Kategoriyi arşivle",
                  icon: <Archive size={15} />,
                  tone: "destructive",
                  onSelect: () => actions.onArchive(category),
                  disabled: busy,
                },
              ]}
            />
          </div>
        ) : null}
      </div>

      {/*
       * Akordeon: kategori başına tek bir element yüksekliği animate edilir.
       * Liste elemanlarının hiçbiri layout animasyonuna girmez, maliyet sabit.
       * Kapalıyken DOM'dan tamamen çıkar — `hidden` gibi davranır.
       */}
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={`category-panel-${category.id}`}
            key="panel"
            initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={tween.normal}
            className="overflow-hidden"
          >
            {category.products.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted sm:px-5">
                Bu kategoride henüz ürün yok.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {/* Silinen ürün önce çıkış animasyonunu tamamlar. */}
                <AnimatePresence initial={false} mode="popLayout">
                  {category.products.map((product, index) => (
                    <ProductRow
                      key={product.id}
                      index={index}
                      product={product}
                      canWrite={canWrite}
                      busy={busy}
                      actions={actions}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function ProductRow({
  product,
  index,
  canWrite,
  busy,
  actions,
}: {
  product: Product;
  index: number;
  canWrite: boolean;
  busy: boolean;
  actions: CategoryActions;
}) {
  const [price, setPrice] = useState(String(product.price));
  const [saved, setSaved] = useState(false);
  const dirty = Number(price) !== product.price && price.trim() !== "";

  /*
   * Kaydedilen satır kısa süre vurgulanır: kullanıcı hangi ürünün
   * güncellendiğini listeyi taramadan görür.
   */
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 1400);
    return () => clearTimeout(timer);
  }, [saved]);

  return (
    <StaggerItem
      as="li"
      index={index}
      className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:px-5"
    >
    <Highlight
      active={saved}
      tone="success"
      className="flex w-full min-w-0 flex-wrap items-center gap-3 rounded-lg sm:flex-nowrap"
    >
      <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-sunken">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            sizes="3rem"
            unoptimized={/^https?:\/\//i.test(product.imageUrl)}
            className="object-cover"
          />
        ) : (
          <ImageOff size={16} aria-hidden="true" className="text-muted" />
        )}
      </span>

      <span className="min-w-0 flex-1 basis-40">
        <span className="block truncate text-sm font-semibold text-fg">
          {product.name}
        </span>
        <span className="block truncate text-xs text-muted">
          {product.sku ? `SKU ${product.sku} · ` : ""}
          {product.description || "Açıklama yok"}
        </span>
      </span>

      <Badge
        tone={product.available ? "success" : "neutral"}
        icon={product.available ? "✓" : "✕"}
      >
        {product.available ? "Mevcut" : "Tükendi"}
      </Badge>

      {canWrite ? (
        <span className="flex shrink-0 items-center gap-2">
          <label className="sr-only" htmlFor={`price-${product.id}`}>
            {product.name} fiyatı
          </label>
          <Input
            id={`price-${product.id}`}
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="w-24 text-sm tabular-nums"
          />
          <Button
            size="sm"
            variant={dirty ? "primary" : "outline"}
            disabled={busy || !dirty}
            onClick={() => {
              actions.onSavePrice(product, Number(price));
              setSaved(true);
            }}
          >
            Kaydet
          </Button>
          <DropdownMenu
            label={`${product.name} ürün işlemleri`}
            items={[
              {
                label: "Ürünü düzenle",
                icon: <Pencil size={15} />,
                onSelect: () => actions.onEditProduct(product),
                disabled: busy,
              },
              {
                label: product.available ? "Tükendi olarak işaretle" : "Mevcut yap",
                icon: product.available ? <EyeOff size={15} /> : <Eye size={15} />,
                onSelect: () => actions.onToggleAvailability(product),
                disabled: busy,
              },
              {
                label: "Ürünü arşivle",
                icon: <Archive size={15} />,
                tone: "destructive",
                onSelect: () => actions.onArchiveProduct(product),
                disabled: busy,
              },
            ]}
          />
        </span>
      ) : (
        <span className="shrink-0 text-sm font-semibold tabular-nums text-fg">
          {formatMoney(product.price, product.currency)}
        </span>
      )}
    </Highlight>
    </StaggerItem>
  );
}
