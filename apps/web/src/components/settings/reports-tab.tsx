"use client";

import { useState, type FormEvent } from "react";
import { BarChart3 } from "lucide-react";
import { api, type OperationReport } from "@/lib/admin-api";
import { ORDER_STATES, describe } from "@/lib/labels";
import { formatMoney, isoDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/field";
import { Alert, EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";

const today = () => isoDate(new Date());
const monthAgo = () =>
  isoDate(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000));

export function ReportsTab() {
  const toast = useToast();
  const [report, setReport] = useState<OperationReport | null>(null);
  const [busy, setBusy] = useState(false);

  async function load(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      setReport(
        await api<OperationReport>(
          `/api/admin/features/reports?from=${data.get("from")}&to=${data.get("to")}`,
        ),
      );
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "Rapor alınamadı.",
      );
    } finally {
      setBusy(false);
    }
  }

  const totalOrders =
    report?.states.reduce((sum, item) => sum + item.orderCount, 0) ?? 0;
  const totalValue =
    report?.states.reduce((sum, item) => sum + item.estimatedOrderValue, 0) ?? 0;
  const maxCount = Math.max(
    1,
    ...(report?.states.map((item) => item.orderCount) ?? [1]),
  );
  const maxQuantity = Math.max(
    1,
    ...(report?.topProducts.map((item) => item.quantity) ?? [1]),
  );

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader
          title="Operasyon raporu"
          description="En fazla 90 günlük aralık seçilebilir."
        />
        <form onSubmit={load} className="mt-5 flex flex-wrap items-end gap-3">
          <FormField label="Başlangıç" required className="min-w-40">
            <Input name="from" type="date" required defaultValue={monthAgo()} />
          </FormField>
          <FormField label="Bitiş" required className="min-w-40">
            <Input name="to" type="date" required defaultValue={today()} />
          </FormField>
          <Button type="submit" loading={busy} className="min-h-11">
            Raporu getir
          </Button>
        </form>
      </Card>

      {report ? (
        <>
          <Alert tone="warning" title="Bu rapor mali belge değildir">
            {report.disclaimer}
          </Alert>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Toplam sipariş" value={totalOrders} />
            <StatCard
              label="Tahmini sipariş değeri"
              value={formatMoney(totalValue, "TRY")}
              hint="Tahsilat değil"
            />
            <StatCard
              label="Farklı ürün"
              value={report.topProducts.length}
              hint="Hazırlanan kalem çeşidi"
            />
          </div>

          <Card>
            <CardHeader title="Durum dağılımı" />
            {report.states.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                Seçilen aralıkta sipariş bulunmuyor.
              </p>
            ) : (
              <ul className="mt-4 grid gap-3">
                {report.states.map((item) => {
                  const state = describe(ORDER_STATES, item.state);
                  return (
                    <li key={item.state} className="grid gap-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge tone={state.tone} icon={state.icon}>
                          {state.label}
                        </Badge>
                        <span className="text-sm tabular-nums text-muted">
                          {item.orderCount} sipariş ·{" "}
                          {formatMoney(item.estimatedOrderValue, "TRY")}
                        </span>
                      </div>
                      <div
                        className="h-2 overflow-hidden rounded-full bg-sunken"
                        role="img"
                        aria-label={`${state.label}: ${item.orderCount} sipariş`}
                      >
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${(item.orderCount / maxCount) * 100}%`,
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="En çok hazırlanan ürünler" />
            {report.topProducts.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                Seçilen aralıkta hazırlanan ürün yok.
              </p>
            ) : (
              <ol className="mt-4 grid gap-3">
                {report.topProducts.map((item, index) => (
                  <li key={item.productName} className="grid gap-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-sm text-fg">
                        <span className="mr-2 tabular-nums text-muted">
                          {index + 1}.
                        </span>
                        {item.productName}
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-fg">
                        {item.quantity}
                      </span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-sunken"
                      role="img"
                      aria-label={`${item.productName}: ${item.quantity} adet`}
                    >
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{
                          width: `${(item.quantity / maxQuantity) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </>
      ) : (
        <EmptyState
          icon={<BarChart3 size={20} />}
          title="Henüz rapor almadın"
          description="Bir tarih aralığı seçip raporu getir. Rapor sipariş adetlerini ve tahmini değerleri gösterir."
        />
      )}
    </div>
  );
}
