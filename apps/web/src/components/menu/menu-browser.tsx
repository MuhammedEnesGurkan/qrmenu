"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/states";
import { categoryAnchor, type MenuLayout, type MenuProduct, type PublicMenu } from "@/lib/menu";
import { ProductDetail } from "./product-detail";
import { ProductCard, ProductRow } from "./product-tiles";

export function MenuBrowser({
  menu,
  layout,
}: {
  menu: PublicMenu;
  layout: MenuLayout;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MenuProduct | null>(null);
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const sections = useMemo(
    () =>
      menu.categories.map((category, index) => ({
        ...category,
        anchor: categoryAnchor(category.name, index),
      })),
    [menu.categories],
  );

  const normalized = query.trim().toLocaleLowerCase("tr-TR");
  const filtered = useMemo(() => {
    if (!normalized) return sections;
    return sections
      .map((section) => ({
        ...section,
        products: section.products.filter((product) =>
          `${product.name} ${product.description ?? ""}`
            .toLocaleLowerCase("tr-TR")
            .includes(normalized),
        ),
      }))
      .filter((section) => section.products.length > 0);
  }, [sections, normalized]);

  const matchCount = filtered.reduce(
    (total, section) => total + section.products.length,
    0,
  );

  // Görünürdeki kategoriyi yatay navigasyonda işaretle.
  useEffect(() => {
    if (normalized) return;
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
      { rootMargin: "-140px 0px -60% 0px", threshold: 0 },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [sections, normalized]);

  // Aktif kategori düğmesini yatay şeritte ortala.
  // scrollIntoView tüm kaydırılabilir ataları etkilediği için (WebKit'te sayfayı
  // geri sıçratıyor) yalnız şeridin scrollLeft değeri güncelleniyor.
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

  const emptyMenu = sections.every((section) => section.products.length === 0);

  return (
    <>
      <div className="no-print sticky top-0 z-30 border-b border-border bg-[color:var(--menu-surface)]/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 pt-3 sm:px-6">
          <search>
            <div className="relative">
              <Search
                aria-hidden="true"
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Menüde ara"
                aria-label="Menüde ara"
                aria-describedby="menu-search-status"
                className="h-12 w-full min-w-0 rounded-xl border border-input bg-surface pl-11 pr-11 text-base text-fg outline-none transition placeholder:text-muted focus:border-[color:var(--menu-primary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--menu-primary)]"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Aramayı temizle"
                  className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-sunken hover:text-fg"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </search>
          <p id="menu-search-status" role="status" className="sr-only">
            {normalized
              ? `${matchCount} ürün bulundu.`
              : "Arama kutusu boş, tüm menü gösteriliyor."}
          </p>

          {sections.length > 1 && !normalized ? (
            <nav aria-label="Kategoriler" className="pb-2 pt-2.5">
              <div
                ref={navRef}
                className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                          ? "bg-[color:var(--menu-primary)] text-[color:var(--menu-primary-fg)]"
                          : "border border-border bg-surface text-fg-soft hover:border-[color:var(--menu-primary)]/40",
                      )}
                    >
                      {section.name}
                    </a>
                  );
                })}
              </div>
            </nav>
          ) : (
            <div className="h-3" />
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6">
        {emptyMenu ? (
          <EmptyState
            title="Menü henüz hazırlanıyor"
            description="Bu işletme ürünlerini yakında ekleyecek. Daha sonra tekrar deneyin."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search size={20} />}
            title="Aramana uygun ürün yok"
            description={`"${query.trim()}" için sonuç bulunamadı. Farklı bir kelime deneyebilirsin.`}
          />
        ) : (
          filtered.map((section) => (
            <section
              key={section.anchor}
              id={section.anchor}
              data-scroll-target
              aria-labelledby={`${section.anchor}-title`}
              className="mb-10 last:mb-0"
            >
              <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-border pb-2">
                <h2
                  id={`${section.anchor}-title`}
                  className="text-xl font-semibold tracking-[-0.02em] text-fg [overflow-wrap:anywhere]"
                >
                  {section.name}
                </h2>
                <span className="shrink-0 text-xs tabular-nums text-muted">
                  {section.products.length} ürün
                </span>
              </div>

              {section.products.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border-strong px-4 py-6 text-center text-sm text-muted">
                  Bu kategoride şu an ürün yok.
                </p>
              ) : layout === "COMPACT" ? (
                <div className="grid gap-2">
                  {section.products.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      onSelect={setSelected}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {section.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={setSelected}
                    />
                  ))}
                </div>
              )}
            </section>
          ))
        )}
      </div>

      <ProductDetail product={selected} onClose={() => setSelected(null)} />
    </>
  );
}
