"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import { FolderPlus, Plus, Search, Settings2 } from "lucide-react";
import {
  api,
  json,
  type Catalog,
  type Category,
  type Product,
} from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { FormField, Input, Textarea } from "@/components/ui/field";
import { ConfirmDialog, Dialog, Sheet, useConfirm } from "@/components/ui/overlay";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { AdminShell, useAdmin } from "../admin-shell";
import { useAction, useResource } from "../use-resource";
import { CategorySection, type CategoryActions } from "./category-section";
import { ProductFormSheet, type ProductDraft } from "./product-form-sheet";

export function CatalogManager() {
  return (
    <AdminShell
      title="Menü ve ürünler"
      description="Kategorileri, ürünleri, fiyatları ve mevcutluk durumunu buradan yönetirsin."
      breadcrumb={[{ label: "Menü ve ürünler" }]}
    >
      <CatalogBody />
    </AdminShell>
  );
}

type ProductSheetState =
  | { mode: "create"; categoryId: string }
  | { mode: "edit"; product: Product }
  | null;

function CatalogBody() {
  const { user } = useAdmin();
  const canWrite = user.permissions.includes("catalog/write");

  const loader = useCallback(() => api<Catalog>("/api/admin/catalog"), []);
  const { data: catalog, error, loading, reload } = useResource(loader);
  const { busy, run } = useAction(reload);

  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [renaming, setRenaming] = useState<Category | null>(null);
  const [productSheet, setProductSheet] = useState<ProductSheetState>(null);
  const archiveCategory = useConfirm<Category>();
  const archiveProduct = useConfirm<Product>();

  const filtered = useMemo(() => {
    if (!catalog) return [];
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    if (!normalized) return catalog.categories;
    return catalog.categories
      .map((category) => ({
        ...category,
        products: category.products.filter((product) =>
          `${product.name} ${product.sku ?? ""}`
            .toLocaleLowerCase("tr-TR")
            .includes(normalized),
        ),
      }))
      .filter(
        (category) =>
          category.products.length > 0 ||
          category.name.toLocaleLowerCase("tr-TR").includes(normalized),
      );
  }, [catalog, query]);

  if (loading && !catalog) return <CatalogSkeleton />;
  if (error && !catalog) return <ErrorState message={error} onRetry={reload} />;
  if (!catalog) return null;

  const productCount = catalog.categories.reduce(
    (total, category) => total + category.products.length,
    0,
  );

  const actions: CategoryActions = {
    onToggleVisibility: (category) =>
      void run(
        () =>
          api(
            `/api/admin/catalog/categories/${category.id}`,
            json("PATCH", {
              name: category.name,
              sortOrder: category.sortOrder,
              active: !category.active,
            }),
          ),
        category.active ? "Kategori gizlendi." : "Kategori yayına alındı.",
      ),
    onRename: setRenaming,
    onArchive: archiveCategory.ask,
    onAddProduct: (category) =>
      setProductSheet({ mode: "create", categoryId: category.id }),
    onEditProduct: (product) => setProductSheet({ mode: "edit", product }),
    onArchiveProduct: archiveProduct.ask,
    onToggleAvailability: (product) =>
      void run(
        () =>
          api(
            `/api/admin/catalog/products/${product.id}/availability`,
            json("PATCH", { available: !product.available }),
          ),
        product.available
          ? `${product.name} tükendi olarak işaretlendi.`
          : `${product.name} tekrar mevcut.`,
      ),
    onSavePrice: (product, price) =>
      void run(
        () =>
          api(
            `/api/admin/catalog/products/${product.id}/price`,
            json("PATCH", {
              price,
              currency: product.currency,
              version: product.version,
            }),
          ),
        `${product.name} fiyatı güncellendi.`,
      ),
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader
          title={catalog.menu.name}
          description={
            <>
              Kalıcı adres <code className="text-fg-soft">/m/{catalog.menu.slug}</code>{" "}
              · {catalog.categories.length} kategori · {productCount} ürün
            </>
          }
          actions={
            <>
              <Badge
                tone={catalog.menu.published ? "success" : "warning"}
                icon={catalog.menu.published ? "✓" : "!"}
              >
                {catalog.menu.published ? "Yayında" : "Yayında değil"}
              </Badge>
              {canWrite ? (
                <Button
                  variant="outline"
                  size="sm"
                  leadingIcon={<Settings2 size={15} aria-hidden="true" />}
                  onClick={() => setMenuOpen(true)}
                >
                  Menü bilgileri
                </Button>
              ) : null}
            </>
          }
        />
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ürün veya SKU ara"
            aria-label="Ürün veya SKU ara"
            className="h-11 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          />
        </div>
        {canWrite ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              leadingIcon={<FolderPlus size={16} aria-hidden="true" />}
              onClick={() => setCategoryOpen(true)}
            >
              Kategori
            </Button>
            <Button
              leadingIcon={<Plus size={16} aria-hidden="true" />}
              disabled={catalog.categories.length === 0}
              onClick={() =>
                setProductSheet({
                  mode: "create",
                  categoryId: catalog.categories[0]?.id ?? "",
                })
              }
            >
              Ürün ekle
            </Button>
          </div>
        ) : null}
      </div>

      {catalog.categories.length === 0 ? (
        <EmptyState
          icon={<FolderPlus size={20} />}
          title="Henüz kategori yok"
          description="Menüne ilk kategoriyi ekleyerek başla. Kategoriler menüde bölüm başlığı olarak görünür."
          action={
            canWrite ? (
              <Button onClick={() => setCategoryOpen(true)}>
                İlk kategoriyi ekle
              </Button>
            ) : undefined
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search size={20} />}
          title="Sonuç bulunamadı"
          description={`"${query.trim()}" için eşleşen ürün yok.`}
          action={
            <Button variant="outline" onClick={() => setQuery("")}>
              Aramayı temizle
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {filtered.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              canWrite={canWrite}
              busy={busy}
              actions={actions}
              defaultOpen={filtered.length <= 4 || query.trim().length > 0}
            />
          ))}
        </div>
      )}

      {/* Menü bilgileri */}
      <MenuSettingsDialog
        open={menuOpen}
        catalog={catalog}
        busy={busy}
        onClose={() => setMenuOpen(false)}
        onSave={async (body) => {
          const ok = await run(
            () => api("/api/admin/catalog/menu", json("PATCH", body)),
            "Menü bilgileri kaydedildi.",
          );
          if (ok) setMenuOpen(false);
        }}
      />

      {/* Kategori ekleme */}
      <CategoryDialog
        open={categoryOpen}
        busy={busy}
        onClose={() => setCategoryOpen(false)}
        onSubmit={async (body) => {
          const ok = await run(
            () => api("/api/admin/catalog/categories", json("POST", body)),
            "Kategori eklendi.",
          );
          if (ok) setCategoryOpen(false);
        }}
      />

      {/* Kategori yeniden adlandırma */}
      <CategoryDialog
        open={renaming !== null}
        busy={busy}
        category={renaming ?? undefined}
        onClose={() => setRenaming(null)}
        onSubmit={async (body) => {
          if (!renaming) return;
          const ok = await run(
            () =>
              api(
                `/api/admin/catalog/categories/${renaming.id}`,
                json("PATCH", { ...body, active: renaming.active }),
              ),
            "Kategori güncellendi.",
          );
          if (ok) setRenaming(null);
        }}
      />

      {/* Ürün formu */}
      {productSheet ? (
        <ProductFormSheet
          key={
            productSheet.mode === "edit"
              ? productSheet.product.id
              : `new-${productSheet.categoryId}`
          }
          open
          mode={productSheet.mode}
          categories={catalog.categories}
          product={
            productSheet.mode === "edit" ? productSheet.product : undefined
          }
          defaultCategoryId={
            productSheet.mode === "create" ? productSheet.categoryId : undefined
          }
          busy={busy}
          onClose={() => setProductSheet(null)}
          onSubmit={(draft: ProductDraft) =>
            productSheet.mode === "create"
              ? run(
                  () => api("/api/admin/catalog/products", json("POST", draft)),
                  "Ürün eklendi.",
                )
              : run(
                  () =>
                    api(
                      `/api/admin/catalog/products/${productSheet.product.id}`,
                      json("PATCH", draft),
                    ),
                  "Ürün bilgileri güncellendi.",
                )
          }
        />
      ) : null}

      <ConfirmDialog
        open={archiveCategory.open}
        title="Kategori arşivlensin mi?"
        description={`"${archiveCategory.pending?.name}" kategorisi ve içindeki ürünler menüden kaldırılır. Bu işlem geri alınamaz.`}
        confirmLabel="Arşivle"
        loading={busy}
        onCancel={archiveCategory.clear}
        onConfirm={async () => {
          const category = archiveCategory.pending;
          if (!category) return;
          await run(
            () => api(`/api/admin/catalog/categories/${category.id}`, json("DELETE")),
            "Kategori arşivlendi.",
          );
          archiveCategory.clear();
        }}
      />

      <ConfirmDialog
        open={archiveProduct.open}
        title="Ürün arşivlensin mi?"
        description={`"${archiveProduct.pending?.name}" menüden kaldırılır. Geçmiş siparişlerdeki kaydı korunur.`}
        confirmLabel="Arşivle"
        loading={busy}
        onCancel={archiveProduct.clear}
        onConfirm={async () => {
          const product = archiveProduct.pending;
          if (!product) return;
          await run(
            () => api(`/api/admin/catalog/products/${product.id}`, json("DELETE")),
            "Ürün arşivlendi.",
          );
          archiveProduct.clear();
        }}
      />
    </div>
  );
}

