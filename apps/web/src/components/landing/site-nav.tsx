"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { BrandMark } from "./brand-mark";

const LINKS = [
  { href: "#ozellikler", label: "Özellikler" },
  { href: "#nasil-calisir", label: "Nasıl çalışır" },
  { href: "#eklentiler", label: "Eklentiler" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-border/80 bg-bg/85 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg"
          aria-label="MasaAkış ana sayfa"
        >
          <BrandMark />
          <span className="text-base font-semibold tracking-[-0.01em] text-fg">
            MasaAkış
          </span>
        </Link>

        <nav aria-label="Ana menü" className="ml-4 hidden md:block">
          <ul className="flex items-center gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-fg-soft transition hover:bg-sunken hover:text-fg"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <Link
            href="/admin/giris"
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-fg-soft transition hover:bg-sunken hover:text-fg"
          >
            Giriş
          </Link>
          <Link
            href="/admin/kayit"
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg shadow-xs transition hover:bg-primary-hover"
          >
            Ücretsiz menü oluştur
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="site-nav-mobile"
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
          className="ml-auto grid size-11 place-items-center rounded-lg border border-border text-fg md:hidden"
        >
          {open ? (
            <X size={20} aria-hidden="true" />
          ) : (
            <Menu size={20} aria-hidden="true" />
          )}
        </button>
      </div>

      <div
        id="site-nav-mobile"
        hidden={!open}
        className={cn("border-t border-border bg-surface md:hidden")}
      >
        <nav aria-label="Mobil menü" className="safe-bottom px-4 py-3">
          <ul className="grid gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center rounded-lg px-3 text-base font-medium text-fg"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid gap-2 border-t border-border pt-3">
            <Link
              href="/admin/giris"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border-strong px-4 font-semibold text-fg"
            >
              Giriş
            </Link>
            <Link
              href="/admin/kayit"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-4 font-semibold text-primary-fg"
            >
              Ücretsiz menü oluştur
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
