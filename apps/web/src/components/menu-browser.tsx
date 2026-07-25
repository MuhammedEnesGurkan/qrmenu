"use client";

import { useMemo, useState } from "react";
import type { MenuProduct, PublicMenu } from "@/lib/menu";
import { formatMoney } from "@/lib/menu";

export function MenuBrowser({ menu }: { menu: PublicMenu }) {
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<MenuProduct | null>(
    null,
  );

  const categories = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    if (!normalized) return menu.categories;
    return menu.categories
      .map((category) => ({
        ...category,
        products: category.products.filter((product) =>
          `${product.name} ${product.description ?? ""}`
            .toLocaleLowerCase("tr-TR")
            .includes(normalized),
        ),
      }))
      .filter((category) => category.products.length > 0);
  }, [menu.categories, query]);

  return (
    <>
      <div className="no-print sticky top-0 z-20 border-y border-[#ddd8cc] bg-[#f6f2e9]/95 px-4 py-3 backdrop-blur">
        <label className="mx-auto flex min-h-12 max-w-3xl items-center gap-3 rounded-full border border-[#cdc7b9] bg-white px-4 shadow-sm">
          <span aria-hidden="true">⌕</span>
          <span className="sr-only">Menüde ara</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Menüde ara"
            style={{ height: 44 }}
            className="h-11 min-w-0 flex-1 appearance-none bg-transparent text-base outline-none placeholder:text-[#8a928c]"
          />
        </label>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-20 pt-7 sm:px-6">
        {categories.length === 0 ? (
          <p className="rounded-3xl border border-[#ddd8cc] bg-white p-8 text-center text-[#68736b]">
            Aramana uygun bir ürün bulunamadı.
          </p>
        ) : (
          categories.map((category) => (
            <section
              key={category.name}
              aria-labelledby={`category-${category.name}`}
              className="mb-10"
            >
              <h2
                id={`category-${category.name}`}
                className="mb-4 text-2xl font-black tracking-[-0.03em]"
              >
                {category.name}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {category.products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedProduct(product)}
                    className="menu-card min-h-32 rounded-3xl border border-[#ddd8cc] bg-[#fffdf8] p-5 text-left shadow-[0_8px_30px_rgb(32_45_36/0.05)] transition hover:-translate-y-0.5 hover:border-[#9eb4a8] disabled:opacity-60"
                  >
                    <span className="flex h-full flex-col">
                      <span className="flex items-start justify-between gap-3">
                        <strong className="text-lg leading-6">
                          {product.name}
                        </strong>
                        {!product.available && (
                          <span className="rounded-full bg-stone-200 px-2 py-1 text-xs font-bold text-stone-600">
                            Tükendi
                          </span>
                        )}
                      </span>
                      <span className="mt-2 line-clamp-2 text-sm leading-6 text-[#68736b]">
                        {product.description}
                      </span>
                      <strong className="mt-auto pt-4 text-[#176b52]">
                        {formatMoney(product.price, product.currency)}
                      </strong>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {selectedProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-title"
          className="fixed inset-0 z-40 flex items-end bg-black/45 p-0 sm:items-center sm:justify-center sm:p-6"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSelectedProduct(null);
          }}
        >
          <div className="safe-bottom w-full rounded-t-[2rem] bg-[#fffdf8] p-6 shadow-2xl sm:max-w-lg sm:rounded-[2rem]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-[#176b52]">
                  Ürün detayı
                </p>
                <h2 id="product-title" className="text-2xl font-black">
                  {selectedProduct.name}
                </h2>
              </div>
              <button
                type="button"
                autoFocus
                onClick={() => setSelectedProduct(null)}
                aria-label="Kapat"
                className="grid min-h-11 min-w-11 place-items-center rounded-full bg-[#eee9df] text-xl"
              >
                ×
              </button>
            </div>
            <p className="leading-7 text-[#566159]">
              {selectedProduct.description}
            </p>
            {selectedProduct.allergenInfo && (
              <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                <strong>Alerjen:</strong> {selectedProduct.allergenInfo}
              </p>
            )}
            <p className="mt-6 text-xl font-black text-[#176b52]">
              {formatMoney(selectedProduct.price, selectedProduct.currency)}
            </p>
            <p className="mt-4 text-sm text-[#68736b]">
              Bu ücretsiz menü görüntüleme modudur. Sipariş özelliği etkin değil.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