function CategoryDialog({
  open,
  busy,
  category,
  onClose,
  onSubmit,
}: {
  open: boolean;
  busy: boolean;
  category?: Category;
  onClose: () => void;
  onSubmit: (body: { name: string; sortOrder: number }) => void;
}) {
  if (!open) return null;
  return (
    <Dialog
      open
      onClose={onClose}
      size="sm"
      title={category ? "Kategoriyi düzenle" : "Yeni kategori"}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Vazgeç
          </Button>
          <Button type="submit" form="category-form" loading={busy}>
            {category ? "Kaydet" : "Kategori ekle"}
          </Button>
        </>
      }
    >
      <form
        id="category-form"
        className="grid gap-4"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onSubmit({
            name: String(data.get("name") ?? "").trim(),
            sortOrder: Number(data.get("sortOrder") ?? 0) || 0,
          });
        }}
      >
        <FormField label="Kategori adı" required>
          <Input
            name="name"
            required
            minLength={2}
            maxLength={140}
            defaultValue={category?.name}
            placeholder="Örn. Kahveler"
            autoFocus
          />
        </FormField>
        <FormField label="Sıra" description="Küçük değer menüde önce görünür.">
          <Input
            name="sortOrder"
            type="number"
            min={0}
            max={10000}
            defaultValue={category?.sortOrder ?? 0}
          />
        </FormField>
      </form>
    </Dialog>
  );
}

