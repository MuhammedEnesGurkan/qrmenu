"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import {
  Download,
  FileSpreadsheet,
  RotateCcw,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  api,
  json,
  type ImportJob,
  type PriceBatch,
} from "@/lib/admin-api";
import { BATCH_STATES, IMPORT_STATES, describe } from "@/lib/labels";
import { formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/overlay";
import { SegmentedControl } from "@/components/ui/tabs";
import { Alert, Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { AdminShell } from "../admin-shell";

const PRICE_MODES = [
  { value: "PERCENT", label: "Yüzde", hint: "%10 zam" },
  { value: "ADD", label: "Tutar ekle", hint: "+15 TL" },
  { value: "SET", label: "Sabitle", hint: "Hepsi 120 TL" },
];

export function CatalogPro() {
  return (
    <AdminShell
      title="Katalog Pro"
      description="Toplu içe aktarma ve fiyat işlemleri. Her işlem önce önizlenir, sonra onaylanır."
      breadcrumb={[{ label: "Katalog Pro" }]}
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <ImportPanel />
        <PricePanel />
      </div>
    </AdminShell>
  );
}

function ImportPanel() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [job, setJob] = useState<ImportJob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      setJob(
        await api<ImportJob>("/api/admin/catalog-pro/imports/preview", {
          method: "POST",
          body,
        }),
      );
      toast.info("Önizleme hazır. Onaylamadan katalog değişmez.");
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "Dosya okunamadı.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void upload(file);
  }

  async function commit() {
    if (!job) return;
    setCommitting(true);
    try {
      setJob(
        await api<ImportJob>(
          `/api/admin/catalog-pro/imports/${job.id}/commit`,
          json("POST"),
        ),
      );
      toast.success("İçe aktarma tamamlandı.");
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "İçe aktarma tamamlanamadı.",
      );
    } finally {
      setCommitting(false);
      setConfirmOpen(false);
    }
  }

  const status = job ? describe(IMPORT_STATES, job.status) : null;

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="CSV / XLSX içe aktar"
        description="Hatalı satırlar katalog işlemine hiç girmez. Aynı dosya tekrar yüklenirse aynı iş döner."
        actions={
          <a
            href="/backend/api/admin/catalog-pro/export.csv"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-fg-soft transition hover:border-primary/40 hover:text-primary"
          >
            <Download size={15} aria-hidden="true" />
            CSV dışa aktar
          </a>
        }
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "mt-5 grid place-items-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition",
          dragging
            ? "border-primary bg-primary-soft"
            : "border-border-strong bg-sunken",
        )}
      >
        {uploading ? (
          <>
            <Skeleton className="h-3 w-40" />
            <p role="status" className="mt-3 text-sm text-muted">
              Dosya okunuyor ve doğrulanıyor…
            </p>
          </>
        ) : (
          <>
            <Upload size={22} aria-hidden="true" className="text-muted" />
            <p className="mt-3 text-sm font-medium text-fg">
              Dosyayı buraya sürükle ya da seç
            </p>
            <p className="mt-1 text-xs text-muted">
              .csv veya .xlsx · en fazla 5 MB · en fazla 5000 satır
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => inputRef.current?.click()}
            >
              Dosya seç
            </Button>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx"
          className="sr-only"
          aria-label="İçe aktarılacak dosya"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </div>

      {job ? (
        <div className="mt-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Geçerli satır" value={job.validRows} />
            <StatCard
              label="Hatalı satır"
              value={job.errorRows}
              tone={job.errorRows > 0 ? "destructive" : "neutral"}
            />
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Durum
              </p>
              <div className="mt-2">
                {status ? (
                  <Badge tone={status.tone} icon={status.icon}>
                    {status.label}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-4 max-h-80 overflow-auto rounded-xl border border-border">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="sticky top-0 bg-sunken text-xs uppercase tracking-[0.05em] text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">Satır</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Kategori</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Ürün</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Fiyat</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Sonuç</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {job.rows.map((row) => {
                  const invalid = Boolean(row.message);
                  return (
                    <tr
                      key={row.rowNumber}
                      className={invalid ? "bg-destructive-soft" : undefined}
                    >
                      <td className="px-3 py-2 tabular-nums text-muted">
                        {row.rowNumber}
                      </td>
                      <td className="px-3 py-2 text-fg-soft">{row.category}</td>
                      <td className="px-3 py-2 text-fg">{row.name}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-fg-soft">
                        {row.price != null
                          ? formatMoney(row.price, row.currency || "TRY")
                          : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs font-medium",
                            invalid ? "text-destructive" : "text-success",
                          )}
                        >
                          <span aria-hidden="true">{invalid ? "✕" : "✓"}</span>
                          {row.message || "Geçerli"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {job.errorRows > 0 ? (
            <Alert tone="destructive" className="mt-4">
              Hatalı satırlar düzeltilmeden içe aktarma onaylanamaz.
            </Alert>
          ) : null}

          <Button
            className="mt-4"
            disabled={job.errorRows > 0 || job.status === "COMMITTED"}
            onClick={() => setConfirmOpen(true)}
          >
            {job.status === "COMMITTED"
              ? "Bu dosya uygulandı"
              : "İçe aktarmayı onayla"}
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        tone="primary"
        title="İçe aktarma onaylansın mı?"
        description={`${job?.validRows ?? 0} satır kataloğa uygulanacak. Mevcut ürünler dosyadaki değerlerle güncellenir.`}
        confirmLabel="Uygula"
        loading={committing}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void commit()}
      />
    </Card>
  );
}

function PricePanel() {
  const toast = useToast();
  const [batch, setBatch] = useState<PriceBatch | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("PERCENT");
  const [confirm, setConfirm] = useState<"commit" | "rollback" | null>(null);

  async function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      setBatch(
        await api<PriceBatch>(
          "/api/admin/catalog-pro/prices/preview",
          json("POST", { mode, value: Number(data.get("value")) }),
        ),
      );
      toast.info("Önizleme hazır. Onaylamadan fiyatlar değişmez.");
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "Önizleme oluşturulamadı.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function apply(action: "commit" | "rollback") {
    if (!batch) return;
    setBusy(true);
    try {
      const result = await api<PriceBatch>(
        `/api/admin/catalog-pro/prices/${batch.id}/${action}`,
        json("POST"),
      );
      setBatch(result);
      toast.success(
        action === "commit"
          ? "Fiyatlar uygulandı."
          : "Geri alma tamamlandı; çakışan ürünler korundu.",
      );
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "İşlem tamamlanamadı.",
      );
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  const status = batch ? describe(BATCH_STATES, batch.status) : null;
  const rollbackable =
    batch && ["COMMITTED", "PARTIAL_ROLLBACK"].includes(batch.status);

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Toplu fiyat işlemi"
        description="Önizleme sonrası bir ürün değişirse işlem güvenli biçimde durur."
      />

      <form onSubmit={preview} className="mt-5 grid gap-4">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-fg">İşlem türü</legend>
          <SegmentedControl
            ariaLabel="Fiyat işlemi türü"
            value={mode}
            onChange={setMode}
            items={PRICE_MODES}
          />
        </fieldset>

        <FormField
          label={
            mode === "PERCENT"
              ? "Yüzde değeri"
              : mode === "ADD"
                ? "Eklenecek tutar"
                : "Yeni fiyat"
          }
          required
          description={
            mode === "PERCENT"
              ? "Negatif değer indirim uygular. Örn. -10"
              : mode === "ADD"
                ? "Negatif değer fiyatı düşürür."
                : "Tüm aktif ürünler bu fiyata ayarlanır."
          }
        >
          <Input name="value" type="number" step="0.01" required />
        </FormField>

        <Button type="submit" variant="outline" loading={busy}>
          Önizle
        </Button>
      </form>

      {batch ? (
        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-fg">
              {batch.items.length} ürün etkileniyor
            </p>
            {status ? (
              <Badge tone={status.tone} icon={status.icon}>
                {status.label}
              </Badge>
            ) : null}
          </div>

          <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-border">
            <table className="w-full min-w-[26rem] text-left text-sm">
              <thead className="sticky top-0 bg-sunken text-xs uppercase tracking-[0.05em] text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">Ürün</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Eski</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Yeni</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Geri alma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {batch.items.map((item) => (
                  <tr key={item.productId}>
                    <td className="max-w-40 truncate px-3 py-2 font-mono text-xs text-muted">
                      {item.productId.slice(0, 8)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted line-through">
                      {formatMoney(item.oldPrice, "TRY")}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-fg">
                      {formatMoney(item.newPrice, "TRY")}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted">
                      {item.rollbackStatus === "ROLLED_BACK"
                        ? "Geri alındı"
                        : item.rollbackStatus === "CONFLICT"
                          ? "Çakışma — korundu"
                          : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {batch.status === "PREVIEW" ? (
              <Button loading={busy} onClick={() => setConfirm("commit")}>
                Fiyatları uygula
              </Button>
            ) : null}
            {rollbackable ? (
              <Button
                variant="outline"
                loading={busy}
                leadingIcon={<RotateCcw size={15} aria-hidden="true" />}
                onClick={() => setConfirm("rollback")}
              >
                Çakışma güvenli geri al
              </Button>
            ) : null}
          </div>

          {batch.status === "PARTIAL_ROLLBACK" ? (
            <Alert tone="warning" className="mt-4">
              Bazı ürünler bu işlemden sonra elle değiştirildiği için geri
              alınmadı; mevcut fiyatları korundu.
            </Alert>
          ) : null}
        </div>
      ) : (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted">
          <FileSpreadsheet size={16} aria-hidden="true" />
          Henüz bir fiyat işlemi önizlemedin.
        </p>
      )}

      <ConfirmDialog
        open={confirm === "commit"}
        tone="primary"
        title="Fiyatlar uygulansın mı?"
        description={`${batch?.items.length ?? 0} ürünün fiyatı güncellenecek. Önizlemeden sonra bir ürün değiştiyse işlem güvenli biçimde durur.`}
        confirmLabel="Uygula"
        loading={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void apply("commit")}
      />

      <ConfirmDialog
        open={confirm === "rollback"}
        title="Fiyat değişikliği geri alınsın mı?"
        description="Yalnızca hâlâ bu işlemin uyguladığı fiyat ve sürümde olan ürünler eski değerine döner. Sonradan elle değiştirdiğin fiyatlar ezilmez."
        confirmLabel="Geri al"
        loading={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void apply("rollback")}
      />
    </Card>
  );
}
