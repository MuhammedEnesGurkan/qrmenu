"use client";

import Link from "next/link";
import { useCallback } from "react";
import {
  Bell,
  Download,
  ExternalLink,
  FolderTree,
  PackageX,
  Puzzle,
  Receipt,
  ShoppingBasket,
  UsersRound,
  UtensilsCrossed,
} from "lucide-react";
import {
  api,
  json,
  type AddonPlan,
  type Catalog,
  type Order,
  type Staff,
  type WaiterCall,
} from "@/lib/admin-api";
import { ADDON_STATES, ORDER_STATES, describe } from "@/lib/labels";
import { elapsedLabel, formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { ConfirmDialog, useConfirm } from "@/components/ui/overlay";
import { Alert, EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { AdminShell, useAdmin } from "./admin-shell";
import { useAction, useResource } from "./use-resource";

type OverviewData = {
  catalog: Catalog;
  addons: AddonPlan[];
  staff: Staff[];
  orders: Order[];
  calls: WaiterCall[];
};

export function AdminOverview() {
  return (
    <AdminShell
      title="Genel bakış"
      description="Menünün yayın durumu, günlük operasyon özeti ve hızlı işlemler."
    >
      <OverviewBody />
    </AdminShell>
  );
}

function OverviewBody() {
  const { user } = useAdmin();
  const canManageStaff = user.permissions.includes("membership/manage");
  const canWrite = user.permissions.includes("catalog/write");

  const loader = useCallback(async (): Promise<OverviewData> => {
    const [catalog, addons, staff, orders, calls] = await Promise.all([
      api<Catalog>("/api/admin/catalog"),
      api<AddonPlan[]>("/api/admin/addons").catch(() => []),
      canManageStaff
        ? api<Staff[]>("/api/admin/staff").catch(() => [])
        : Promise.resolve<Staff[]>([]),
      api<Order[]>("/api/admin/orders").catch(() => []),
      api<WaiterCall[]>("/api/admin/orders/waiter-calls").catch(() => []),
    ]);
    return { catalog, addons, staff, orders, calls };
  }, [canManageStaff]);

  const { data, error, loading, reload } = useResource(loader);
  const { busy, run } = useAction(reload);
  const publishConfirm = useConfirm<true>();

  if (loading && !data) return <OverviewSkeleton />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const { catalog, addons, staff, orders, calls } = data;
  const products = catalog.categories.flatMap((category) => category.products);
  const soldOut = products.filter((product) => !product.available).length;
  const activeAddons = addons.filter((plan) =>
    ["ACTIVE", "TRIAL"].includes(plan.status),
  );
  const openOrders = orders.filter(
    (order) => !["DELIVERED", "PICKED_UP", "REJECTED"].includes(order.state),
  );
  const openCalls = calls.filter((call) => call.status !== "RESOLVED");
  const menuUrl = `/m/${catalog.menu.slug}`;

  const publish = () =>
    run(
      () =>
        api(
          `/api/admin/catalog/${catalog.menu.published ? "unpublish" : "publish"}`,
          json("POST"),
        ),
      catalog.menu.published
        ? "Menü yayından kaldırıldı."
        : "Menü yayınlandı.",
    );

  return (
    <div className="grid gap-6">
      {openCalls.length > 0 ? (
        <Alert tone="warning" title={`${openCalls.length} açık garson çağrısı`}>
          Masalardan gelen çağrılar bekliyor.{" "}
          <Link
            href="/admin/siparisler"
            className="font-semibold underline underline-offset-2"
          >
            Sipariş ekranına git
          </Link>
        </Alert>
      ) : null}

      {/* Yayın durumu */}
      <Card>
        <CardHeader
          title="Menü yayın durumu"
          description={
            catalog.menu.published
              ? "Menün müşteri tarafında açık. Güncellemeler anında yansır."
              : "Menü henüz yayında değil. Yayınlamadan QR üzerinden görünmez."
          }
          actions={
            <Badge
              tone={catalog.menu.published ? "success" : "warning"}
              icon={catalog.menu.published ? "✓" : "!"}
            >
              {catalog.menu.published ? "Yayında" : "Yayında değil"}
            </Badge>
          }
        />

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
              Kalıcı menü adresi
            </p>
            <p className="mt-1 truncate rounded-lg border border-border bg-sunken px-3 py-2.5 font-mono text-sm text-fg-soft">
              {menuUrl}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              leadingIcon={<ExternalLink size={16} aria-hidden="true" />}
              onClick={() => window.open(menuUrl, "_blank", "noopener")}
            >
              Public menüyü aç
            </Button>
            <Button
              variant="outline"
              leadingIcon={<Download size={16} aria-hidden="true" />}
              onClick={() => {
                window.location.href = "/backend/api/admin/catalog/qr.png";
              }}
            >
              QR indir
            </Button>
            {canWrite ? (
              <Button
                variant={catalog.menu.published ? "outline" : "primary"}
                loading={busy}
                onClick={() =>
                  catalog.menu.published ? publishConfirm.ask(true) : void publish()
                }
              >
                {catalog.menu.published ? "Yayından kaldır" : "Menüyü yayınla"}
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Sayısal özet */}
      <section aria-label="Özet göstergeler" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Kategori"
          value={catalog.categories.length}
          hint={`${catalog.categories.filter((c) => c.active).length} aktif`}
          icon={<FolderTree size={16} />}
          href="/admin/menu"
        />
        <StatCard
          label="Ürün"
          value={products.length}
          hint={`${products.length - soldOut} mevcut`}
          icon={<UtensilsCrossed size={16} />}
          href="/admin/menu"
        />
        <StatCard
          label="Tükenen ürün"
          value={soldOut}
          hint={soldOut > 0 ? "Menüde tükendi görünüyor" : "Tümü mevcut"}
          tone={soldOut > 0 ? "warning" : "neutral"}
          icon={<PackageX size={16} />}
          href="/admin/menu"
        />
        <StatCard
          label="Açık sipariş"
          value={openOrders.length}
          hint={`${openCalls.length} garson çağrısı`}
          tone={openOrders.length > 0 ? "primary" : "neutral"}
          icon={<Receipt size={16} />}
          href="/admin/siparisler"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Son hareketler */}
        <Card>
          <CardHeader
            title="Son siparişler"
            description="Sipariş ekranındaki canlı akışın son beş kaydı."
            actions={
              <Button variant="ghost" size="sm" onClick={() => void reload()}>
                Yenile
              </Button>
            }
          />
          <div className="mt-4">
            {orders.length === 0 ? (
              <EmptyState
                icon={<ShoppingBasket size={20} />}
                title="Henüz sipariş yok"
                description="Masa siparişi eklentisi etkinleştirildiğinde ve masalara QR yerleştirildiğinde siparişler burada görünür."
                action={
                  <Button variant="outline" onClick={() => window.location.assign("/admin/masalar")}>
                    Masaları yönet
                  </Button>
                }
              />
            ) : (
              <ul className="grid gap-2">
                {orders.slice(0, 5).map((order) => {
                  const state = describe(ORDER_STATES, order.state);
                  return (
                    <li
                      key={order.id}
                      className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-border px-3 py-2.5"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                        {order.pickupNumber
                          ? `Teslim no ${order.pickupNumber}`
                          : (order.tableName ?? "Self servis")}
                      </span>
                      <span className="shrink-0 text-sm tabular-nums text-muted">
                        {formatMoney(order.estimatedTotal, order.currency)}
                      </span>
                      <Badge tone={state.tone} icon={state.icon}>
                        {state.label}
                      </Badge>
                      {order.submittedAt ? (
                        <span className="shrink-0 text-xs tabular-nums text-muted">
                          {elapsedLabel(order.submittedAt)}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        <div className="grid content-start gap-6">
          {/* Hızlı işlemler */}
          <Card>
            <CardHeader title="Hızlı işlemler" />
            <div className="mt-4 grid gap-2">
              {[
                { href: "/admin/menu", label: "Menü ve ürünleri düzenle", icon: UtensilsCrossed },
                { href: "/admin/masalar", label: "Masa ve QR yönetimi", icon: Receipt },
                { href: "/admin/siparisler", label: "Sipariş akışını izle", icon: Bell },
                ...(canManageStaff
                  ? [{ href: "/admin/personel", label: "Personel ve roller", icon: UsersRound }]
                  : []),
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 text-sm font-medium text-fg-soft transition hover:border-primary/40 hover:text-primary"
                >
                  <item.icon size={16} aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </div>
          </Card>

          {/* Eklentiler ve personel */}
          <Card>
            <CardHeader
              title="Aktif eklentiler"
              description={`${activeAddons.length} / ${addons.length} plan etkin`}
              actions={
                user.permissions.includes("subscription/manage") ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.assign("/admin/eklentiler")}
                  >
                    Yönet
                  </Button>
                ) : undefined
              }
            />
            <div className="mt-4">
              {activeAddons.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-muted">
                  <Puzzle size={16} aria-hidden="true" />
                  Henüz eklenti etkin değil. QR menü ücretsiz çalışmaya devam
                  eder.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {activeAddons.map((plan) => {
                    const status = describe(ADDON_STATES, plan.status);
                    return (
                      <li key={plan.code}>
                        <Badge tone={status.tone} icon={status.icon}>
                          {plan.name}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {canManageStaff ? (
              <p className="mt-5 border-t border-border pt-4 text-sm text-muted">
                <UsersRound
                  size={16}
                  aria-hidden="true"
                  className="mr-2 inline align-text-bottom"
                />
                {staff.filter((person) => person.active).length} aktif personel
                · {staff.length} kayıt
              </p>
            ) : null}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={publishConfirm.open}
        title="Menü yayından kaldırılsın mı?"
        description="Yayından kaldırıldığında QR kodu okutan müşteriler menüyü göremez. İçerik silinmez, istediğin zaman tekrar yayınlayabilirsin."
        confirmLabel="Yayından kaldır"
        loading={busy}
        onCancel={publishConfirm.clear}
        onConfirm={async () => {
          await publish();
          publishConfirm.clear();
        }}
      />
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div role="status" aria-live="polite" className="grid gap-6">
      <span className="sr-only">Genel bakış yükleniyor…</span>
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  );
}
