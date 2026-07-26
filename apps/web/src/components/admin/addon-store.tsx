"use client";

import { useCallback } from "react";
import { Puzzle } from "lucide-react";
import { api, json, type AddonPlan } from "@/lib/admin-api";
import { ADDON_STATES, describe } from "@/lib/labels";
import { formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog, useConfirm } from "@/components/ui/overlay";
import { Alert, ErrorState, Skeleton } from "@/components/ui/states";
import { AdminShell } from "./admin-shell";
import { useAction, useResource } from "./use-resource";

const dateFormat = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : dateFormat.format(date);
}

export function AddonStore() {
  return (
    <AdminShell
      title="Eklentiler"
      description="QR menü her zaman ücretsizdir. Operasyon özellikleri ihtiyaç oldukça açılır."
      breadcrumb={[{ label: "Eklentiler" }]}
    >
      <AddonBody />
    </AdminShell>
  );
}

function AddonBody() {
  const loader = useCallback(() => api<AddonPlan[]>("/api/admin/addons"), []);
  const { data, error, loading, reload } = useResource(loader);
  const { busy, run } = useAction(reload);
  const cancelPlan = useConfirm<AddonPlan>();

  if (loading && !data) {
    return (
      <div role="status" aria-live="polite" className="grid gap-4 sm:grid-cols-2">
        <span className="sr-only">Eklentiler yükleniyor…</span>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-44 w-full rounded-2xl" />
        ))}
      </div>
    );
  }
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  const plans = data ?? [];

  return (
    <div className="grid gap-6">
      <Alert tone="info" title="Eklenti süresi dolduğunda ne olur?">
        Geçmiş sipariş ve çağrı verilerini okumaya devam edersin; yalnızca yeni
        ücretli yazma işlemleri durur. Verilerin silinmez.
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const status = describe(ADDON_STATES, plan.status);
          const trialEnd = formatDate(plan.trialEndsAt);
          const periodEnd = formatDate(plan.currentPeriodEndsAt);
          const running = ["TRIAL", "ACTIVE"].includes(plan.status);

          return (
            <Card key={plan.code} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-sunken text-fg-soft"
                >
                  <Puzzle size={18} />
                </span>
                <Badge tone={status.tone} icon={status.icon}>
                  {status.label}
                </Badge>
              </div>

              <h2 className="mt-4 text-base font-semibold text-fg">
                {plan.name}
              </h2>
              <p className="mt-1.5 flex-1 text-sm leading-6 text-muted">
                {plan.description}
              </p>

              <p className="mt-4 text-lg font-semibold tabular-nums text-fg">
                {formatMoney(plan.monthlyPrice, plan.currency)}
                <span className="ml-1 text-sm font-normal text-muted">/ ay</span>
              </p>

              {trialEnd && plan.status === "TRIAL" ? (
                <p className="mt-1 text-xs text-muted">
                  Deneme bitişi: {trialEnd}
                </p>
              ) : null}
              {periodEnd && plan.status === "ACTIVE" ? (
                <p className="mt-1 text-xs text-muted">
                  Dönem bitişi: {periodEnd}
                </p>
              ) : null}
              {plan.cancelAtPeriodEnd ? (
                <p className="mt-1 text-xs font-medium text-warning">
                  Dönem sonunda kapanacak.
                </p>
              ) : null}

              <div className="mt-5">
                {plan.status === "INACTIVE" ? (
                  <Button
                    fullWidth
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () =>
                          api(
                            `/api/admin/addons/${plan.code}/trial`,
                            json("POST"),
                          ),
                        `${plan.name} denemesi başladı.`,
                      )
                    }
                  >
                    {plan.trialDays} gün ücretsiz dene
                  </Button>
                ) : running && !plan.cancelAtPeriodEnd ? (
                  <Button
                    fullWidth
                    variant="outline"
                    disabled={busy}
                    onClick={() => cancelPlan.ask(plan)}
                  >
                    Dönem sonunda iptal et
                  </Button>
                ) : (
                  <p className="rounded-lg bg-sunken px-3 py-2.5 text-center text-xs text-muted">
                    Bu plan için şu an yapılabilecek bir işlem yok.
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <ConfirmDialog
        open={cancelPlan.open}
        title="Eklenti iptal edilsin mi?"
        description={`${cancelPlan.pending?.name} mevcut dönem sonunda kapanır. Dönem bitene kadar kullanmaya devam edebilirsin; geçmiş verilerin korunur.`}
        confirmLabel="Dönem sonunda iptal et"
        loading={busy}
        onCancel={cancelPlan.clear}
        onConfirm={async () => {
          const plan = cancelPlan.pending;
          if (!plan) return;
          await run(
            () => api(`/api/admin/addons/${plan.code}/cancel`, json("POST")),
            `${plan.name} dönem sonunda kapanacak.`,
          );
          cancelPlan.clear();
        }}
      />
    </div>
  );
}
