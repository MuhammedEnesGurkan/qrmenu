"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  BellRing,
  CheckCheck,
  ChefHat,
  ClipboardList,
  Clock,
  ConciergeBell,
  Table2,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  api,
  json,
  type Area,
  type Order,
  type WaiterCall,
} from "@/lib/admin-api";
import { ORDER_STATES, WAITER_CALL_STATES, describe } from "@/lib/labels";
import { elapsedLabel, formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { AdminShell, useAdmin } from "../admin/admin-shell";
import { useResource } from "../admin/use-resource";

const OPEN_STATES = [
  "SUBMITTED",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "READY_FOR_PICKUP",
  "SERVING",
];

/**
 * Durum geçişlerinin buton rengi. Renk ezberlenebilir olsun diye her hedef
 * durum sabit bir renge bağlanır; metin her zaman ikonla birlikte gösterilir.
 */
const ACTION_STYLE: Record<
  string,
  { className: string; icon: typeof CheckCheck; label?: string }
> = {
  ACCEPTED: {
    className: "bg-success text-primary-fg hover:brightness-110",
    icon: CheckCheck,
    label: "Siparişi onayla",
  },
  REJECTED: {
    className: "bg-destructive text-primary-fg hover:brightness-110",
    icon: X,
    label: "Siparişi reddet",
  },
  PREPARING: {
    className: "bg-accent text-primary-fg hover:brightness-110",
    icon: ChefHat,
    label: "Hazırlanmaya al",
  },
  READY: {
    className: "bg-info text-primary-fg hover:brightness-110",
    icon: ConciergeBell,
    label: "Hazırlandı",
  },
  READY_FOR_PICKUP: {
    className: "bg-info text-primary-fg hover:brightness-110",
    icon: ConciergeBell,
    label: "Teslime hazır",
  },
  SERVING: {
    className: "bg-violet text-primary-fg hover:brightness-110",
    icon: Table2,
    label: "Masaya götür",
  },
  DELIVERED: {
    className: "bg-primary text-primary-fg hover:bg-primary-hover",
    icon: CheckCheck,
    label: "Teslim edildi",
  },
  PICKED_UP: {
    className: "bg-primary text-primary-fg hover:bg-primary-hover",
    icon: CheckCheck,
    label: "Teslim alındı",
  },
};

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

export function WaiterPanel() {
  return (
    <AdminShell
      title="Garson paneli"
      description="Masalarındaki açık siparişleri ve misafir taleplerini buradan yönet."
      breadcrumb={[{ label: "Garson paneli" }]}
    >
      <WaiterBody />
    </AdminShell>
  );
}

function WaiterBody() {
  const { user } = useAdmin();
  const toast = useToast();
  const [filter, setFilter] = useState("ACIK");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState("");
  const [tick, setTick] = useState(() => Date.now());

  const canTransition = [
    "order/accept-reject",
    "order/prepare-ready",
    "order/deliver",
  ].some((permission) => user.permissions.includes(permission));
  const canResolveCalls = user.permissions.includes("order/deliver");

  const loader = useCallback(
    async () =>
      Promise.all([
        api<Order[]>("/api/admin/orders"),
        api<WaiterCall[]>("/api/admin/orders/waiter-calls"),
        api<Area[]>("/api/admin/tables").catch(() => [] as Area[]),
      ]),
    [],
  );
  const { data, error, loading, reload } = useResource(loader);

  // Canlı akış; bağlantı düşerse 15 saniyelik yedek tazeleme devreye girer.
  useEffect(() => {
    const fallback = setInterval(() => void reload(), 15000);
    const events = new EventSource("/backend/api/admin/order-events");
    events.addEventListener("order", () => void reload());
    return () => {
      clearInterval(fallback);
      events.close();
    };
  }, [reload]);

  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const [orders, calls, areas] = data ?? [[], [], []];

  /**
   * Masa listesi masaların kendisinden gelir; "açık sipariş" ve "bekleyen çağrı"
   * bilgisi sipariş ve çağrı kayıtlarından türetilir. Oturma durumu, kişi sayısı
   * ve adisyon tutarı backend'de tutulmadığı için uydurulmaz.
   */
  const rows = useMemo(() => {
    const openOrders = orders.filter((order) =>
      OPEN_STATES.includes(order.state),
    );
    const tables = areas.flatMap((area) =>
      area.tables.map((table) => ({ ...table, areaName: area.name })),
    );

    const known = tables.map((table) => {
      const tableOrders = openOrders.filter(
        (order) => order.tableName === table.name,
      );
      const tableCalls = calls.filter(
        (call) => call.status !== "RESOLVED" && call.tableName === table.name,
      );
      return {
        key: table.id,
        name: table.name,
        areaName: table.areaName,
        capacity: table.capacity,
        orders: tableOrders,
        calls: tableCalls,
      };
    });

    // Masa kaydı bulunmayan (ör. self servis) açık siparişler de listelenir.
    const orphan = openOrders.filter(
      (order) =>
        !tables.some((table) => table.name === order.tableName) &&
        !known.some((row) => row.orders.includes(order)),
    );
    const orphanRows = orphan.map((order) => ({
      key: order.id,
      name: order.pickupNumber
        ? `Teslim no ${order.pickupNumber}`
        : (order.tableName ?? "Self servis"),
      areaName: "Gel-al",
      capacity: null as number | null,
      orders: [order],
      calls: [] as WaiterCall[],
    }));

    return [...known, ...orphanRows];
  }, [orders, calls, areas]);

  const openRows = rows.filter((row) => row.orders.length > 0);
  const callRows = rows.filter((row) => row.calls.length > 0);
  const idleRows = rows.filter(
    (row) => row.orders.length === 0 && row.calls.length === 0,
  );

  const visible =
    filter === "ACIK" ? openRows : filter === "CAGRI" ? callRows : rows;

  const selected =
    rows.find((row) => row.key === selectedTable) ?? visible[0] ?? null;

  async function transition(order: Order, state: string) {
    setPendingId(order.id);
    try {
      await api(
        `/api/admin/orders/${order.id}/state`,
        json("PATCH", { state, version: order.version }),
      );
      toast.success(
        `${describe(ORDER_STATES, state).label} olarak güncellendi.`,
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
        status === "ACKNOWLEDGED" ? "Çağrıyı üstlendin." : "Çağrı kapatıldı.",
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

  if (loading && !data) {
    return (
      <div role="status" aria-live="polite" className="grid gap-4">
        <span className="sr-only">Garson paneli yükleniyor…</span>
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-11 w-full rounded-lg" />
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] xl:items-start">
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Açık sipariş"
            value={openRows.reduce((sum, row) => sum + row.orders.length, 0)}
            hint={`${openRows.length} masada`}
            tone={openRows.length > 0 ? "primary" : "neutral"}
            icon={<ClipboardList size={16} />}
          />
          <StatCard
            label="Bekleyen çağrı"
            value={callRows.reduce((sum, row) => sum + row.calls.length, 0)}
            hint={callRows.length > 0 ? "Yanıt bekliyor" : "Tümü karşılandı"}
            tone={callRows.length > 0 ? "warning" : "neutral"}
            icon={<Bell size={16} />}
          />
          <StatCard
            label="Boşta masa"
            value={idleRows.length}
            hint="Açık sipariş yok"
            icon={<Table2 size={16} />}
          />
        </div>

        <Tabs
          ariaLabel="Masa filtresi"
          size="lg"
          value={filter}
          onChange={setFilter}
          items={[
            { value: "ACIK", label: "Açık sipariş", badge: openRows.length },
            { value: "CAGRI", label: "Çağrı var", badge: callRows.length },
            { value: "TUMU", label: "Tüm masalar", badge: rows.length },
          ]}
        />

        {visible.length === 0 ? (
          <EmptyState
            icon={<ConciergeBell size={20} />}
            title={
              filter === "CAGRI" ? "Bekleyen çağrı yok" : "Açık sipariş yok"
            }
            description="Yeni bir sipariş ya da çağrı geldiğinde bu liste kendiliğinden güncellenir."
          />
        ) : (
          <ul className="grid gap-2">
            {visible.map((row) => {
              const active = selected?.key === row.key;
              const total = row.orders.reduce(
                (sum, order) => sum + order.estimatedTotal,
                0,
              );
              const oldest = row.orders.reduce<string | null>(
                (earliest, order) =>
                  !earliest || order.submittedAt < earliest
                    ? order.submittedAt
                    : earliest,
                null,
              );
              return (
                <li key={row.key}>
                  <button
                    type="button"
                    onClick={() => setSelectedTable(row.key)}
                    aria-pressed={active}
                    className={cn(
                      "flex min-h-16 w-full min-w-0 items-center gap-3 rounded-xl border px-3.5 text-left transition sm:px-4",
                      active
                        ? "border-primary bg-primary-soft/60"
                        : "border-border bg-surface hover:border-primary/40",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-2.5 shrink-0 rounded-full",
                        row.calls.length > 0
                          ? "bg-warning"
                          : row.orders.length > 0
                            ? "bg-success"
                            : "bg-border-strong",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="type-chit block truncate text-sm font-semibold text-fg">
                        {row.name}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {row.areaName}
                        {row.capacity ? ` · ${row.capacity} kişilik` : ""}
                      </span>
                    </span>

                    {row.calls.length > 0 ? (
                      <Badge tone="warning" icon={<BellRing size={12} />}>
                        {row.calls.length}
                      </Badge>
                    ) : null}

                    {row.orders.length > 0 ? (
                      <span className="hidden shrink-0 text-right sm:block">
                        <span className="type-chit block text-sm font-semibold text-fg">
                          {formatMoney(total, row.orders[0].currency)}
                        </span>
                        {oldest ? (
                          <span className="type-chit block text-xs text-muted">
                            {elapsedLabel(oldest, tick)}
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="hidden shrink-0 text-xs text-muted sm:block">
                        Sipariş yok
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Seçili masa: tek elle basılabilecek büyük aksiyonlar */}
      <div className="xl:sticky xl:top-24">
        {selected ? (
          <section
            aria-label={`${selected.name} işlemleri`}
            className="rounded-2xl border border-border bg-surface p-4 shadow-xs sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="type-chit truncate text-xl font-semibold text-fg">
                  {selected.name}
                </h2>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                  <span>{selected.areaName}</span>
                  {selected.capacity ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} aria-hidden="true" />
                        {selected.capacity} kişilik
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
              {selected.orders.length > 0 ? (
                <p className="text-right">
                  <span className="block text-xs text-muted">
                    Tahmini toplam
                  </span>
                  <span className="type-chit block text-lg font-semibold text-fg">
                    {formatMoney(
                      selected.orders.reduce(
                        (sum, order) => sum + order.estimatedTotal,
                        0,
                      ),
                      selected.orders[0].currency,
                    )}
                  </span>
                </p>
              ) : null}
            </div>

            {/* Bekleyen çağrılar */}
            {selected.calls.length > 0 ? (
              <div className="mt-4 grid gap-2">
                {selected.calls.map((call) => {
                  const status = describe(WAITER_CALL_STATES, call.status);
                  return (
                    <div
                      key={call.id}
                      className="rounded-xl border border-warning/30 bg-warning-soft p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="min-w-0 text-sm font-semibold text-fg">
                          {call.message || "Misafir çağrısı"}
                        </p>
                        <Badge tone={status.tone} icon={status.icon}>
                          {status.label}
                        </Badge>
                      </div>
                      <p className="type-chit mt-1 text-xs text-muted">
                        {elapsedLabel(call.createdAt, tick)}
                      </p>
                      {canResolveCalls ? (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {call.status === "PENDING" ? (
                            <ActionButton
                              className="bg-accent text-primary-fg hover:brightness-110"
                              icon={BellRing}
                              busy={pendingId === call.id}
                              onClick={() => void updateCall(call, "ACKNOWLEDGED")}
                            >
                              Üstlen
                            </ActionButton>
                          ) : (
                            <span />
                          )}
                          <ActionButton
                            className="bg-success text-primary-fg hover:brightness-110"
                            icon={CheckCheck}
                            busy={pendingId === call.id}
                            onClick={() => void updateCall(call, "RESOLVED")}
                          >
                            Çözüldü
                          </ActionButton>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* Açık siparişler ve izin verilen geçişler */}
            {selected.orders.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-border-strong px-4 py-6 text-center text-sm text-muted">
                Bu masada açık sipariş yok.
              </p>
            ) : (
              <div className="mt-4 grid gap-4">
                {selected.orders.map((order) => {
                  const state = describe(ORDER_STATES, order.state);
                  const transitions = canTransition ? nextStates(order) : [];
                  return (
                    <article
                      key={order.id}
                      className="rounded-xl border border-border p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="type-chit text-sm font-semibold text-fg">
                          #{order.id.slice(0, 8)}
                        </span>
                        <Badge tone={state.tone} icon={state.icon}>
                          {state.label}
                        </Badge>
                      </div>
                      <p className="type-chit mt-1 flex items-center gap-1 text-xs text-muted">
                        <Clock size={12} aria-hidden="true" />
                        {elapsedLabel(order.submittedAt, tick)}
                      </p>

                      <ul className="mt-3 grid gap-1 border-t border-border pt-2.5 text-sm">
                        {order.items.map((item, index) => (
                          <li
                            key={`${order.id}-${index}`}
                            className="flex justify-between gap-3"
                          >
                            <span className="min-w-0">
                              <span className="type-chit mr-1.5 font-semibold text-fg">
                                {item.quantity}×
                              </span>
                              <span className="text-fg-soft">{item.name}</span>
                            </span>
                            <span className="type-chit shrink-0 text-muted">
                              {formatMoney(
                                item.unitPrice * item.quantity,
                                item.currency,
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {order.customerNote ? (
                        <p className="mt-2.5 rounded-lg border border-warning/25 bg-warning-soft px-3 py-2 text-xs leading-5 text-fg-soft">
                          <span className="font-semibold text-warning">
                            Misafir notu:
                          </span>{" "}
                          {order.customerNote}
                        </p>
                      ) : null}

                      {transitions.length > 0 ? (
                        <div
                          className={cn(
                            "mt-3 grid gap-2",
                            transitions.length > 1 ? "grid-cols-2" : "grid-cols-1",
                          )}
                        >
                          {transitions.map((next) => {
                            const style = ACTION_STYLE[next];
                            return (
                              <ActionButton
                                key={next}
                                className={style.className}
                                icon={style.icon}
                                busy={pendingId === order.id}
                                onClick={() => void transition(order, next)}
                              >
                                {style.label ??
                                  describe(ORDER_STATES, next).label}
                              </ActionButton>
                            );
                          })}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}

            <p className="mt-4 text-[0.7rem] leading-4 text-muted">
              Tutarlar tahminidir; bu panelde ödeme, POS veya mali belge işlemi
              yapılmaz.
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

/** Tek elle basılabilecek, 56px yüksekliğinde dolu renkli aksiyon. */
function ActionButton({
  className,
  icon: Icon,
  busy,
  onClick,
  children,
}: {
  className: string;
  icon: typeof CheckCheck;
  busy: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        "flex min-h-14 min-w-0 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
    >
      <Icon size={18} aria-hidden="true" className="shrink-0" />
      <span className="min-w-0 truncate">{children}</span>
    </button>
  );
}
