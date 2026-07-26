"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Pickup = { number: string; readyAt: string };
type Board = { branchName: string; ready: Pickup[] };

/**
 * Salonda uzaktan okunan hazır sipariş ekranı.
 * Kişisel veri göstermez; yalnız teslim numaralarını listeler.
 */
export function PickupBoard({ slug }: { slug: string }) {
  const [data, setData] = useState<Board | null>(null);
  const [offline, setOffline] = useState(false);
  const seen = useRef<Set<string>>(new Set());
  // İlk yüklemede ekrandaki her numara "yeni" sayılmasın diye ayrı bayrak.
  const primed = useRef(false);
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/backend/api/public/pickups/${slug}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error(String(response.status));
        const board = (await response.json()) as Board;
        if (cancelled) return;

        const arrived = board.ready
          .map((item) => item.number)
          .filter((number) => !seen.current.has(number));
        board.ready.forEach((item) => seen.current.add(item.number));
        // Ekrandan düşen numaraları unut ki tekrar geldiğinde yine vurgulansın.
        const current = new Set(board.ready.map((item) => item.number));
        seen.current.forEach((number) => {
          if (!current.has(number)) seen.current.delete(number);
        });

        setData(board);
        setOffline(false);
        if (primed.current && arrived.length > 0) {
          setFresh(new Set(arrived));
          setTimeout(() => !cancelled && setFresh(new Set()), 4000);
        }
        primed.current = true;
      } catch {
        if (!cancelled) setOffline(true);
      }
    }

    void load();
    const timer = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [slug]);

  return (
    <main
      id="main"
      className="safe-top safe-bottom flex min-h-dvh flex-col bg-inverse px-4 py-8 text-inverse-fg sm:px-8"
    >
      <header className="text-center">
        <p className="type-chit text-sm uppercase tracking-[0.24em] text-inverse-fg/55 sm:text-lg">
          {data?.branchName ?? " "}
        </p>
        <h1 className="type-display mt-2 text-4xl sm:text-6xl lg:text-7xl">
          Hazır siparişler
        </h1>
      </header>

      <div className="mt-10 flex flex-1 flex-col justify-center">
        {offline ? (
          <p role="alert" className="text-center text-xl text-inverse-fg/70">
            Bağlantı kurulamadı. Ekran otomatik olarak yeniden deneyecek.
          </p>
        ) : !data ? (
          <p role="status" className="text-center text-xl text-inverse-fg/50">
            Yükleniyor…
          </p>
        ) : data.ready.length === 0 ? (
          <div className="text-center">
            <p className="text-2xl text-inverse-fg/60 sm:text-3xl">
              Şu an hazır sipariş yok
            </p>
            <p className="mt-3 text-base text-inverse-fg/40 sm:text-lg">
              Numaranız hazır olduğunda bu ekranda görünecek.
            </p>
          </div>
        ) : (
          <ul
            aria-live="polite"
            aria-label="Hazır teslim numaraları"
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 xl:grid-cols-5"
          >
            {data.ready.map((item) => (
              <li
                key={item.number}
                className={cn(
                  // Kupürün kendisi: yan kenarlardan oyulmuş perforasyon.
                  "ticket-stub grid place-items-center rounded-2xl px-2 py-7 text-inverse sm:py-10",
                  fresh.has(item.number) && "animate-pop ring-4 ring-success",
                )}
              >
                <span className="type-chit text-[0.65rem] uppercase tracking-[0.28em] text-inverse/45 sm:text-xs">
                  Teslim no
                </span>
                <span className="type-chit mt-1 text-5xl font-semibold sm:text-7xl lg:text-8xl">
                  {item.number}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
