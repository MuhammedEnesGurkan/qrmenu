import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

// Tüm yüzlerde latin-ext alt kümesi Türkçe ş, ğ, ı, İ, ç, ö, ü karakterlerini kapsar.

/** Arayüz metni. */
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

/** Fiş verisi: teslim numarası, masa, süre, tutar. */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: {
    default: "MasaAkış · Restoranlar için QR menü ve masa operasyonu",
    template: "%s · MasaAkış",
  },
  description:
    "Ücretsiz QR menü ile başla, masa siparişi ve mutfak ekranı gibi operasyon özelliklerini ihtiyaç oldukça eklenti olarak aç.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MasaAkış",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#b33a50",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${plexMono.variable}`}
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:font-semibold focus:text-primary-fg"
        >
          Ana içeriğe atla
        </a>
        <ToastProvider>{children}</ToastProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
