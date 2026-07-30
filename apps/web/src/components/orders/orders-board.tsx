"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, Clock, Receipt, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  api,
  json,
  type Order,
  type WaiterCall,
} from "@/lib/admin-api";
import {
  ORDER_STATES,
  SERVICE_MODES,
  WAITER_CALL_STATES,
  describe,
} from "@/lib/labels";
import { elapsedLabel, formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState, ErrorState, SkeletonCards } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import {
  AnimatePresence,
  Highlight,
  SkeletonTransition,
  StaggerItem,
  StaggerList,
} from "@/components/motion";
import { AdminScreen, useAdmin } from "../admin/admin-shell";
import { useResource } from "../admin/use-resource";

/**
 * Hangi siparişlerin bu oturumda yeni geldiğini izler.
 *
 * İlk yüklemede mevcut olan her kayıt "görülmüş" sayılır — aksi halde ekran
 * açılışında tüm kartlar birden parlar ve vurgu anlamını yitirir. Sonrasında
 * yalnız gerçekten yeni gelen id kısa süre vurgulanır.
 */
function useFreshIds(ids: string[]): Set<string> {
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  // Dizi her render'da yeniden kurulduğu için bağımlılık içeriğe bakar.
  const key = ids.join("|");

  useEffect(() => {
    const current = key ? key.split("|") : [];
    if (seen.current === null) {
      seen.current = new Set(current);
      return;
    }
    const added = current.filter((id) => !seen.current!.has(id));
    if (added.length === 0) return;
    added.forEach((id) => seen.current!.add(id));
    setFresh(new Set(added));
    const timer = setTimeout(() => setFresh(new Set()), 1400);
    return () => clearTimeout(timer);
  }, [key]);

  return fresh;
}

/** Bir siparişin bulunduğu durumdan izin verilen sonraki geçişler. */
function nextStates(order: Order): string[] {
  const map: Record<string, string[]> = {
    SUBMITTED: ["ACCEPTED", "REJECTED"],
    ACCEPTED: ["PREPARING"],
    PREPARING: [
      order.serviceMode === "SELF_SERVICE" ? "READY_FOR_PICKUP" : "READY",
    ],
    READY: ["SERVING"],
    SERVING: ["DELIVERED"],
    READY_FOR_PICKUP: ["PICKED_UP"],
  };
  return map[order.state] ?? [];
}

const FILTERS = [
  { value: "OPEN", label: "Açık" },
  { value: "SUBMITTED", label: "Yeni" },
  { value: "PREPARING", label: "Hazırlanıyor" },
  { value: "READY", label: "Hazır" },
  { value: "ALL", label: "Tümü" },
];

const OPEN_STATES = [
  "SUBMITTED",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "READY_FOR_PICKUP",
  "SERVING",
];

export function OrdersBoard() {
  return (
    <AdminScreen
      title="Sipariş ve garson akışı"
      description="Canlı akış; bağlantı koparsa 15 saniyede bir otomatik tazelenir."
      breadcrumb={[{ label: "Siparişler" }]}
      contained={false}
    >
      <div className="mx-auto w-full max-w-7xl">
        <OrdersBody />
      </div>
    </AdminScreen>
  );
}

