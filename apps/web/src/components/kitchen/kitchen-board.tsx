"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ChefHat, ExternalLink, Monitor, Plus, Timer } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  api,
  json,
  type Catalog,
  type KitchenItem,
  type KitchenOverview,
} from "@/lib/admin-api";
import { KITCHEN_STATES, SERVICE_MODES, describe } from "@/lib/labels";
import { elapsedLabel } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox, FormField, Input } from "@/components/ui/field";
import { Dialog } from "@/components/ui/overlay";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { AdminShell, useAdmin } from "../admin/admin-shell";
import { useResource } from "../admin/use-resource";

export function KitchenScreen() {
  return (
    <AdminShell
      title="Mutfak istasyonları"
      description="Kabul edilen siparişler kategoriye göre istasyon kuyruğuna düşer."
      breadcrumb={[{ label: "Mutfak" }]}
      contained={false}
    >
      <div className="mx-auto w-full max-w-[1600px]">
        <KitchenBody />
      </div>
    </AdminShell>
  );
}

function KitchenBody() {
  const { user } = useAdmin();
  const toast = useToast();
  const canManageStations = user.permissions.includes("table/manage");
  const canPrepare = user.permissions.includes("order/prepare-ready");

  const [stationId, setStationId] = useState("");
  const [items, setItems] = useState<KitchenItem[]>([]);
  const [queueError, setQueueError] = useState("");
  const [pendingItem, setPendingItem] = useState("");
  const [stationOpen, setStationOpen] = useState(false);
  const [stationBusy, setStationBusy] = useState(false);
  const [tick, setTick] = useState(() => Date.now());

  const loader = useCallback(
    async () =>
      Promise.all([
        api<KitchenOverview>("/api/admin/kitchen"),
        api<Catalog>("/api/admin/catalog"),
      ]),
    [],
  );
  const { data, error, loading, reload } = useResource(loader);
  const overview = data?.[0];
  const catalog = data?.[1];

  const activeStation =
    overview?.stations.find((station) => station.id === stationId) ??
    overview?.stations[0];

  const loadQueue = useCallback(async (id: string) => {
    if (!id) {
      setItems([]);
      return;
    }
    try {
      setItems(await api<KitchenItem[]>(`/api/admin/kitchen/stations/${id}/queue`));
      setQueueError("");
    } catch (caught) {
      setQueueError(
        caught instanceof Error ? caught.message : "Kuyruk yüklenemedi.",
      );
    }
  }, []);

  // Kuyruk 5 saniyede bir tazelenir; süre etiketleri 30 saniyede bir.
  useEffect(() => {
    const id = activeStation?.id ?? "";
    void loadQueue(id);
    const timer = setInterval(() => void loadQueue(id), 5000);
    return () => clearInterval(timer);
  }, [activeStation?.id, loadQueue]);

  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  async function advance(item: KitchenItem) {
    const next = item.kitchenState === "QUEUED" ? "PREPARING" : "DONE";
    setPendingItem(item.itemId);
    try {
      await api(`/api/admin/kitchen/items/${item.itemId}`, json("PATCH", { state: next }));
      toast.success(
        next === "PREPARING" ? "Hazırlamaya başlandı." : "Kalem tamamlandı.",
      );
      await loadQueue(activeStation?.id ?? "");
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "Durum değiştirilemedi.",
      );
    } finally {
      setPendingItem("");
    }
  }

  if (loading && !data) {
    return (
      <div role="status" aria-live="polite" className="grid gap-4">
        <span className="sr-only">Mutfak ekranı yükleniyor…</span>
        <Skeleton className="h-11 w-72 rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {overview && overview.stations.length > 0 ? (
          <Tabs
            ariaLabel="Mutfak istasyonları"
            size="lg"
            value={activeStation?.id ?? ""}
            onChange={setStationId}
            items={overview.stations.map((station) => ({
              value: station.id,
              label: station.name,
            }))}
          />
        ) : (
          <span />
        )}
        <div className="flex flex-wrap gap-2">
          {overview?.publicPickupUrl ? (
            <Button
              variant="outline"
              leadingIcon={<Monitor size={16} aria-hidden="true" />}
              trailingIcon={<ExternalLink size={14} aria-hidden="true" />}
              onClick={() =>
                window.open(overview.publicPickupUrl, "_blank", "noopener")
              }
            >
              Hazır ekranı
            </Button>
          ) : null}
          {canManageStations ? (
            <Button
              leadingIcon={<Plus size={16} aria-hidden="true" />}
              onClick={() => setStationOpen(true)}
            >
              İstasyon ekle
            </Button>
          ) : null}
        </div>
      </div>

      {queueError ? (
        <ErrorState
          message={queueError}
          onRetry={() => void loadQueue(activeStation?.id ?? "")}
        />
      ) : null}

      {!overview || overview.stations.length === 0 ? (
        <EmptyState
          icon={<ChefHat size={20} />}
          title="Henüz istasyon yok"
          description="Sıcak mutfak, soğuk mutfak veya bar gibi istasyonlar oluştur ve her birine kategori ata."
          action={
            canManageStations ? (
              <Button onClick={() => setStationOpen(true)}>
                İlk istasyonu ekle
              </Button>
            ) : undefined
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Timer size={20} />}
          title="Kuyruk boş"
          description={`${activeStation?.name} istasyonunda bekleyen kalem yok. Yeni sipariş kabul edildiğinde otomatik görünür.`}
        />
      ) : (
        <ul
          aria-live="polite"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
        >
          {items.map((item) => (
            <KitchenCard
              key={item.itemId}
              item={item}
              now={tick}
              busy={pendingItem === item.itemId}
              canPrepare={canPrepare}
              onAdvance={advance}
            />
          ))}
        </ul>
      )}

      {stationOpen && catalog ? (
        <Dialog
          open
          onClose={() => setStationOpen(false)}
          title="Yeni mutfak istasyonu"
          description="Seçilen kategorilerdeki ürünler bu istasyonun kuyruğuna düşer."
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setStationOpen(false)}
                disabled={stationBusy}
              >
                Vazgeç
              </Button>
              <Button type="submit" form="station-form" loading={stationBusy}>
                İstasyonu ekle
              </Button>
            </>
          }
        >
          <form
            id="station-form"
            className="grid gap-4"
            onSubmit={async (event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const categoryIds = data.getAll("categoryIds");
              if (categoryIds.length === 0) {
                toast.error("En az bir kategori seçmelisin.");
                return;
              }
              setStationBusy(true);
              try {
                await api(
                  "/api/admin/kitchen/stations",
                  json("POST", {
                    name: data.get("name"),
                    sortOrder: 0,
                    categoryIds,
                  }),
                );
                toast.success("İstasyon eklendi.");
                setStationOpen(false);
                await reload();
              } catch (caught) {
                toast.error(
                  caught instanceof Error
                    ? caught.message
                    : "İstasyon eklenemedi.",
                );
              } finally {
                setStationBusy(false);
              }
            }}
          >
            <FormField label="İstasyon adı" required>
              <Input
                name="name"
                required
                maxLength={120}
                placeholder="Örn. Sıcak mutfak"
                autoFocus
              />
            </FormField>
            <fieldset>
              <legend className="text-sm font-medium text-fg">
                Kategoriler
                <span className="ml-1 text-destructive" aria-hidden="true">
                  *
                </span>
              </legend>
              <p className="mt-1 text-xs text-muted">
                Her kategori yalnızca bir istasyona atanmalıdır.
              </p>
              <div className="mt-2 grid gap-1 rounded-xl border border-border p-3">
                {catalog.categories.length === 0 ? (
                  <p className="text-sm text-muted">Önce kategori oluştur.</p>
                ) : (
                  catalog.categories.map((category) => (
                    <Checkbox
                      key={category.id}
                      name="categoryIds"
                      value={category.id}
                      label={category.name}
                      description={`${category.products.length} ürün`}
                    />
                  ))
                )}
              </div>
            </fieldset>
          </form>
        </Dialog>
      ) : null}
    </div>
  );
}

