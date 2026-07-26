import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-5 py-16">
      <section className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-fg sm:text-4xl">
          Menü bulunamadı
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted">
          Bağlantı yanlış olabilir ya da işletme menüyü yayından kaldırmış
          olabilir. Masadaki QR kodu tekrar okutmayı deneyin.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-fg transition hover:bg-primary-hover"
          >
            Ana sayfa
          </Link>
          <Link
            href="/m/demo-kafe"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border-strong bg-surface px-6 font-semibold text-fg transition hover:border-primary hover:text-primary"
          >
            Demo menüyü aç
          </Link>
        </div>
      </section>
    </main>
  );
}
