import Link from "next/link";
import {
  Bell,
  ChefHat,
  Check,
  Grid2x2,
  Languages,
  LayoutGrid,
  QrCode,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Store,
  Table2,
  WifiOff,
} from "lucide-react";
import { BrandMark } from "@/components/landing/brand-mark";
import { HeroMockup } from "@/components/landing/hero-mockup";
import { SiteNav } from "@/components/landing/site-nav";
import { Badge } from "@/components/ui/badge";

const TRUST = [
  { icon: WifiOff, text: "Uygulama indirmeyi gerektirmez" },
  { icon: Smartphone, text: "Mobil öncelikli, tek dokunuşta açılır" },
  { icon: Store, text: "POS zorunluluğu yok" },
  { icon: RefreshCw, text: "Menü güncellemeleri anında yayında" },
  { icon: ShieldCheck, text: "Yetki kontrollü personel sistemi" },
];

const FEATURES = [
  {
    icon: QrCode,
    title: "Ücretsiz QR menü",
    body: "Kalıcı bir menü adresi, indirilebilir QR kod ve her cihazda açılan hızlı bir sayfa. Ücretsiz katmanın tamamı budur.",
    free: true,
  },
  {
    icon: Table2,
    title: "Masa siparişi",
    body: "Masaya özel QR ile açılan güvenli oturum, sunucu tarafında fiyatlanan sipariş ve tekrar gönderime karşı koruma.",
  },
  {
    icon: Bell,
    title: "Garson çağırma",
    body: "Müşteri masadan çağrı bırakır, personel ekranında öncelikli alanda görünür ve üstlenilir.",
  },
  {
    icon: ChefHat,
    title: "Mutfak ekranı",
    body: "Kategoriye göre istasyona düşen kalemler, bekleme süresi ve büyük dokunma hedefli hazırlama akışı.",
  },
  {
    icon: ShoppingBag,
    title: "Self servis",
    body: "Gel-al siparişlerde kişisel veri içermeyen teslim numarası ve salonda okunan büyük hazır ekranı.",
  },
  {
    icon: LayoutGrid,
    title: "Katalog yönetimi",
    body: "CSV/XLSX içe aktarma, önizlemeli toplu fiyat değişikliği ve çakışma güvenli geri alma.",
  },
  {
    icon: Languages,
    title: "Çoklu dil",
    body: "Menü, kategori ve ürün çevirileri; müşteri tarafında dil seçici ve eksik çeviri takibi.",
  },
  {
    icon: Grid2x2,
    title: "Çoklu şube",
    body: "Şubeler arası izole veri, aktif şube seçimi ve şubeye özel menü yönetimi.",
  },
];