function KitchenCard({
  item,
  now,
  busy,
  canPrepare,
  onAdvance,
}: {
  item: KitchenItem;
  now: number;
  busy: boolean;
  canPrepare: boolean;
  onAdvance: (item: KitchenItem) => void;
}) {
  const state = describe(KITCHEN_STATES, item.kitchenState);
  const waiting = elapsedLabel(item.submittedAt, now);
  const minutes = Math.floor(
    (now - new Date(item.submittedAt).getTime()) / 60000,
  );
  const late = minutes >= 15;

  return (
    <li
      className={cn(
        "flex flex-col rounded-2xl border-2 bg-surface p-5 shadow-sm",
        item.kitchenState === "PREPARING"
          ? "border-warning/50"
          : item.kitchenState === "DONE"
            ? "border-success/40"
            : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="type-chit min-w-0 truncate text-lg font-semibold text-fg">
          {item.pickupNumber
            ? `Teslim ${item.pickupNumber}`
            : (item.tableName ?? "Masa")}
        </p>
        <Badge tone={state.tone} icon={state.icon}>
          {state.label}
        </Badge>
      </div>

      <p
        className={cn(
          "type-chit mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold",
          late ? "text-destructive" : "text-muted",
        )}
      >
        <Timer size={14} aria-hidden="true" />
        {waiting}
        {late ? <span className="font-normal">· gecikti</span> : null}
      </p>

      <p className="type-display mt-4 text-2xl leading-tight text-fg [overflow-wrap:anywhere]">
        <span className="type-chit">{item.quantity}×</span>{" "}
        {item.productName}
      </p>

      <p className="mt-1 text-xs text-muted">
        {SERVICE_MODES[item.serviceMode] ?? item.serviceMode}
      </p>

      {item.notes ? (
        <p className="mt-3 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-sm font-medium leading-6 text-fg-soft">
          <span className="text-warning" aria-hidden="true">
            ⚠
          </span>{" "}
          {item.notes}
        </p>
      ) : null}

      {canPrepare && item.kitchenState !== "DONE" ? (
        <Button
          size="lg"
          fullWidth
          className="mt-5 min-h-14 text-base"
          variant={item.kitchenState === "QUEUED" ? "inverse" : "primary"}
          loading={busy}
          onClick={() => onAdvance(item)}
        >
          {item.kitchenState === "QUEUED" ? "Hazırlamaya başla" : "Tamamlandı"}
        </Button>
      ) : null}
    </li>
  );
}
