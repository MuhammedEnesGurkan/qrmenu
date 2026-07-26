"use client";

import { useState, type FormEvent } from "react";
import { api, json, type Branding, type Catalog } from "@/lib/admin-api";
import { brandInitials, fontStack } from "@/lib/menu";
import { formatMoney, readableOn } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { FormField, Input, Switch } from "@/components/ui/field";
import { SegmentedControl } from "@/components/ui/tabs";
import { Alert } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";

const FONTS = [
  { value: "SYSTEM", label: "Sistem" },
  { value: "SERIF", label: "Serif" },
  { value: "ROUNDED", label: "Yuvarlak" },
];

const LAYOUTS = [
  { value: "CARDS", label: "Kartlar", hint: "Görsel ağırlıklı" },
  { value: "COMPACT", label: "Kompakt", hint: "Yoğun liste" },
];

export function BrandingTab({
  branding,
  catalog,
  canWrite,
  onSaved,
}: {
  branding: Branding;
  catalog: Catalog;
  canWrite: boolean;
  onSaved: () => Promise<void>;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState<Branding>(branding);
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/admin/features/branding", json("PUT", draft));
      toast.success("Marka görünümü kaydedildi.");
      await onSaved();
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "Marka kaydedilemedi.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <Card>
        <CardHeader
          title="Marka görünümü"
          description="Renkler yalnızca güvenli hex değerleri olarak saklanır; serbest CSS veya HTML kabul edilmez."
        />
        <form onSubmit={save} className="mt-5 grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Ana renk" required>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={draft.primaryColor}
                  disabled={!canWrite}
                  onChange={(event) =>
                    setDraft({ ...draft, primaryColor: event.target.value })
                  }
                  aria-label="Ana renk seçici"
                  className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-input bg-surface p-1"
                />
                <Input
                  value={draft.primaryColor}
                  disabled={!canWrite}
                  pattern="#[0-9A-Fa-f]{6}"
                  onChange={(event) =>
                    setDraft({ ...draft, primaryColor: event.target.value })
                  }
                  className="font-mono"
                />
              </div>
            </FormField>

            <FormField label="Zemin rengi" required>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={draft.surfaceColor}
                  disabled={!canWrite}
                  onChange={(event) =>
                    setDraft({ ...draft, surfaceColor: event.target.value })
                  }
                  aria-label="Zemin rengi seçici"
                  className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-input bg-surface p-1"
                />
                <Input
                  value={draft.surfaceColor}
                  disabled={!canWrite}
                  pattern="#[0-9A-Fa-f]{6}"
                  onChange={(event) =>
                    setDraft({ ...draft, surfaceColor: event.target.value })
                  }
                  className="font-mono"
                />
              </div>
            </FormField>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-fg">Yazı tipi</legend>
            <SegmentedControl
              ariaLabel="Menü yazı tipi"
              value={draft.font}
              onChange={(font) => setDraft({ ...draft, font })}
              items={FONTS}
            />
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-fg">
              Menü yerleşimi
            </legend>
            <SegmentedControl
              ariaLabel="Menü yerleşimi"
              value={draft.layout}
              onChange={(layout) => setDraft({ ...draft, layout })}
              items={LAYOUTS}
            />
          </fieldset>

          <Switch
            checked={draft.hidePoweredBy}
            disabled={!canWrite}
            onCheckedChange={(hidePoweredBy) =>
              setDraft({ ...draft, hidePoweredBy })
            }
            label="MasaAkış ibaresini gizle"
            description="Menünün alt kısmındaki &quot;MasaAkış ile sunuluyor&quot; satırını kaldırır."
          />

          {canWrite ? (
            <Button type="submit" loading={busy} className="justify-self-start">
              Markayı kaydet
            </Button>
          ) : (
            <Alert tone="info">
              Marka ayarlarını değiştirmek için menü düzenleme yetkisi gerekir.
            </Alert>
          )}
        </form>
      </Card>

      <MenuPreview draft={draft} catalog={catalog} />
    </div>
  );
}

/** Kaydetmeden önce public menünün nasıl görüneceğini gösteren canlı önizleme. */
function MenuPreview({
  draft,
  catalog,
}: {
  draft: Branding;
  catalog: Catalog;
}) {
  const onPrimary = readableOn(draft.primaryColor);
  const products = catalog.categories
    .flatMap((category) => category.products)
    .slice(0, 3);

  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <p className="mb-2 text-sm font-medium text-fg">Canlı önizleme</p>
      <div
        className="overflow-hidden rounded-2xl border border-border shadow-sm"
        style={{
          backgroundColor: draft.surfaceColor,
          fontFamily: fontStack(draft.font),
        }}
      >
        <div className="p-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              style={{ backgroundColor: draft.primaryColor, color: onPrimary }}
              className="grid size-11 shrink-0 place-items-center rounded-xl text-sm font-semibold"
            >
              {brandInitials(catalog.menu.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-fg">
                {catalog.menu.name}
              </span>
              <span className="block truncate text-xs text-muted">
                {catalog.menu.description ?? "Menü açıklaması"}
              </span>
            </span>
          </div>

          <div className="mt-4 flex gap-1.5 overflow-hidden">
            {catalog.categories.slice(0, 3).map((category, index) => (
              <span
                key={category.id}
                style={
                  index === 0
                    ? { backgroundColor: draft.primaryColor, color: onPrimary }
                    : undefined
                }
                className={
                  index === 0
                    ? "shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                    : "shrink-0 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-muted"
                }
              >
                {category.name}
              </span>
            ))}
          </div>

          <div
            className={
              draft.layout === "COMPACT"
                ? "mt-3 grid gap-1.5"
                : "mt-3 grid grid-cols-2 gap-2"
            }
          >
            {products.length === 0 ? (
              <p className="text-xs text-muted">
                Önizleme için önce ürün ekle.
              </p>
            ) : (
              products.map((product) =>
                draft.layout === "COMPACT" ? (
                  <div
                    key={product.id}
                    className="flex items-center gap-2.5 rounded-lg border border-border bg-surface p-2"
                  >
                    <span className="size-9 shrink-0 rounded bg-sunken" />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-fg">
                      {product.name}
                    </span>
                    <span
                      className="shrink-0 text-xs font-semibold tabular-nums"
                      style={{ color: draft.primaryColor }}
                    >
                      {formatMoney(product.price, product.currency)}
                    </span>
                  </div>
                ) : (
                  <div
                    key={product.id}
                    className="overflow-hidden rounded-lg border border-border bg-surface"
                  >
                    <span className="block aspect-[4/3] w-full bg-sunken" />
                    <span className="block p-2">
                      <span className="block truncate text-xs font-medium text-fg">
                        {product.name}
                      </span>
                      <span
                        className="mt-0.5 block text-xs font-semibold tabular-nums"
                        style={{ color: draft.primaryColor }}
                      >
                        {formatMoney(product.price, product.currency)}
                      </span>
                    </span>
                  </div>
                ),
              )
            )}
          </div>

          {!draft.hidePoweredBy ? (
            <p
              className="mt-4 text-center text-xs font-semibold"
              style={{ color: draft.primaryColor }}
            >
              MasaAkış ile sunuluyor
            </p>
          ) : null}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">
        Önizleme gerçek menü verinle oluşturulur; kaydettiğinde public menüye
        aynı ayarlar uygulanır.
      </p>
    </div>
  );
}
