import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MasaAkış",
    short_name: "MasaAkış",
    description: "QR menü ve işletme operasyon sistemi",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f2e9",
    theme_color: "#176b52",
    lang: "tr",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}