const STEPS = [
  {
    title: "İşletme hesabını oluştur",
    body: "Kayıt tamamlandığında tenant, merkez şube ve ilk menün otomatik hazırlanır.",
  },
  {
    title: "Menünü ekle",
    body: "Kategori ve ürünleri gir, görsel yükle, fiyatları belirle ve menüyü yayınla.",
  },
  {
    title: "QR'ı indir",
    body: "Menü QR'ını PNG olarak indir, masalara özel QR'ları alan bazında üret.",
  },
  {
    title: "Gereken eklentileri aç",
    body: "Masa siparişi, mutfak ekranı ya da çoklu şubeyi ihtiyaç doğduğunda etkinleştir.",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-16">
          {/* min-w-0: grid track'lerin içerik min-content'inin altına inebilmesi için */}
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
            <div className="min-w-0">
              <h1 className="type-display text-4xl leading-[1.04] text-fg sm:text-5xl">
                Menü her zaman güncel,
                <br className="hidden sm:block" /> masa akışta kalsın.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
                MasaAkış ile QR menün ücretsiz yayında olur. Masa siparişi,
                garson çağırma ve mutfak ekranı gibi operasyon özelliklerini
                yalnızca ihtiyaç duyduğunda eklenti olarak açarsın.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/admin/kayit"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-fg shadow-sm transition hover:bg-primary-hover"
                >
                  Ücretsiz menü oluştur
                </Link>
                <Link
                  href="/m/demo-kafe"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border-strong bg-surface px-6 font-semibold text-fg transition hover:border-primary hover:text-primary"
                >
                  Demo menüyü incele
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted">
                Kredi kartı istemez. Ücretsiz katman süresizdir.
              </p>
            </div>
            <div className="min-w-0 lg:pb-12">
              <HeroMockup />
            </div>
          </div>
        </section>

        {/* Güven ve avantaj bandı */}
        <section
          aria-label="Öne çıkan avantajlar"
          className="border-y border-border bg-surface"
        >
          <ul className="mx-auto grid max-w-6xl gap-x-8 gap-y-4 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
            {TRUST.map((item) => (
              <li key={item.text} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"
                >
                  <item.icon size={16} />
                </span>
                <span className="text-sm leading-6 text-fg-soft">
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Özellikler */}
        <section
          id="ozellikler"
          data-scroll-target
          className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
        >
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
              Özellikler
            </p>
            <h2 className="type-display mt-3 text-3xl text-fg sm:text-4xl">
              Menüden mutfağa kadar tek sistem
            </h2>
            <p className="mt-4 text-base leading-7 text-muted">
              Küçük bir kafeyle başlayıp çok şubeli bir işletmeye kadar aynı
              panelde kalırsın. Her modül birbirine bağlı çalışır.
            </p>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="bg-surface p-6">
                <span
                  aria-hidden="true"
                  className="grid size-10 place-items-center rounded-xl bg-sunken text-fg-soft"
                >
                  <feature.icon size={18} />
                </span>
                <h3 className="mt-4 flex flex-wrap items-center gap-2 text-base font-semibold text-fg">
                  {feature.title}
                  {feature.free ? <Badge tone="success">Ücretsiz</Badge> : null}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {feature.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Nasıl çalışır */}
        <section
          id="nasil-calisir"
          data-scroll-target
          className="border-y border-border bg-surface"
        >
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
                  Nasıl çalışır
                </p>
                <h2 className="type-display mt-3 text-3xl text-fg sm:text-4xl">
                  Dört adımda yayında
                </h2>
                <p className="mt-4 text-base leading-7 text-muted">
                  Kurulum donanım gerektirmez. Var olan tabletin veya
                  telefonunla çalışmaya başlayabilirsin.
                </p>
              </div>
              <ol className="grid gap-6 sm:grid-cols-2">
                {STEPS.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span
                      aria-hidden="true"
                      className="grid size-9 shrink-0 place-items-center rounded-full border border-border-strong text-sm font-semibold tabular-nums text-primary"
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-fg">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-6 text-muted">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Eklenti modeli */}
        <section
          id="eklentiler"
          data-scroll-target
          className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
        >
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="rounded-2xl border-2 border-primary/25 bg-primary-soft/40 p-7 sm:p-8">
              <Badge tone="success" icon="✓">
                Her zaman ücretsiz
              </Badge>
              <h2 className="type-display mt-4 text-2xl text-fg">
                QR menü çekirdeği
              </h2>
              <p className="mt-3 text-sm leading-6 text-fg-soft">
                Menü, kategori ve ürün yönetimi; kalıcı public adres, QR
                indirme, ürün görselleri ve mevcut/tükendi durumu. Süre sınırı
                yok.
              </p>
              <ul className="mt-5 grid gap-2.5">
                {[
                  "Sınırsız kategori ve ürün",
                  "Kalıcı /m/isletme-adi adresi",
                  "İndirilebilir QR kod",
                  "Anlık fiyat ve mevcutluk güncellemesi",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <Check
                      size={16}
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-primary"
                    />
                    <span className="text-fg-soft">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-7 sm:p-8">
              <Badge tone="accent" icon="+">
                İhtiyaca göre aç
              </Badge>
              <h2 className="type-display mt-4 text-2xl text-fg">
                Operasyon eklentileri
              </h2>
              <p className="mt-3 text-sm leading-6 text-fg-soft">
                Her biri ayrı ayrı açılır ve kapatılır. Bir eklentiyi
                kapattığında geçmiş verin silinmez; yalnızca yeni ücretli
                işlemler durur.
              </p>
              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {[
                  "Masa siparişi",
                  "Self servis",
                  "Mutfak istasyonları",
                  "Katalog Pro",
                  "Çoklu dil",
                  "Çoklu şube",
                  "Marka görünümü",
                  "Gelişmiş raporlar",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent"
                    />
                    <span className="text-fg-soft">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs leading-5 text-muted">
                Güncel eklenti fiyatları yönetim panelindeki eklenti mağazasında
                sunucudan gelir.
              </p>
            </div>
          </div>
        </section>

        {/* Son CTA */}
        <section className="border-t border-border bg-inverse text-inverse-fg">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
            <h2 className="type-display text-3xl sm:text-4xl">
              Menünü bugün yayına al
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-inverse-fg/70">
              Kayıt olduğunda ilk menün ve merkez şuben hazır gelir. QR'ını
              indirip masalara koyman yeterli.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/admin/kayit"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-inverse-fg px-6 font-semibold text-inverse transition hover:bg-inverse-fg/90"
              >
                Ücretsiz menü oluştur
              </Link>
              <Link
                href="/admin/giris"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-inverse-fg/25 px-6 font-semibold text-inverse-fg transition hover:bg-inverse-fg/10"
              >
                Yönetici girişi
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <BrandMark />
              <span className="text-base font-semibold text-fg">MasaAkış</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
              Restoran ve kafeler için QR menü, masa siparişi ve mutfak
              operasyonu. Ücretsiz menüyle başla, ihtiyaç oldukça büyüt.
            </p>
          </div>
          <nav aria-label="Ürün bağlantıları">
            <h2 className="text-sm font-semibold text-fg">Ürün</h2>
            <ul className="mt-3 grid gap-1">
              {[
                { href: "#ozellikler", label: "Özellikler" },
                { href: "#nasil-calisir", label: "Nasıl çalışır" },
                { href: "#eklentiler", label: "Eklentiler" },
                { href: "/m/demo-kafe", label: "Demo menü" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-flex min-h-9 items-center text-sm text-muted transition hover:text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Hesap bağlantıları">
            <h2 className="text-sm font-semibold text-fg">Hesap</h2>
            <ul className="mt-3 grid gap-1">
              {[
                { href: "/admin/giris", label: "Yönetici girişi" },
                { href: "/admin/kayit", label: "Ücretsiz kayıt" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-9 items-center text-sm text-muted transition hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="border-t border-border">
          <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">
            MasaAkış · Gösterilen tutarlar tahminidir; ödeme, POS veya mali
            belge işlevi sunulmaz.
          </p>
        </div>
      </footer>
    </>
  );
}
