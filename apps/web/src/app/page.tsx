import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-5 py-16">
      <section>
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#176b52]">
          MasaAkış
        </p>
        <h1 className="max-w-2xl text-5xl font-black leading-[0.98] tracking-[-0.05em] sm:text-7xl">
          Menü güncel.
          <br />
          Masa akışta.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-[#68736b]">
          Uygulama indirmeden açılan ücretsiz QR menü. İşletme operasyonları,
          ihtiyaç oldukça güvenli eklentilerle büyür.
        </p>
        <Link
          href="/m/demo-kafe"
          className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#176b52] px-6 font-bold text-white shadow-lg shadow-emerald-950/15"
        >
          Demo menüyü aç
        </Link>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold text-[#176b52]">
          <Link href="/admin/giris" className="underline underline-offset-4">Yönetici girişi</Link>
          <Link href="/admin/kayit" className="underline underline-offset-4">Ücretsiz menü oluştur</Link>
        </div>
      </section>
    </main>
  );
}
