import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-5 text-center">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#176b52]">
          404
        </p>
        <h1 className="mt-3 text-4xl font-black">Menü bulunamadı</h1>
        <p className="mt-4 text-[#68736b]">
          Bağlantıyı kontrol edin veya işletmeden güncel QR kodu isteyin.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex min-h-11 items-center rounded-full bg-[#176b52] px-5 font-bold text-white"
        >
          Ana sayfa
        </Link>
      </section>
    </main>
  );
}

