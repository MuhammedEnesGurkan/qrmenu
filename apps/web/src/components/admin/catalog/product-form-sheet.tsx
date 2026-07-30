"use client";

import { useState, type FormEvent } from "react";
import type { Category, Product } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Textarea } from "@/components/ui/field";
import { Drawer } from "@/components/ui/overlay";
import { ImagePicker } from "./image-picker";

export type ProductDraft = {
  categoryId: string;
  sku: string | null;
  name: string;
  description: string | null;
  allergenInfo: string | null;
  imageUrl: string | null;
  sortOrder: number;
  price?: number;
  currency?: string;
  active?: boolean;
};

/** Ürün ekleme ve düzenleme formu. Aynı alanlar iki modda paylaşılır. */
export function ProductFormSheet({
  open,
  mode,
  categories,
  product,
  defaultCategoryId,
  busy,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  categories: Category[];
  product?: Product;
  defaultCategoryId?: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: (draft: ProductDraft) => Promise<boolean>;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(
    product?.imageUrl ?? null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const price = Number(data.get("price"));
    const nextErrors: Record<string, string> = {};

    if (name.length < 2) nextErrors.name = "Ürün adı en az 2 karakter olmalı.";
    if (mode === "create" && (!Number.isFinite(price) || price < 0)) {
      nextErrors.price = "Fiyat 0 veya daha büyük bir sayı olmalı.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const draft: ProductDraft = {
      categoryId: String(data.get("categoryId")),
      sku: emptyToNull(data.get("sku")),
      name,
      description: emptyToNull(data.get("description")),
      allergenInfo: emptyToNull(data.get("allergenInfo")),
      imageUrl,
      sortOrder: Number(data.get("sortOrder") ?? 0) || 0,
    };
    if (mode === "create") {
      draft.price = price;
      draft.currency = "TRY";
    } else {
      draft.active = product?.active ?? true;
    }

    const ok = await onSubmit(draft);
    if (ok) onClose();
  }

  return (
    /* Mobilde alttan yaprak, masaüstünde sağdan çekmece. */
    <Drawer
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Yeni ürün ekle" : "Ürünü düzenle"}
      description={
        mode === "edit"
          ? "Fiyat, listedeki hızlı fiyat alanından güncellenir."
          : undefined
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Vazgeç
          </Button>
          <Button type="submit" form="product-form" loading={busy}>
            {mode === "create" ? "Ürünü ekle" : "Değişiklikleri kaydet"}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="grid gap-4">
        <FormField label="Kategori" required>
          <Select
            name="categoryId"
            defaultValue={product?.categoryId ?? defaultCategoryId}
            required
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Ürün adı" required error={errors.name}>
          <Input
            name="name"
            required
            maxLength={140}
            defaultValue={product?.name}
            placeholder="Örn. Flat White"
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="SKU" description="Stok/kasa eşleşmesi için kod.">
            <Input name="sku" maxLength={64} defaultValue={product?.sku ?? ""} />
          </FormField>
          <FormField label="Sıra" description="Küçük değer önce görünür.">
            <Input
              name="sortOrder"
              type="number"
              min={0}
              max={10000}
              defaultValue={product?.sortOrder ?? 0}
            />
          </FormField>
        </div>

        {mode === "create" ? (
          <FormField
            label="Fiyat (TRY)"
            required
            error={errors.price}
            description="Fiyat sunucuda saklanır ve sipariş anında oradan alınır."
          >
            <Input
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue="0.00"
            />
          </FormField>
        ) : null}

        <FormField label="Açıklama">
          <Textarea
            name="description"
            maxLength={1000}
            defaultValue={product?.description ?? ""}
            placeholder="Müşteriye görünen kısa tanım"
          />
        </FormField>

        <FormField
          label="Alerjen bilgisi"
          description="Menüde uyarı alanında gösterilir."
        >
          <Input
            name="allergenInfo"
            maxLength={500}
            defaultValue={product?.allergenInfo ?? ""}
            placeholder="Süt, gluten…"
          />
        </FormField>

        <ImagePicker value={imageUrl} onChange={setImageUrl} />
      </form>
    </Drawer>
  );
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text.length === 0 ? null : text;
}
