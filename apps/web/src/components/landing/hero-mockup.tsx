import { ChefHat } from "lucide-react";
import { cn } from "@/lib/cn";
import { ORDER_STATES, describe } from "@/lib/labels";
import { formatMoney } from "@/lib/format";

const MENU_ITEMS = [
  { name: "Flat White", note: "Çift shot espresso, kadifemsi süt", price: 125 },
  { name: "San Sebastian", note: "Yoğun kıvamlı fırın cheesecake", price: 185 },
];

/** Ürünün asıl konusu: siparişin durum makinesinden geçişi. */
const FLOW = [
  { state: "SUBMITTED", at: "19:42" },
  { state: "ACCEPTED", at: "19:42" },
  { state: "PREPARING", at: "19:43" },
  { state: "READY", at: "19:51" },
] as const;

/**
 * Hero görseli. Uygulamada gerçekten kullanılan durum etiketlerinden ve
 * para biçimlendiricisinden kurulur; ekran görüntüsü değildir.
 * Adımlar CSS ile sırayla belirir. prefers-reduced-motion altında animasyon
 * süresi sıfırlandığı için tüm adımlar doğrudan son hâlinde görünür.
 */
export function HeroMockup() {
  return (
    <div aria-hidden="true" className="relative min-w-0 select-none">
      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-lg">
        {/* Fiş başlığı */}
        <div className="flex items-center justify-between gap-3 border-b border-dashed border-border-strong px-5 py-4">
          <div>
            <p className="type-chit text-xs uppercase tracking-[0.14em] text-muted">
              Masa 4 · Salon
            </p>
            <p className="type-chit mt-0.5 text-lg font-semibold text-fg">
              #A-1742
            </p>
          </div>
          <p className="type-chit text-right text-sm text-muted">
            Demo Kafe
            <span className="mt-0.5 block text-base font-semibold text-fg">
              {formatMoney(310, "TRY")}
            </span>
          </p>
        </div>

        {/* Sipariş kalemleri */}
        <ul className="grid gap-2 px-5 py-4">
          {MENU_ITEMS.map((item) => (
            <li key={item.name} className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-sunken text-muted">
                <ChefHat size={16} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-fg">
                  <span className="type-chit mr-1.5 text-muted">1×</span>
                  {item.name}
                </span>
                <span className="block truncate text-xs text-muted">
                  {item.note}
                </span>
              </span>
              <span className="type-chit shrink-0 text-sm font-semibold text-fg">
                {formatMoney(item.price, "TRY")}
              </span>
            </li>
          ))}
        </ul>

        {/* Durum akışı — ürünün adını taşıyan kısım */}
        <div className="border-t border-dashed border-border-strong bg-sunken/60 px-5 py-4">
          <p className="type-chit mb-3 text-[0.7rem] uppercase tracking-[0.16em] text-muted">
            Akış
          </p>
          <ol className="relative grid gap-3 pl-5">
            {/* Adımları birleştiren, yukarıdan aşağı dolan çizgi */}
            <span className="absolute bottom-2 left-[3px] top-2 w-px bg-border-strong">
              <span className="chit-fill block size-full bg-primary" />
            </span>
            {FLOW.map((step, index) => {
              const label = describe(ORDER_STATES, step.state);
              const last = index === FLOW.length - 1;
              return (
                <li
                  key={step.state}
                  className="chit-step relative flex items-center gap-3"
                  style={{ animationDelay: `${index * 0.9}s` }}
                >
                  <span
                    className={cn(
                      "absolute -left-5 top-1/2 size-[7px] -translate-y-1/2 rounded-full ring-2 ring-sunken",
                      last ? "bg-success" : "bg-primary",
                    )}
                  />
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      last ? "font-semibold text-fg" : "text-fg-soft",
                    )}
                  >
                    {label.label}
                  </span>
                  <span className="type-chit text-xs text-muted">{step.at}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
