"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Plus } from "lucide-react";
import { api, json, type Catalog, type FeatureSettings } from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/field";
import { Dialog } from "@/components/ui/overlay";
import { Tabs } from "@/components/ui/tabs";
import { Alert, ErrorState, Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { AdminShell, useAdmin } from "../admin/admin-shell";
import { useAction, useResource } from "../admin/use-resource";
import { BrandingTab } from "./branding-tab";
import { TranslationsTab } from "./translations-tab";

const TABS = [
  { value: "subeler", label: "Şubeler" },
  { value: "marka", label: "Marka" },
  { value: "diller", label: "Diller" },
];

export function SettingsScreen() {
  return (
    <AdminShell
      title="Ayarlar"
      description="Şube, marka ve dil ayarları. Bir eklenti kapalıysa ilgili işlem sunucu tarafında engellenir."
      breadcrumb={[{ label: "Ayarlar" }]}
    >
      <SettingsBody />
    </AdminShell>
  );
}

function SettingsBody() {
  const { user } = useAdmin();
  const router = useRouter();
  const params = useSearchParams();
  const canWrite = user.permissions.includes("catalog/write");

  const requested = params.get("sekme") ?? "subeler";
  const active = TABS.some((tab) => tab.value === requested)
    ? requested
    : "subeler";

  const loader = useCallback(
    async () =>
      Promise.all([
        api<FeatureSettings>("/api/admin/features"),
        api<Catalog>("/api/admin/catalog"),
      ]),
    [],
  );
  const { data, error, loading, reload } = useResource(loader);

  if (loading && !data) {
    return (
      <div role="status" aria-live="polite" className="grid gap-4">
        <span className="sr-only">Ayarlar yükleniyor…</span>
        <Skeleton className="h-11 w-80 rounded-lg" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const [settings, catalog] = data;

  return (
    <div className="grid gap-6">
      <Tabs
        ariaLabel="Ayar bölümleri"
        value={active}
        onChange={(value) => router.replace(`/admin/ayarlar?sekme=${value}`)}
        items={TABS}
      />

      {active === "subeler" ? (
        <BranchesTab settings={settings} reload={reload} isOwner={user.role === "OWNER"} />
      ) : null}
      {active === "marka" ? (
        <BrandingTab
          branding={settings.branding}
          catalog={catalog}
          canWrite={canWrite}
          onSaved={reload}
        />
      ) : null}
      {active === "diller" ? (
        <TranslationsTab
          settings={settings}
          catalog={catalog}
          canWrite={canWrite}
          onSaved={reload}
        />
      ) : null}
    </div>
  );
}

function BranchesTab({
  settings,
  reload,
  isOwner,
}: {
  settings: FeatureSettings;
  reload: () => Promise<void>;
  isOwner: boolean;
}) {
  const toast = useToast();
  const { busy, run } = useAction(reload);
  const [open, setOpen] = useState(false);
  const activeCount = settings.branches.filter((branch) => branch.active).length;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader
          title={`${activeCount} etkin şube`}
          description="Plan limiti 5 etkin şubedir. Yeni şube boş bir menüyle birlikte oluşturulur."
          actions={
            isOwner ? (
              <Button
                leadingIcon={<Plus size={16} aria-hidden="true" />}
                onClick={() => setOpen(true)}
                disabled={activeCount >= 5}
              >
                Şube ekle
              </Button>
            ) : undefined
          }
        />
        {activeCount >= 5 ? (
          <Alert tone="warning" className="mt-4">
            Etkin şube limitine ulaştın. Yeni şube için mevcut bir şubeyi
            kapatman gerekir.
          </Alert>
        ) : null}

        <ul className="mt-5 grid gap-2">
          {settings.branches.map((branch) => (
            <li
              key={branch.id}
              className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-border px-4 py-3"
            >
              <Building2 size={16} aria-hidden="true" className="text-muted" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                {branch.name}
              </span>
              {branch.current ? (
                <Badge tone="primary" icon="✓">
                  Aktif şube
                </Badge>
              ) : null}
              <Badge
                tone={branch.active ? "success" : "neutral"}
                icon={branch.active ? "✓" : "✕"}
              >
                {branch.active ? "Açık" : "Kapalı"}
              </Badge>
              {isOwner && !branch.current ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    const ok = await run(
                      () =>
                        api(
                          `/api/admin/features/branches/${branch.id}/switch`,
                          json("POST"),
                        ),
                      "Aktif şube değişti.",
                    );
                    if (ok) window.location.reload();
                  }}
                >
                  Bu şubeye geç
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>

      {open ? (
        <Dialog
          open
          onClose={() => setOpen(false)}
          size="sm"
          title="Yeni şube"
          description="Şube ile birlikte boş bir menü oluşturulur."
          footer={
            <>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
                Vazgeç
              </Button>
              <Button type="submit" form="branch-form" loading={busy}>
                Şubeyi ekle
              </Button>
            </>
          }
        >
          <form
            id="branch-form"
            className="grid gap-4"
            onSubmit={async (event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const name = String(data.get("name") ?? "").trim();
              if (name.length < 2) {
                toast.error("Şube adı en az 2 karakter olmalı.");
                return;
              }
              const ok = await run(
                () => api("/api/admin/features/branches", json("POST", { name })),
                "Şube eklendi.",
              );
              if (ok) setOpen(false);
            }}
          >
            <FormField label="Şube adı" required>
              <Input name="name" required maxLength={140} autoFocus />
            </FormField>
          </form>
        </Dialog>
      ) : null}
    </div>
  );
}