function OrdersBody() {
  const { user } = useAdmin();
  const toast = useToast();
  const [filter, setFilter] = useState("OPEN");
  const [pendingId, setPendingId] = useState("");
  const [tick, setTick] = useState(() => Date.now());

  const canTransition = ["order/accept-reject", "order/prepare-ready", "order/deliver"].some(
    (permission) => user.permissions.includes(permission),
  );
  const canResolveCalls = user.permissions.includes("order/deliver");

  const loader = useCallback(
    async () =>
      Promise.all([
        api<Order[]>("/api/admin/orders"),
        api<WaiterCall[]>("/api/admin/orders/waiter-calls"),
      ]),
    [],
  );
  const { data, error, reload } = useResource(loader);

  // Canlı akış: SSE, düşerse 15 saniyelik polling devreye girer.
  useEffect(() => {
    const fallback = setInterval(() => void reload(), 15000);
    const events = new EventSource("/backend/api/admin/order-events");
    events.addEventListener("order", () => void reload());
    return () => {
      clearInterval(fallback);
      events.close();
    };
  }, [reload]);

  // Geçen süre etiketlerini dakikada bir tazele.
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const [orders, calls] = data ?? [[], []];
  const openCalls = calls.filter((call) => call.status !== "RESOLVED");
  const freshOrders = useFreshIds(orders.map((order) => order.id));

  const visible = useMemo(() => {
    if (filter === "ALL") return orders;
    if (filter === "OPEN") {
      return orders.filter((order) => OPEN_STATES.includes(order.state));
    }
    if (filter === "READY") {
      return orders.filter((order) =>
        ["READY", "READY_FOR_PICKUP"].includes(order.state),
      );
    }
    return orders.filter((order) => order.state === filter);
  }, [orders, filter]);

  async function transition(order: Order, state: string) {
    setPendingId(order.id);
    try {
      await api(
        `/api/admin/orders/${order.id}/state`,
        json("PATCH", { state, version: order.version }),
      );
      toast.success(
        `Sipariş durumu "${describe(ORDER_STATES, state).label}" olarak güncellendi.`,
      );
      await reload();
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "Durum değiştirilemedi.",
      );
    } finally {
      setPendingId("");
    }
  }

  async function updateCall(call: WaiterCall, status: string) {
    setPendingId(call.id);
    try {
      await api(
        `/api/admin/orders/waiter-calls/${call.id}`,
        json("PATCH", { status }),
      );
      toast.success(
        status === "ACKNOWLEDGED" ? "Çağrı üstlenildi." : "Çağrı kapatıldı.",
      );
      await reload();
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "Çağrı güncellenemedi.",
      );
    } finally {
      setPendingId("");
    }
  }

  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  /*
   * Skeleton ve içerik tek bir AnimatePresence içinde eritilir. `loading`
   * yalnız `data` yokken true: SSE ya da 15 saniyelik polling tazelemesi
   * ekranı skeleton'a geri düşürmez, sadece değişen kartlar oynar.
   */
  return (
    <SkeletonTransition
      loading={!data}
      skeleton={<SkeletonCards count={4} />}
      className="grid gap-6"
    >
    <div className="grid gap-6">
      {/* Garson çağrıları öncelikli alan */}
      <Card
        className={cn(
          openCalls.length > 0 && "ring-1 ring-inset ring-warning/30",
        )}
      >
        <CardHeader
          title="Garson çağrıları"
          description={
            openCalls.length === 0
              ? "Bekleyen çağrı yok."
              : `${openCalls.length} çağrı ilgi bekliyor.`
          }
          actions={
            <Badge
              tone={openCalls.length > 0 ? "warning" : "neutral"}
              icon={<Bell size={12} />}
            >
              {openCalls.length}
            </Badge>
          }
        />
        {openCalls.length > 0 ? (
          <StaggerList
            as="ul"
            aria-live="polite"
            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence initial={false} mode="popLayout">
            {openCalls.map((call, index) => {
              const status = describe(WAITER_CALL_STATES, call.status);
              return (
                <StaggerItem
                  as="li"
                  key={call.id}
                  index={index}
                  className={cn(
                    "rounded-xl border p-4 transition-colors duration-200",
                    call.status === "PENDING"
                      ? "border-destructive/30 bg-destructive-soft"
                      : "border-warning/30 bg-warning-soft",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-semibold text-fg">
                      {call.tableName ?? "Masa"}
                    </p>
                    <Badge tone={status.tone} icon={status.icon}>
                      {status.label}
                    </Badge>
                  </div>
                  {call.message ? (
                    <p className="mt-1.5 text-sm text-fg-soft">{call.message}</p>
                  ) : null}
                  <p className="type-chit mt-1 flex items-center gap-1 text-xs text-muted">
                    <Clock size={12} aria-hidden="true" />
                    {elapsedLabel(call.createdAt, tick)}
                  </p>
                  {canResolveCalls ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {call.status === "PENDING" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={pendingId === call.id}
                          onClick={() => void updateCall(call, "ACKNOWLEDGED")}
                        >
                          Üstlen
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        loading={pendingId === call.id}
                        onClick={() => void updateCall(call, "RESOLVED")}
                      >
                        Çözüldü
                      </Button>
                    </div>
                  ) : null}
                </StaggerItem>
              );
            })}
            </AnimatePresence>
          </StaggerList>
        ) : null}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          ariaLabel="Sipariş filtresi"
          value={filter}
          onChange={setFilter}
          items={FILTERS.map((item) => ({
            ...item,
            badge:
              item.value === "ALL"
                ? orders.length
                : item.value === "OPEN"
                  ? orders.filter((order) => OPEN_STATES.includes(order.state)).length
                  : item.value === "READY"
                    ? orders.filter((order) =>
                        ["READY", "READY_FOR_PICKUP"].includes(order.state),
                      ).length
                    : orders.filter((order) => order.state === item.value).length,
          }))}
        />
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<RefreshCw size={15} aria-hidden="true" />}
          onClick={() => void reload()}
        >
          Yenile
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Receipt size={20} />}
          title={
            orders.length === 0
              ? "Henüz sipariş yok"
              : "Bu filtrede sipariş yok"
          }
          description={
            orders.length === 0
              ? "Masalara QR yerleştirildiğinde ve masa siparişi eklentisi etkin olduğunda siparişler burada canlı görünür."
              : "Farklı bir durum filtresi seçebilirsin."
          }
          action={
            orders.length > 0 ? (
              <Button variant="outline" onClick={() => setFilter("ALL")}>
                Tümünü göster
              </Button>
            ) : undefined
          }
        />
      ) : (
        /*
         * Filtre değişince kartlar sertçe kaybolmaz: ayrılanlar exit
         * animasyonuyla çıkar, kalanlar `layout` sayesinde yeni konumlarına
         * kayar. Kart boyutu değiştiğinde de sıçrama olmaz.
         */
        <StaggerList as="ul" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((order, index) => (
              <OrderCard
                key={order.id}
                order={order}
                index={index}
                now={tick}
                fresh={freshOrders.has(order.id)}
                busy={pendingId === order.id}
                canTransition={canTransition}
                onTransition={transition}
              />
            ))}
          </AnimatePresence>
        </StaggerList>
      )}
    </div>
    </SkeletonTransition>
  );
}

