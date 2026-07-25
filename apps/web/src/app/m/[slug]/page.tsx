import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MenuBrowser } from "@/components/menu-browser";
import { getPublicMenu } from "@/lib/menu";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const menu = await getPublicMenu(slug);
  return {
    title: menu?.name ?? "Menü bulunamadı",
    description: menu?.description ?? "QR menü",
    robots: menu ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function MenuPage({ params }: Props) {
  const { slug } = await params;
  const menu = await getPublicMenu(slug);
  if (!menu) notFound();

  return (
    <main>
      <header className="mx-auto max-w-3xl px-4 pb-8 pt-10 sm:px-6 sm:pt-16">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-[#176b52] font-black text-white">
            M
          </span>
          <span className="text-sm font-bold uppercase tracking-[0.16em] text-[#176b52]">
            MasaAkış Menü
          </span>
        </div>
        <h1 className="text-4xl font-black leading-none tracking-[-0.05em] sm:text-6xl">
          {menu.name}
        </h1>
        {menu.description && (
          <p className="mt-4 max-w-xl text-base leading-7 text-[#68736b] sm:text-lg">
            {menu.description}
          </p>
        )}
        <span className="no-print mt-5 inline-flex min-h-11 items-center rounded-full border border-[#cdc7b9] px-4 text-sm font-bold">
          Güncel menü · Türkçe
        </span>
      </header>

      <MenuBrowser menu={menu} />

      <footer className="border-t border-[#ddd8cc] px-4 py-8 text-center text-sm text-[#68736b]">
        <p>Fiyatlar güncel menü verisinden gösterilir.</p>
        <p className="mt-2 font-bold text-[#176b52]">MasaAkış ile sunuluyor</p>
      </footer>
    </main>
  );
}