function MenuSettingsDialog({
  open,
  catalog,
  busy,
  onClose,
  onSave,
}: {
  open: boolean;
  catalog: Catalog;
  busy: boolean;
  onClose: () => void;
  onSave: (body: Record<string, string | null>) => void;
}) {
  if (!open) return null;
  return (
    <Sheet
      open
      onClose={onClose}
      title="Menü bilgileri"
      description="Bu bilgiler müşteri tarafındaki menü başlığında görünür."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Vazgeç
          </Button>
          <Button type="submit" form="menu-form" loading={busy}>
            Kaydet
          </Button>
        </>
      }
    >
      <form
        id="menu-form"
        className="grid gap-4"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const text = (key: string) => {
            const value = String(data.get(key) ?? "").trim();
            return value.length === 0 ? null : value;
          };
          onSave({
            name: String(data.get("name") ?? "").trim(),
            description: text("description"),
            logoUrl: text("logoUrl"),
            locale: String(data.get("locale") ?? "tr").trim(),
          });
        }}
      >
        <FormField label="Menü adı" required>
          <Input
            name="name"
            required
            minLength={2}
            maxLength={140}
            defaultValue={catalog.menu.name}
          />
        </FormField>
        <FormField label="Açıklama">
          <Textarea
            name="description"
            maxLength={500}
            defaultValue={catalog.menu.description ?? ""}
          />
        </FormField>
        <FormField
          label="Logo adresi"
          description="Ürün görselleri gibi yüklenen bir asset yolu ya da https ile başlayan adres."
        >
          <Input
            name="logoUrl"
            maxLength={500}
            defaultValue={catalog.menu.logoUrl ?? ""}
            placeholder="/api/public/assets/…"
          />
        </FormField>
        <FormField label="Varsayılan dil" required>
          <Input
            name="locale"
            required
            pattern="[a-z]{2}(-[A-Z]{2})?"
            maxLength={5}
            defaultValue={catalog.menu.locale}
          />
        </FormField>
      </form>
    </Sheet>
  );
}

function CatalogSkeleton() {
  return (
    <div role="status" aria-live="polite" className="grid gap-4">
      <span className="sr-only">Menü yükleniyor…</span>
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-11 w-full rounded-lg" />
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-40 w-full rounded-2xl" />
      ))}
    </div>
  );
}