function OrderCard({
  order,
  index,
  now,
  fresh,
  busy,
  canTransition,
  onTransition,
}: {
  order: Order;
  index: number;
  now: number;
  fresh: boolean;
  busy: boolean;
  canTransition: boolean;
  onTransition: (order: Order, state: string) => void;
}) {
  const state = describe(ORDER_STATES, order.state);
  const transitions = canTransition ? nextStates(order) : [];

  return (
    <StaggerItem as="li" index={index}>
      {/* Yeni gelen sipariş bir kez halkalanır; tüm liste yeniden oynamaz. */}
      <Highlight
        active={fresh}
        className="flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-xs sm:p-5"
      >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="type-chit truncate text-base font-semibold text-fg">
            {order.pickupNumber
              ? `Teslim no ${order.pickupNumber}`
              : (order.tableName ?? "Self servis")}
          </h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
            <span>{SERVICE_MODES[order.serviceMode] ?? order.serviceMode}</span>
            <span aria-hidden="true">·</span>
            <span className="type-chit inline-flex items-center gap-1">
              <Clock size={12} aria-hidden="true" />
              {elapsedLabel(order.submittedAt, now)}
            </span>
          </p>
        </div>
        <Badge tone={state.tone} icon={state.icon}>
          {state.label}
        </Badge>
      </div>

      <ul className="mt-4 grid gap-1.5 border-t border-border pt-3 text-sm">
        {order.items.map((item, index) => (
          <li key={`${order.id}-${index}`} className="flex justify-between gap-3">
            <span className="min-w-0">
              <span className="type-chit mr-1.5 font-semibold text-fg">
                {item.quantity}×
              </span>
              <span className="text-fg-soft">{item.name}</span>
            </span>
            <span className="type-chit shrink-0 text-muted">
              {formatMoney(item.unitPrice * item.quantity, item.currency)}
            </span>
          </li>
        ))}
      </ul>

      {order.customerNote ? (
        <p className="mt-3 rounded-lg border border-warning/25 bg-warning-soft px-3 py-2 text-xs leading-5 text-fg-soft">
          <span className="font-semibold text-warning">Not:</span>{" "}
          {order.customerNote}
        </p>
      ) : null}

      <p className="mt-3 flex items-baseline justify-between gap-2 border-t border-border pt-3">
        <span className="text-xs text-muted">Tahmini toplam</span>
        <span className="type-chit text-base font-semibold text-fg">
          {formatMoney(order.estimatedTotal, order.currency)}
        </span>
      </p>

      {transitions.length > 0 ? (
        /* mt-auto: kart yükseklikleri eşitlenirken butonlar hep altta kalır. */
        <div className="mt-4 flex flex-wrap gap-2 pt-0">
          {transitions.map((next) => {
            const target = describe(ORDER_STATES, next);
            return (
              <Button
                key={next}
                size="sm"
                variant={next === "REJECTED" ? "outline" : "primary"}
                className={next === "REJECTED" ? "text-destructive" : undefined}
                loading={busy}
                onClick={() => onTransition(order, next)}
              >
                {target.label}
              </Button>
            );
          })}
        </div>
      ) : null}
      </Highlight>
    </StaggerItem>
  );
}
