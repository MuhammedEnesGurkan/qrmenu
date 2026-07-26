"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Minus,
  Plus,
  ReceiptText,
  Search,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { tableApi } from "@/lib/table-api";
import { categoryAnchor } from "@/lib/menu";
import { formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/overlay";
import { SegmentedControl } from "@/components/ui/tabs";
import { Alert, EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { ProductImage } from "@/components/menu/product-image";
import { OrderSuccess, type PlacedOrder } from "./order-success";

type TableProduct = {
  id: string;
  name: string;
  description: string | null;
  allergenInfo: string | null;
  imageUrl: string | null;
  price: number;
  currency: string;
  available: boolean;
};

type TableMenu = {
  tableName: string;
  areaName: string;
  orderingEnabled: boolean;
  selfServiceEnabled: boolean;
  menu: {
    name: string;
    categories: { name: string; products: TableProduct[] }[];
  };
};

export function TableOrder() {
  const toast = useToast();
  const [data, setData] = useState<TableMenu | null>(null);
  const [loadError, setLoadError] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [serviceMode, setServiceMode] = useState("DINE_IN");
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [callingWaiter, setCallingWaiter] = useState("");
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const load = () => {
    setLoadError("");
    tableApi<TableMenu>("/api/table/menu")
      .then(setData)
      .catch((caught: unknown) =>
        setLoadError(
          caught instanceof Error ? caught.message : "Masa oturumu açılamadı.",
        ),
      );
  };

  useEffect(load, []);

  const sections = useMemo(
    () =>
      (data?.menu.categories ?? []).map((category, index) => ({
        ...category,
        anchor: categoryAnchor(category.name, index),
      })),
    [data],
  );

  const products = useMemo(
    () => sections.flatMap((section) => section.products),
    [sections],
  );

  /**
   * Ekranda gösterilen bölümler. Sepet hesabı her zaman tüm ürünler üzerinden
   * yapılır; arama yalnız görünürlüğü daraltır.
   */
  const visibleSections = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    if (!normalized) return sections;
    return sections
      .map((section) => ({
        ...section,
        products: section.products.filter((product) =>
          `${product.name} ${product.description ?? ""} ${section.name}`
            .toLocaleLowerCase("tr-TR")
            .includes(normalized),
        ),
      }))
      .filter((section) => section.products.length > 0);
  }, [sections, query]);

  const lines = useMemo(
    () =>
      products
        .map((product) => ({ product, quantity: cart[product.id] ?? 0 }))
        .filter((line) => line.quantity > 0),
    [products, cart],
  );

  const total = lines.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  );
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const currency = products[0]?.currency ?? "TRY";

  useEffect(() => {
    if (sections.length < 2) return;
    const targets = sections
      .map((section) => document.getElementById(section.anchor))
      .filter((node): node is HTMLElement => node !== null);
    if (targets.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveAnchor(visible.target.id);
      },
      { rootMargin: "-120px 0px -65% 0px" },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [sections]);

  // Yalnız yatay şerit kaydırılır; scrollIntoView sayfayı da kaydırıyor.
  useEffect(() => {
    const strip = navRef.current;
    if (!activeAnchor || !strip) return;
    const target = strip.querySelector<HTMLElement>(
      `[data-anchor="${activeAnchor}"]`,
    );
    if (!target) return;
    strip.scrollTo({
      left: Math.max(
        0,
        target.offsetLeft - (strip.clientWidth - target.clientWidth) / 2,
      ),
      behavior: "smooth",
    });
  }, [activeAnchor]);

  function setQuantity(productId: string, next: number) {
    setCart((current) => {
      const value = Math.max(0, Math.min(99, next));
      if (value === 0) {
        const { [productId]: _removed, ...rest } = current;
        return rest;
      }
      return { ...current, [productId]: value };
    });
  }

  async function submit() {
    if (lines.length === 0) return;
    setSubmitting(true);
    try {
      const created = await tableApi<PlacedOrder>("/api/table/orders", {
        method: "POST",
        headers: {
          "Idempotency-Key": crypto.randomUUID().replaceAll("-", ""),
        },
        body: JSON.stringify({
          items: lines.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
            notes: null,
          })),
          customerNote: note.trim() || null,
          serviceMode,
        }),
      });
      setOrder(created);
      setCart({});
      setNote("");
      setCartOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "Sipariş oluşturulamadı.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Hem "Garson çağır" hem "Hesap iste" aynı garson-çağrısı endpoint'ine
   * farklı mesajla düşer. Ödeme veya POS işlemi yapılmaz.
   */
  async function callWaiter(kind: "GARSON" | "HESAP") {
    setCallingWaiter(kind);
    try {
      await tableApi("/api/table/waiter-calls", {
        method: "POST",
        body: JSON.stringify({
          message: kind === "HESAP" ? "Hesap istendi" : "Garson çağrıldı",
        }),
      });
      toast.success(
        kind === "HESAP"
          ? "Hesap isteğin iletildi. Personel birazdan masana gelecek."
          : "Garson çağrıldı. Birazdan masana gelecek.",
      );
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "İstek iletilemedi.",
      );
    } finally {
      setCallingWaiter("");
    }
  }

  if (loadError && !data) {
    return (
      <main id="main" className="mx-auto max-w-lg px-4 py-16">
        <ErrorState
          title="Masa oturumu açılamadı"
          message={`${loadError} QR kodu tekrar okutmayı deneyin veya personelden yardım isteyin.`}
          onRetry={load}
        />
      </main>
    );
  }

  if (!data) {
    return (
      <main
        id="main"
        role="status"
        aria-live="polite"
        className="mx-auto max-w-2xl px-4 py-6"
      >
        <span className="sr-only">Masa menüsü yükleniyor…</span>
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="mt-4 h-11 w-full rounded-lg" />
        <div className="mt-4 grid gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <>
      <main id="main" className="mx-auto max-w-2xl px-4 pb-40 pt-5 sm:px-6">
        <header className="rounded-2xl bg-inverse p-5 text-inverse-fg">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-inverse-fg/60">
            {data.areaName}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            {data.tableName}
          </h1>
          <p className="mt-1 truncate text-sm text-inverse-fg/70">
            {data.menu.name}
          </p>
        </header>

        {/* Misafirin en sık ihtiyaç duyduğu iki talep, menüden önce */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => void callWaiter("GARSON")}
            disabled={callingWaiter !== ""}
            className="flex min-h-[4.5rem] flex-col justify-center rounded-xl border border-primary/25 bg-primary-soft px-4 text-left transition hover:border-primary/50 disabled:opacity-60"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Bell size={17} aria-hidden="true" />
              Garson çağır
            </span>
            <span className="mt-0.5 text-xs text-muted">
              {callingWaiter === "GARSON" ? "İletiliyor…" : "Size yardımcı olalım"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => void callWaiter("HESAP")}
            disabled={callingWaiter !== ""}
            className="flex min-h-[4.5rem] flex-col justify-center rounded-xl border border-success/25 bg-success-soft px-4 text-left transition hover:border-success/50 disabled:opacity-60"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-success">
              <ReceiptText size={17} aria-hidden="true" />
              Hesap iste
            </span>
            <span className="mt-0.5 text-xs text-muted">
              {callingWaiter === "HESAP" ? "İletiliyor…" : "Hesabımızı getirin"}
            </span>
          </button>
        </div>

        {order ? (
          <div className="mt-5">
            <OrderSuccess order={order} onNewOrder={() => setOrder(null)} />
          </div>
        ) : null}

        <div className="relative mt-4">
          <Search
            aria-hidden="true"
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ürün veya kategori ara"
            aria-label="Menüde ara"
            className="h-12 w-full rounded-xl border border-input bg-surface pl-11 pr-4 text-base outline-none transition placeholder:text-muted focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          />
        </div>

        {!data.orderingEnabled ? (
          <Alert tone="info" className="mt-5">
            Bu işletmede masadan sipariş şu an kapalı. Menüyü inceleyebilir,
            garson çağırabilirsiniz.
          </Alert>
        ) : null}

        {visibleSections.length > 1 && !query.trim() ? (
          <nav
            aria-label="Kategoriler"
            className="sticky top-0 z-20 -mx-4 mt-5 bg-bg/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6"
          >
            <div
              ref={navRef}
              className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {sections.map((section) => {
                const active = activeAnchor === section.anchor;
                return (
                  <a
                    key={section.anchor}
                    href={`#${section.anchor}`}
                    data-anchor={section.anchor}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "inline-flex min-h-11 shrink-0 items-center rounded-lg px-3.5 text-sm font-medium transition",
                      active
                        ? "bg-primary text-primary-fg"
                        : "border border-border bg-surface text-fg-soft",
                    )}
                  >
                    {section.name}
                  </a>
                );
              })}
            </div>
          </nav>
        ) : null}

        {sections.length === 0 ? (
          <EmptyState
            className="mt-6"
            title="Menü henüz hazır değil"
            description="Bu masaya bağlı menüde ürün bulunmuyor. Personelden yardım isteyebilirsin."
          />
        ) : visibleSections.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={<Search size={20} />}
            title="Aramana uygun ürün yok"
            description={`"${query.trim()}" için sonuç bulunamadı. Farklı bir kelime deneyebilirsin.`}
          />
        ) : (
          visibleSections.map((section) => (
            <section
              key={section.anchor}
              id={section.anchor}
              data-scroll-target
              aria-labelledby={`${section.anchor}-title`}
              className="mt-6"
            >
              <h2
                id={`${section.anchor}-title`}
                className="border-b border-border pb-2 text-lg font-semibold tracking-[-0.02em] text-fg"
              >
                {section.name}
              </h2>
              <ul className="mt-3 grid gap-2.5">
                {section.products.map((product) => (
                  <ProductLine
                    key={product.id}
                    product={product}
                    quantity={cart[product.id] ?? 0}
                    orderingEnabled={data.orderingEnabled}
                    onChange={(next) => setQuantity(product.id, next)}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </main>

      {/* Sabit alt çubuk */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 pt-3 backdrop-blur sm:px-6">
        <div className="mx-auto max-w-2xl">
          {data.selfServiceEnabled && data.orderingEnabled ? (
            <SegmentedControl
              className="mb-3"
              ariaLabel="Servis biçimi"
              value={serviceMode}
              onChange={setServiceMode}
              items={[
                { value: "DINE_IN", label: "Masaya servis" },
                { value: "SELF_SERVICE", label: "Gel-al / self servis" },
              ]}
            />
          ) : null}

          {data.orderingEnabled ? (
            <Button
              size="lg"
              fullWidth
              className="min-h-14"
              disabled={itemCount === 0}
              onClick={() => setCartOpen(true)}
              leadingIcon={
                <span className="relative">
                  <ShoppingBag size={19} aria-hidden="true" />
                  {itemCount > 0 ? (
                    <span className="type-chit absolute -right-2 -top-2 grid min-w-4 place-items-center rounded-full bg-primary-fg px-1 text-[0.6rem] font-semibold text-primary">
                      {itemCount}
                    </span>
                  ) : null}
                </span>
              }
            >
              <span className="truncate">
                {itemCount === 0
                  ? "Sepetin boş"
                  : `Sepeti gör · ${formatMoney(total, currency)}`}
              </span>
            </Button>
          ) : null}

          <p className="py-2 text-center text-[0.7rem] leading-4 text-muted">
            Gösterilen tutar tahminidir; ödeme, POS veya mali belge değildir.
          </p>
        </div>
      </div>

      {/* Sepet */}
      {cartOpen ? (
        <Sheet
          open
          onClose={() => setCartOpen(false)}
          title="Sepetin"
          description={`${data.tableName} · ${
            serviceMode === "SELF_SERVICE"
              ? "Gel-al / self servis"
              : "Masaya servis"
          }`}
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setCartOpen(false)}
                disabled={submitting}
              >
                Menüye dön
              </Button>
              <Button
                size="lg"
                loading={submitting}
                disabled={lines.length === 0}
                onClick={() => void submit()}
              >
                Siparişi gönder · {formatMoney(total, currency)}
              </Button>
            </>
          }
        >
          {lines.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag size={20} />}
              title="Sepetin boş"
              description="Menüden ürün ekleyerek başla."
            />
          ) : (
            <>
              <ul className="grid gap-2">
                {lines.map((line) => (
                  <li
                    key={line.product.id}
                    className="flex min-w-0 items-center gap-3 rounded-xl border border-border p-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-fg">
                        {line.product.name}
                      </span>
                      <span className="block text-xs tabular-nums text-muted">
                        {formatMoney(line.product.price, line.product.currency)}{" "}
                        × {line.quantity}
                      </span>
                    </span>
                    <QuantityControl
                      name={line.product.name}
                      quantity={line.quantity}
                      onChange={(next) => setQuantity(line.product.id, next)}
                    />
                    <button
                      type="button"
                      aria-label={`${line.product.name} ürününü sepetten çıkar`}
                      onClick={() => setQuantity(line.product.id, 0)}
                      className="grid size-11 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-destructive-soft hover:text-destructive"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-4">
                <label
                  htmlFor="order-note"
                  className="text-sm font-medium text-fg"
                >
                  Sipariş notu
                  <span className="ml-1 text-xs font-normal text-muted">
                    (isteğe bağlı)
                  </span>
                </label>
                <textarea
                  id="order-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="Özel isteklerini buraya yazabilirsin…"
                  className="mt-1.5 min-h-16 w-full rounded-lg border border-input bg-surface px-3 py-2.5 text-base outline-none transition placeholder:text-muted focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                />
              </div>

              <p className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-4">
                <span className="text-sm text-muted">Tahmini toplam</span>
                <span className="text-lg font-semibold tabular-nums text-fg">
                  {formatMoney(total, currency)}
                </span>
              </p>
              <p className="mt-2 text-xs leading-5 text-muted">
                Kesin tutar sunucuda güncel menü fiyatlarından hesaplanır.
              </p>
            </>
          )}
        </Sheet>
      ) : null}
    </>
  );
}

function ProductLine({
  product,
  quantity,
  orderingEnabled,
  onChange,
}: {
  product: TableProduct;
  quantity: number;
  orderingEnabled: boolean;
  onChange: (next: number) => void;
}) {
  const disabled = !orderingEnabled || !product.available;
  return (
    <li
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-xl border border-border bg-surface p-3",
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
          <span className="min-w-0 text-sm font-semibold text-fg [overflow-wrap:anywhere]">
            {product.name}
          </span>
          {!product.available ? (
            <Badge tone="neutral" icon="✕">
              Tükendi
            </Badge>
          ) : null}
        </span>
        {product.description ? (
          <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-muted">
            {product.description}
          </span>
        ) : null}
        {product.allergenInfo ? (
          <span className="mt-0.5 block text-[0.7rem] text-warning">
            <span aria-hidden="true">⚠</span> {product.allergenInfo}
          </span>
        ) : null}
        <span className="mt-1 block text-sm font-semibold tabular-nums text-primary">
          {formatMoney(product.price, product.currency)}
        </span>
      </span>

      {!disabled ? (
        <QuantityControl
          name={product.name}
          quantity={quantity}
          onChange={onChange}
        />
      ) : null}
    </li>
  );
}

function QuantityControl({
  name,
  quantity,
  onChange,
}: {
  name: string;
  quantity: number;
  onChange: (next: number) => void;
}) {
  return (
    <span className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5">
      <button
        type="button"
        aria-label={`${name} adedini azalt`}
        disabled={quantity === 0}
        onClick={() => onChange(quantity - 1)}
        className="grid size-10 place-items-center rounded-md text-fg-soft transition hover:bg-sunken disabled:opacity-35"
      >
        <Minus size={16} aria-hidden="true" />
      </button>
      <output
        aria-label={`${name} adedi`}
        className="min-w-7 text-center text-sm font-semibold tabular-nums text-fg"
      >
        {quantity}
      </output>
      <button
        type="button"
        aria-label={`${name} adedini artır`}
        onClick={() => onChange(quantity + 1)}
        className="grid size-10 place-items-center rounded-md bg-primary text-primary-fg transition hover:bg-primary-hover"
      >
        <Plus size={16} aria-hidden="true" />
      </button>
    </span>
  );
}
