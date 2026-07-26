"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ChevronDown, Languages } from "lucide-react";
import { cn } from "@/lib/cn";
import { api, json, type Catalog, type FeatureSettings } from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Checkbox, FormField, Input } from "@/components/ui/field";
import { Alert, EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";

export function TranslationsTab({
  settings,
  catalog,
  canWrite,
  onSaved,
}: {
  settings: FeatureSettings;
  catalog: Catalog;
  canWrite: boolean;
  onSaved: () => Promise<void>;
}) {
  const toast = useToast();
  const [locale, setLocale] = useState(settings.translations[0]?.locale ?? "en");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const progress = settings.translations.find(
    (item) => item.locale === locale,
  );

  const categories = useMemo(() => {
    if (!onlyMissing) return catalog.categories;
    return catalog.categories
      .map((category) => ({
        ...category,
        products: category.products.filter(
          (product) => !values[`p-${product.id}`]?.trim(),
        ),
      }))
      .filter((category) => category.products.length > 0);
  }, [catalog.categories, onlyMissing, values]);

  // Boş bırakılan alan çeviri girilmemiş sayılır ve kaynak değere düşer.
  function field(key: string, fallback: string) {
    const value = values[key];
    return value === undefined || value.trim() === "" ? fallback : value;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(locale)) {
      toast.error("Dil kodu 'en' veya 'en-GB' biçiminde olmalı.");
      return;
    }
    setBusy(true);
    try {
      await api(
        `/api/admin/features/translations/${locale}`,
        json("PUT", {
          menuId: catalog.menu.id,
          menuName: field("menu-name", catalog.menu.name),
          menuDescription: field(
            "menu-description",
            catalog.menu.description ?? "",
          ),
          categories: catalog.categories.map((category) => ({
            id: category.id,
            name: field(`c-${category.id}`, category.name),
          })),
          products: catalog.categories.flatMap((category) =>
            category.products.map((product) => ({
              id: product.id,
              name: field(`p-${product.id}`, product.name),
              description: field(
                `pd-${product.id}`,
                product.description ?? "",
              ),
              allergens: product.allergenInfo,
            })),
          ),
        }),
      );
      toast.success(`${locale.toUpperCase()} çevirileri kaydedildi.`);
      await onSaved();
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "Çeviri kaydedilemedi.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (catalog.categories.length === 0) {
    return (
      <EmptyState
        icon={<Languages size={20} />}
        title="Çevrilecek içerik yok"
        description="Önce menüne kategori ve ürün ekle, sonra çevirilerini gir."
      />
    );
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader
          title="Çeviri durumu"
          description={`Toplam ${settings.totalProducts} ürün. Boş bırakılan alanlar varsayılan dildeki değerle kaydedilir.`}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {settings.translations.length === 0 ? (
            <p className="text-sm text-muted">Henüz kayıtlı çeviri yok.</p>
          ) : (
            settings.translations.map((item) => {
              const complete = item.translatedProducts >= settings.totalProducts;
              return (
                <Badge
                  key={item.locale}
                  tone={complete ? "success" : "warning"}
                  icon={complete ? "✓" : "◐"}
                >
                  {item.locale.toUpperCase()} · {item.translatedProducts}/
                  {settings.totalProducts}
                </Badge>
              );
            })
          )}
        </div>
      </Card>

      {!canWrite ? (
        <Alert tone="info">
          Çeviri girmek için menü düzenleme yetkisi gerekir.
        </Alert>
      ) : null}

      <form onSubmit={submit} className="grid gap-4">
        <Card>
          <div className="grid gap-4 sm:grid-cols-[12rem_1fr] sm:items-end">
            <FormField
              label="Dil kodu"
              required
              description="Örn. en, de, en-GB"
            >
              <Input
                value={locale}
                onChange={(event) => setLocale(event.target.value)}
                pattern="[a-z]{2}(-[A-Z]{2})?"
                maxLength={5}
                required
                disabled={!canWrite}
                className="font-mono"
              />
            </FormField>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Checkbox
                label="Yalnız eksik çevirileri göster"
                checked={onlyMissing}
                onChange={(event) => setOnlyMissing(event.target.checked)}
              />
              {progress ? (
                <p className="text-sm text-muted">
                  {progress.translatedProducts} / {settings.totalProducts} ürün
                  çevrildi
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <FormField label="Menü adı" required>
              <Input
                value={field("menu-name", catalog.menu.name)}
                onChange={(event) =>
                  setValues({ ...values, "menu-name": event.target.value })
                }
                maxLength={140}
                required
                disabled={!canWrite}
              />
            </FormField>
            <FormField label="Menü açıklaması">
              <Input
                value={field("menu-description", catalog.menu.description ?? "")}
                onChange={(event) =>
                  setValues({
                    ...values,
                    "menu-description": event.target.value,
                  })
                }
                maxLength={500}
                disabled={!canWrite}
              />
            </FormField>
          </div>
        </Card>

        {categories.length === 0 ? (
          <EmptyState
            title="Eksik çeviri kalmadı"
            description="Bu dil için tüm ürünlerde bir değer girilmiş görünüyor."
          />
        ) : (
          categories.map((category) => (
            <CategoryTranslations
              key={category.id}
              category={category}
              values={values}
              disabled={!canWrite}
              onChange={(key, value) =>
                setValues((current) => ({ ...current, [key]: value }))
              }
            />
          ))
        )}

        {canWrite ? (
          <Button type="submit" loading={busy} className="justify-self-start">
            Çevirileri kaydet
          </Button>
        ) : null}
      </form>
    </div>
  );
}

function CategoryTranslations({
  category,
  values,
  disabled,
  onChange,
}: {
  category: Catalog["categories"][number];
  values: Record<string, string>;
  disabled: boolean;
  onChange: (key: string, value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const translated = category.products.filter((product) =>
    values[`p-${product.id}`]?.trim(),
  ).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex min-h-12 w-full items-center gap-3 px-4 text-left"
      >
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={cn("shrink-0 text-muted transition", !open && "-rotate-90")}
        />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">
          {category.name}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-muted">
          {translated}/{category.products.length}
        </span>
      </button>

      <div hidden={!open} className="grid gap-4 border-t border-border p-4">
        <FormField label={`"${category.name}" kategori adı çevirisi`}>
          <Input
            value={values[`c-${category.id}`] ?? category.name}
            onChange={(event) => onChange(`c-${category.id}`, event.target.value)}
            maxLength={140}
            disabled={disabled}
          />
        </FormField>
        {category.products.map((product) => (
          <div
            key={product.id}
            className="grid gap-3 rounded-xl bg-sunken p-3 sm:grid-cols-2"
          >
            <FormField label={`${product.name} — ad`}>
              <Input
                value={values[`p-${product.id}`] ?? ""}
                placeholder={product.name}
                onChange={(event) =>
                  onChange(`p-${product.id}`, event.target.value)
                }
                maxLength={140}
                disabled={disabled}
              />
            </FormField>
            <FormField label={`${product.name} — açıklama`}>
              <Input
                value={values[`pd-${product.id}`] ?? ""}
                placeholder={product.description ?? "Açıklama"}
                onChange={(event) =>
                  onChange(`pd-${product.id}`, event.target.value)
                }
                maxLength={1000}
                disabled={disabled}
              />
            </FormField>
          </div>
        ))}
      </div>
    </section>
  );
}
