import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MenuBrowser } from "@/components/menu/menu-browser";
import {
  brandInitials,
  fontStack,
  getPublicMenu,
  resolveBranding,
} from "@/lib/menu";
import { readableOn } from "@/lib/format";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ locale?: string }>;
};

const LOCALE_NAMES = new Intl.DisplayNames(["tr"], { type: "language" });

function localeLabel(locale: string) {
  try {
    return LOCALE_NAMES.of(locale) ?? locale.toUpperCase();
  } catch {
    return locale.toUpperCase();
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const menu = await getPublicMenu(slug);
  return {
    title: menu?.name ?? "Menü bulunamadı",
    description: menu?.description ?? "QR menü",
    robots: menu
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export default async function MenuPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { locale } = await searchParams;
  const menu = await getPublicMenu(slug, locale);
  if (!menu) notFound();

  const brand = resolveBranding(menu);
  const onPrimary = readableOn(brand.primaryColor);
  const locales = menu.availableLocales?.length
    ? menu.availableLocales
    : [menu.locale];
  const productCount = menu.categories.reduce(
    (total, category) => total + category.products.length,
    0,
  );

  return (
    <main
      id="main"
      style={
        {
          "--menu-primary": brand.primaryColor,
          "--menu-primary-fg": onPrimary,
          "--menu-surface": brand.surfaceColor,
          backgroundColor: brand.surfaceColor,
          fontFamily: fontStack(brand.font),
          minHeight: "100dvh",
        } as React.CSSProperties
      }
    >
      <header className="mx-auto max-w-5xl px-4 pb-6 pt-8 sm:px-6 sm:pb-8 sm:pt-12">
        <div className="flex flex-wrap items-start gap-4 sm:gap-5">
          {menu.logoUrl ? (
            <span className="relative block size-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface sm:size-20">
              <Image
                src={menu.logoUrl}
                alt={`${menu.name} logosu`}
                fill
                sizes="5rem"
                priority
                unoptimized={/^https?:\/\//i.test(menu.logoUrl)}
                className="object-contain p-1.5"
              />
            </span>
          ) : (
            <span
              aria-hidden="true"
              style={{
                backgroundColor: brand.primaryColor,
                color: onPrimary,
              }}
              className="grid size-16 shrink-0 place-items-center rounded-2xl text-xl font-semibold tracking-[-0.02em] sm:size-20 sm:text-2xl"
            >
              {brandInitials(menu.name)}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="type-display text-2xl leading-tight text-fg [overflow-wrap:anywhere] sm:text-4xl">
              {menu.name}
            </h1>
            {menu.description ? (
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted [overflow-wrap:anywhere] sm:text-base sm:leading-7">
                {menu.description}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-muted">
              {menu.categories.length} kategori · {productCount} ürün
            </p>
          </div>
        </div>

        {locales.length > 1 ? (
          <nav aria-label="Menü dili" className="no-print mt-5">
            <ul className="flex flex-wrap gap-2">
              {locales.map((code) => {
                const current = code === menu.locale;
                return (
                  <li key={code}>
                    <a
                      href={`/m/${slug}?locale=${encodeURIComponent(code)}`}
                      lang={code}
                      aria-current={current ? "page" : undefined}
                      style={
                        current
                          ? {
                              backgroundColor: brand.primaryColor,
                              color: onPrimary,
                            }
                          : undefined
                      }
                      className={
                        current
                          ? "inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold"
                          : "inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-fg-soft transition hover:border-[color:var(--menu-primary)]/40"
                      }
                    >
                      {localeLabel(code)}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}
      </header>

      <MenuBrowser menu={menu} layout={brand.layout} />

      <footer className="border-t border-border px-4 py-8 text-center">
        <p className="text-xs leading-5 text-muted">
          Fiyatlar güncel menü verisinden gösterilir. Ödeme, POS veya mali belge
          işlevi sunulmaz.
        </p>
        {!brand.hidePoweredBy ? (
          <p
            className="mt-2 text-sm font-semibold"
            style={{ color: brand.primaryColor }}
          >
            MasaAkış ile sunuluyor
          </p>
        ) : null}
      </footer>
    </main>
  );
}
