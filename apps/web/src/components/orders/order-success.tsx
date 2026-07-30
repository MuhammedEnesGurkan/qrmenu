"use client";

import { CheckCircle2 } from "lucide-react";
import { ORDER_STATES, describe } from "@/lib/labels";
import { formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type PlacedOrder = {
  id: string;
  state: string;
  estimatedTotal: number;
  currency: string;
  version: number;
  pickupNumber: string | null;
};

export function OrderSuccess({
  order,
  onNewOrder,
}: {
  order: PlacedOrder;
  onNewOrder: () => void;
}) {
  const state = describe(ORDER_STATES, order.state);

  return (
    <section
      aria-labelledby="order-success-title"
      className="animate-fade-up rounded-2xl border-2 border-success/30 bg-success-soft p-6 text-center"
    >
      <span
        aria-hidden="true"
        className="mx-auto grid size-14 place-items-center rounded-full bg-surface text-success"
      >
        <CheckCircle2 size={28} />
      </span>
      <h2 id="order-success-title" className="type-display mt-4 text-xl text-fg">
        Siparişin alındı
      </h2>
      <div className="mt-3 flex justify-center">
        <Badge tone={state.tone} icon={state.icon}>
          {state.label}
        </Badge>
      </div>

      {order.pickupNumber ? (
        <div className="mt-6 rounded-xl border border-success/30 bg-surface px-4 py-5">
          <p className="type-chit text-[0.7rem] uppercase tracking-[0.26em] text-muted">
            Teslim numaran
          </p>
          <p className="type-chit animate-pop mt-2 text-6xl font-semibold text-fg sm:text-7xl">
            {order.pickupNumber}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Bu numara ekranda göründüğünde siparişini alabilirsin.
          </p>
        </div>
      ) : (
        <p className="mt-5 text-sm leading-6 text-fg-soft">
          Siparişin mutfağa iletildi. Masana servis edilecek.
        </p>
      )}

      <p className="mt-5 text-sm text-fg-soft">
        Tahmini toplam{" "}
        <span className="type-chit font-semibold">
          {formatMoney(order.estimatedTotal, order.currency)}
        </span>
      </p>
      <p className="mt-1 text-xs leading-5 text-muted">
        Gösterilen tutar tahminidir; ödeme, POS veya mali belge değildir.
      </p>

      <Button variant="outline" className="mt-6" onClick={onNewOrder}>
        Yeni sipariş ekle
      </Button>
    </section>
  );
}
