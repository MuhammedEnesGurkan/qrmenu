"use client";

import { useCallback, useState, type FormEvent } from "react";
import { ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { api, json, type Staff } from "@/lib/admin-api";
import { ASSIGNABLE_ROLES, STAFF_ROLES } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { FormField, Input, Select } from "@/components/ui/field";
import { ConfirmDialog, Dialog, useConfirm } from "@/components/ui/overlay";
import { Alert, EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { AdminShell, useAdmin } from "./admin-shell";
import { useAction, useResource } from "./use-resource";

export function StaffManager() {
  return (
    <AdminShell
      title="Personel ve roller"
      description="Her kullanıcı yalnızca görevine gereken izinleri alır. Rol sınırları sunucuda denetlenir."
      breadcrumb={[{ label: "Personel" }]}
    >
      <StaffBody />
    </AdminShell>
  );
}

function StaffBody() {
  const { user } = useAdmin();
  const loader = useCallback(() => api<Staff[]>("/api/admin/staff"), []);
  const { data, error, loading, reload } = useResource(loader);
  const { busy, run } = useAction(reload);
  const [createOpen, setCreateOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const deactivate = useConfirm<Staff>();

  if (loading && !data) {
    return (
      <div role="status" aria-live="polite" className="grid gap-3">
        <span className="sr-only">Personel listesi yükleniyor…</span>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    );
  }
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  const staff = data ?? [];
  const active = staff.filter((person) => person.active);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader
          title={`${active.length} aktif personel`}
          description={`Toplam ${staff.length} kayıt. Kendi hesabını devre dışı bırakamazsın.`}
          actions={
            <Button
              leadingIcon={<UserPlus size={16} aria-hidden="true" />}
              onClick={() => {
                setFormError("");
                setCreateOpen(true);
              }}
            >
              Personel ekle
            </Button>
          }
        />
      </Card>

      {staff.length === 0 ? (
        <EmptyState
          icon={<UsersRound size={20} />}
          title="Henüz personel yok"
          description="Garson, mutfak ya da menü editörü rolünde kullanıcı ekleyerek yetkileri ayrıştır."
          action={
            <Button onClick={() => setCreateOpen(true)}>İlk personeli ekle</Button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {staff.map((person) => {
            const self = person.id === user.userId;
            return (
              <li
                key={person.id}
                className="flex min-w-0 flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs"
              >
                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary"
                >
                  {person.displayName.slice(0, 2).toLocaleUpperCase("tr-TR")}
                </span>
                <span className="min-w-0 flex-1 basis-48">
                  <span className="block truncate text-sm font-semibold text-fg">
                    {person.displayName}
                    {self ? (
                      <span className="ml-2 text-xs font-normal text-muted">
                        (siz)
                      </span>
                    ) : null}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {person.email}
                  </span>
                </span>
                <Badge tone="info" icon={<ShieldCheck size={12} />}>
                  {STAFF_ROLES[person.role] ?? person.role}
                </Badge>
                <Badge
                  tone={person.active ? "success" : "neutral"}
                  icon={person.active ? "✓" : "✕"}
                >
                  {person.active ? "Aktif" : "Devre dışı"}
                </Badge>
                {!self ? (
                  <DropdownMenu
                    label={`${person.displayName} işlemleri`}
                    items={[
                      ...ASSIGNABLE_ROLES.filter(
                        (role) => role !== person.role,
                      ).map((role) => ({
                        label: `Rolü ${STAFF_ROLES[role]} yap`,
                        onSelect: () =>
                          void run(
                            () =>
                              api(
                                `/api/admin/staff/${person.id}`,
                                json("PATCH", { role, active: person.active }),
                              ),
                            "Personel rolü güncellendi.",
                          ),
                        disabled: busy,
                      })),
                      {
                        label: person.active
                          ? "Devre dışı bırak"
                          : "Yeniden etkinleştir",
                        tone: person.active
                          ? ("destructive" as const)
                          : ("default" as const),
                        onSelect: () =>
                          person.active
                            ? deactivate.ask(person)
                            : void run(
                                () =>
                                  api(
                                    `/api/admin/staff/${person.id}`,
                                    json("PATCH", {
                                      role: person.role,
                                      active: true,
                                    }),
                                  ),
                                "Personel etkinleştirildi.",
                              ),
                        disabled: busy,
                      },
                    ]}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {createOpen ? (
        <Dialog
          open
          onClose={() => setCreateOpen(false)}
          title="Personel ekle"
          description="Geçici parolayı personelle güvenli bir kanaldan paylaş."
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={busy}
              >
                Vazgeç
              </Button>
              <Button type="submit" form="staff-form" loading={busy}>
                Personeli ekle
              </Button>
            </>
          }
        >
          {formError ? (
            <Alert tone="destructive" className="mb-4">
              {formError}
            </Alert>
          ) : null}
          <form
            id="staff-form"
            className="grid gap-4"
            onSubmit={async (event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const password = String(data.get("password") ?? "");
              if (password.length < 12) {
                setFormError("Geçici parola en az 12 karakter olmalı.");
                return;
              }
              setFormError("");
              const ok = await run(
                () =>
                  api(
                    "/api/admin/staff",
                    json("POST", {
                      email: data.get("email"),
                      displayName: data.get("displayName"),
                      password,
                      role: data.get("role"),
                    }),
                  ),
                "Personel eklendi.",
              );
              if (ok) setCreateOpen(false);
            }}
          >
            <FormField label="Ad soyad" required>
              <Input
                name="displayName"
                required
                minLength={2}
                maxLength={140}
                autoFocus
              />
            </FormField>
            <FormField label="E-posta" required>
              <Input name="email" type="email" required maxLength={254} />
            </FormField>
            <FormField
              label="Geçici parola"
              required
              description="En az 12 karakter. İlk girişten sonra değiştirilmesi önerilir."
            >
              <Input
                name="password"
                type="password"
                required
                minLength={12}
                maxLength={128}
              />
            </FormField>
            <FormField label="Rol" required>
              <Select name="role" required defaultValue="WAITER">
                {ASSIGNABLE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {STAFF_ROLES[role]}
                  </option>
                ))}
              </Select>
            </FormField>
          </form>
        </Dialog>
      ) : null}

      <ConfirmDialog
        open={deactivate.open}
        title="Personel devre dışı bırakılsın mı?"
        description={`${deactivate.pending?.displayName} artık panele giremez. Kayıt silinmez, istediğinde tekrar etkinleştirebilirsin.`}
        confirmLabel="Devre dışı bırak"
        loading={busy}
        onCancel={deactivate.clear}
        onConfirm={async () => {
          const person = deactivate.pending;
          if (!person) return;
          await run(
            () =>
              api(
                `/api/admin/staff/${person.id}`,
                json("PATCH", { role: person.role, active: false }),
              ),
            "Personel devre dışı bırakıldı.",
          );
          deactivate.clear();
        }}
      />
    </div>
  );
}
