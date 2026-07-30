"use client";

import { useCallback, useState, type FormEvent } from "react";
import {
  Download,
  LayoutGrid,
  Plus,
  QrCode,
  RefreshCw,
  Users,
} from "lucide-react";
import { api, json, type Area, type TableQr, type TableRow } from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { FormField, Input, Select } from "@/components/ui/field";
import { ConfirmDialog, Dialog, useConfirm } from "@/components/ui/overlay";
import { Tabs } from "@/components/ui/tabs";
import { Alert, EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import {
  AnimatePresence,
  SkeletonTransition,
  StaggerItem,
  StaggerList,
  useRetained,
} from "@/components/motion";
import { AdminScreen, useAdmin } from "./admin-shell";
import { useAction, useResource } from "./use-resource";

export function TablesManager() {
  return (
    <AdminScreen
      title="Alanlar ve masalar"
      description="Her masa kendi QR kodunu taşır. QR yenilendiğinde eski kod anında geçersiz olur."
      breadcrumb={[{ label: "Masalar" }]}
    >
      <TablesBody />
    </AdminScreen>
  );
}

function TablesBody() {
  const { user } = useAdmin();
  const canManage = user.permissions.includes("table/manage");

  const loader = useCallback(() => api<Area[]>("/api/admin/tables"), []);
  const { data, error, reload } = useResource(loader);
  const { busy, run } = useAction(reload);

  const [activeArea, setActiveArea] = useState("");
  const [areaOpen, setAreaOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [qr, setQr] = useState<{ code: TableQr; tableName: string } | null>(
    null,
  );
  const rotate = useConfirm<TableRow>();
  // QR paneli kapanırken içerik boşalmasın diye son değer tutulur.
  const shownQr = useRetained(qr);

  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const areas = data ?? [];
  const current = areas.find((area) => area.id === activeArea) ?? areas[0];
  const totalTables = areas.reduce((sum, area) => sum + area.tables.length, 0);

  const skeleton = (
    <div role="status" aria-live="polite" className="grid gap-4">
      <span className="sr-only">Masalar yükleniyor…</span>
      <Skeleton className="h-11 w-64 rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );

  return (
    <SkeletonTransition loading={!data} skeleton={skeleton}>
    <div className="grid gap-6">
      <Card>
        <CardHeader
          title={`${areas.length} alan · ${totalTables} masa`}
          description="Alanlar salon, teras gibi bölümlerdir. Masalar bir alana bağlıdır."
          actions={
            canManage ? (
              <>
                <Button
                  variant="outline"
                  leadingIcon={<Plus size={16} aria-hidden="true" />}
                  onClick={() => setAreaOpen(true)}
                >
                  Alan ekle
                </Button>
                <Button
                  leadingIcon={<Plus size={16} aria-hidden="true" />}
                  disabled={areas.length === 0}
                  onClick={() => setTableOpen(true)}
                >
                  Masa ve QR oluştur
                </Button>
              </>
            ) : undefined
          }
        />
      </Card>

      {areas.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid size={20} />}
          title="Henüz alan yok"
          description="Önce bir alan (salon, teras, bahçe) oluştur, sonra bu alana masa ekle."
          action={
            canManage ? (
              <Button onClick={() => setAreaOpen(true)}>İlk alanı ekle</Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {areas.length > 1 ? (
            <Tabs
              ariaLabel="Alanlar"
              value={current?.id ?? ""}
              onChange={setActiveArea}
              items={areas.map((area) => ({
                value: area.id,
                label: area.name,
                badge: area.tables.length,
              }))}
            />
          ) : null}

          {current && current.tables.length === 0 ? (
            <EmptyState
              icon={<QrCode size={20} />}
              title={`${current.name} alanında masa yok`}
              description="Masa oluşturduğunda QR kodu anında üretilir ve bir kez gösterilir."
              action={
                canManage ? (
                  <Button onClick={() => setTableOpen(true)}>Masa ekle</Button>
                ) : undefined
              }
            />
          ) : (
            /*
             * Alan sekmesi değişince kartlar yerinde takas edilmez: eskiler
             * çıkış animasyonuyla ayrılır, yeniler sırayla girer. Grid yeniden
             * dizilirken `layout` sıçramayı engeller.
             */
            <StaggerList
              as="ul"
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence initial={false} mode="popLayout">
              {current?.tables.map((table, index) => (
                <StaggerItem
                  as="li"
                  key={table.id}
                  index={index}
                  className="flex flex-col rounded-2xl border border-border bg-surface p-4 shadow-xs transition-colors duration-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 truncate text-base font-semibold text-fg">
                      {table.name}
                    </h3>
                    <Badge
                      tone={table.active ? "success" : "neutral"}
                      icon={table.active ? "✓" : "✕"}
                    >
                      {table.active ? "Aktif" : "Kapalı"}
                    </Badge>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                    <Users size={14} aria-hidden="true" />
                    {table.capacity ? `${table.capacity} kişilik` : "Kapasite belirtilmemiş"}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                    <QrCode size={14} aria-hidden="true" />
                    QR tanımlı · yalnız oluşturulduğunda gösterilir
                  </p>
                  {canManage ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      disabled={busy}
                      leadingIcon={<RefreshCw size={15} aria-hidden="true" />}
                      onClick={() => rotate.ask(table)}
                    >
                      QR yenile
                    </Button>
                  ) : null}
                </StaggerItem>
              ))}
              </AnimatePresence>
            </StaggerList>
          )}
        </>
      )}

      {/* Alan oluşturma — `open` prop'u ile: kapanış animasyonu tamamlanır. */}
        <Dialog
          open={areaOpen}
          onClose={() => setAreaOpen(false)}
          size="sm"
          title="Yeni alan"
          footer={
            <>
              <Button variant="outline" onClick={() => setAreaOpen(false)} disabled={busy}>
                Vazgeç
              </Button>
              <Button type="submit" form="area-form" loading={busy}>
                Alanı ekle
              </Button>
            </>
          }
        >
          <form
            id="area-form"
            className="grid gap-4"
            onSubmit={async (event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const ok = await run(
                () =>
                  api(
                    "/api/admin/tables/areas",
                    json("POST", { name: data.get("name"), sortOrder: 0 }),
                  ),
                "Alan eklendi.",
              );
              if (ok) setAreaOpen(false);
            }}
          >
            <FormField label="Alan adı" required>
              <Input
                name="name"
                required
                maxLength={140}
                placeholder="Salon, Teras, Bahçe…"
                autoFocus
              />
            </FormField>
          </form>
        </Dialog>

      {/* Masa oluşturma */}
        <Dialog
          open={tableOpen}
          onClose={() => setTableOpen(false)}
          size="sm"
          title="Masa ve QR oluştur"
          description="QR kodu oluşturulduktan sonra yalnızca bir kez gösterilir."
          footer={
            <>
              <Button variant="outline" onClick={() => setTableOpen(false)} disabled={busy}>
                Vazgeç
              </Button>
              <Button type="submit" form="table-form" loading={busy}>
                Oluştur
              </Button>
            </>
          }
        >
          <form
            id="table-form"
            className="grid gap-4"
            onSubmit={async (event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const name = String(data.get("name") ?? "");
              const ok = await run(async () => {
                const created = await api<TableQr>(
                  "/api/admin/tables",
                  json("POST", {
                    areaId: data.get("areaId"),
                    name,
                    capacity: Number(data.get("capacity")),
                  }),
                );
                setQr({ code: created, tableName: name });
              }, "Masa oluşturuldu.");
              if (ok) setTableOpen(false);
            }}
          >
            <FormField label="Alan" required>
              <Select name="areaId" required defaultValue={current?.id}>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Masa adı" required>
              <Input name="name" required maxLength={140} placeholder="Masa 1" />
            </FormField>
            <FormField label="Kapasite" required>
              <Input
                name="capacity"
                type="number"
                min={1}
                max={100}
                defaultValue={4}
                required
              />
            </FormField>
          </form>
        </Dialog>

      {/* QR gösterimi */}
      {shownQr ? (
        <Dialog
          open={qr !== null}
          onClose={() => setQr(null)}
          size="sm"
          title={`${shownQr.tableName} QR kodu`}
          footer={
            <>
              <Button variant="outline" onClick={() => setQr(null)}>
                Kapat
              </Button>
              <a
                download={`masa-qr-${shownQr.code.tableId}.png`}
                href={`data:image/png;base64,${shownQr.code.qrPngBase64}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg transition duration-150 hover:bg-primary-hover active:scale-[0.97]"
              >
                <Download size={16} aria-hidden="true" />
                PNG indir
              </a>
            </>
          }
        >
          <Alert tone="warning" title="Bu kod yalnızca şimdi gösterilir">
            Sayfayı kapattığında QR görselini tekrar göremezsin. İndir ve
            güvenli bir yere kaydet.
          </Alert>
          <div className="mx-auto mt-5 w-full max-w-72 rounded-xl border border-border bg-surface p-4">
            {/* Sunucudan gelen base64 PNG doğrudan gösterilir. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={`${shownQr.tableName} için masa QR kodu`}
              src={`data:image/png;base64,${shownQr.code.qrPngBase64}`}
              className="block w-full"
            />
            <p className="mt-3 text-center text-sm font-semibold text-fg">
              {shownQr.tableName}
            </p>
          </div>
        </Dialog>
      ) : null}

      <ConfirmDialog
        open={rotate.open}
        title="QR kodu yenilensin mi?"
        description={`${rotate.pending?.name} için yeni bir QR üretilir ve mevcut kod anında geçersiz olur. Masadaki basılı kodu değiştirmezsen müşteriler menüye ulaşamaz.`}
        confirmLabel="Yenile ve yeni QR'ı göster"
        loading={busy}
        onCancel={rotate.clear}
        onConfirm={async () => {
          const table = rotate.pending;
          if (!table) return;
          await run(async () => {
            const created = await api<TableQr>(
              `/api/admin/tables/${table.id}/rotate`,
              json("POST"),
            );
            setQr({ code: created, tableName: table.name });
          }, "QR kodu yenilendi.");
          rotate.clear();
        }}
      />
    </div>
    </SkeletonTransition>
  );
}
