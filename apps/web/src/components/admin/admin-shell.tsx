"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  Bell,
  Building2,
  ChevronDown,
  LogOut,
  Plus,
  QrCode,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  api,
  json,
  type AuthUser,
  type Order,
  type WaiterCall,
} from "@/lib/admin-api";
import { STAFF_ROLES } from "@/lib/labels";
import { BrandLockup, BrandMark } from "@/components/landing/brand-mark";
import { Breadcrumb, PageHeader, type Crumb } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/states";
import { MOBILE_TABS, MORE_TAB, isActive, visibleGroups } from "./nav";

type Branch = { id: string; name: string; current: boolean };

type Counters = { orders: number; calls: number };

type AdminContextValue = {
  user: AuthUser;
  branches: Branch[];
  counters: Counters;
  reloadShell: () => Promise<void>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin, AdminShell içinde kullanılmalıdır.");
  }
  return context;
}

const OPEN_ORDER_STATES = [
  "SUBMITTED",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "READY_FOR_PICKUP",
  "SERVING",
];

export function AdminShell({
  title,
  description,
  breadcrumb = [],
  actions,
  contained = true,
  children,
}: {
  title: string;
  description?: ReactNode;
  breadcrumb?: Crumb[];
  actions?: ReactNode;
  /** false ise sayfa kendi genişliğini yönetir (kanban/mutfak gibi geniş ekranlar). */
  contained?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [counters, setCounters] = useState<Counters>({ orders: 0, calls: 0 });
  const [failure, setFailure] = useState("");
  const [navOpen, setNavOpen] = useState(false);

  const reloadShell = useCallback(async () => {
    try {
      const me = await api<AuthUser>("/api/auth/me");
      setUser(me);

      // Yan bilgiler eklentiye bağlı olabilir; erişilemezse sessizce gizlenir.
      const [settings, orders, calls] = await Promise.all([
        api<{ branches: Branch[] }>("/api/admin/features").catch(() => null),
        api<Order[]>("/api/admin/orders").catch(() => [] as Order[]),
        api<WaiterCall[]>("/api/admin/orders/waiter-calls").catch(
          () => [] as WaiterCall[],
        ),
      ]);
      setBranches(settings?.branches ?? []);
      setCounters({
        orders: orders.filter((order) =>
          OPEN_ORDER_STATES.includes(order.state),
        ).length,
        calls: calls.filter((call) => call.status !== "RESOLVED").length,
      });
    } catch (caught) {
      const status = (caught as Error & { status?: number }).status;
      if (status === 401 || status === 403) {
        router.replace("/admin/giris");
        return;
      }
      setFailure(
        caught instanceof Error ? caught.message : "Oturum doğrulanamadı.",
      );
    }
  }, [router]);

  useEffect(() => {
    void reloadShell();
  }, [reloadShell]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  async function logout() {
    try {
      await api("/api/auth/logout", json("POST"));
    } finally {
      router.replace("/admin/giris");
    }
  }

  if (!user) return <ShellSkeleton message={failure} />;

  const groups = visibleGroups(user.permissions);
  const currentBranch = branches.find((branch) => branch.current);
  const canWrite = user.permissions.includes("catalog/write");

  function counterFor(key?: "orders" | "calls") {
    if (!key) return null;
    const value = counters[key];
    return value > 0 ? value : null;
  }

  const navList = (
    <nav aria-label="Yönetim menüsü" className="grid gap-5">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">
            {group.title}
          </p>
          <ul className="mt-1.5 grid gap-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item);
              const count = counterFor(item.counter);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
                      active
                        ? "bg-primary-soft text-primary"
                        : "text-fg-soft hover:bg-sunken hover:text-fg",
                    )}
                  >
                    <item.icon size={18} aria-hidden="true" className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {count ? (
                      <span
                        className={cn(
                          "type-chit shrink-0 rounded-full px-1.5 py-0.5 text-[0.68rem] font-semibold",
                          active
                            ? "bg-primary text-primary-fg"
                            : "bg-primary-soft text-primary",
                        )}
                      >
                        {count}
                        <span className="sr-only"> bekleyen</span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const sidebarActions = (
    <div className="grid gap-2">
      {canWrite ? (
        <Link
          href="/admin/menu?yeni=urun"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg shadow-xs transition hover:bg-primary-hover"
        >
          <Plus size={16} aria-hidden="true" />
          Yeni ürün ekle
        </Link>
      ) : null}
      <Link
        href="/admin/masalar"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-fg-soft transition hover:border-primary/40 hover:text-primary"
      >
        <QrCode size={16} aria-hidden="true" />
        QR oluştur
      </Link>
    </div>
  );

  return (
    <AdminContext.Provider
      value={{ user, branches, counters, reloadShell }}
    >
      <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_1fr]">
        {/* Masaüstü sidebar */}
        <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-surface lg:flex">
          <div className="flex min-h-16 items-center border-b border-border px-5">
            <Link href="/admin" aria-label="Yönetim paneli">
              <BrandLockup />
            </Link>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
            {navList}
            <div className="mt-6 border-t border-border pt-5">
              {sidebarActions}
            </div>
          </div>
          <div className="border-t border-border p-3">
            <button
              type="button"
              onClick={logout}
              className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-fg-soft transition hover:bg-sunken hover:text-destructive"
            >
              <LogOut size={18} aria-hidden="true" />
              Çıkış yap
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          {/* Üst bar */}
          <header className="safe-top sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
            <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6">
              <Link
                href="/admin"
                className="flex items-center lg:hidden"
                aria-label="Yönetim paneli"
              >
                <BrandLockup subtitle={currentBranch?.name} />
              </Link>

              <div className="ml-auto flex min-w-0 items-center gap-2">
                {currentBranch ? (
                  <div className="hidden sm:block">
                    <BranchSwitcher
                      branches={branches}
                      current={currentBranch}
                      canSwitch={user.role === "OWNER"}
                    />
                  </div>
                ) : null}

                <Link
                  href="/admin/siparisler"
                  aria-label={`Bildirimler: ${counters.calls} bekleyen garson çağrısı`}
                  className="relative grid size-11 place-items-center rounded-lg border border-border text-fg-soft transition hover:border-primary/40 hover:text-primary"
                >
                  <Bell size={18} aria-hidden="true" />
                  {counters.calls > 0 ? (
                    <span className="type-chit absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.65rem] font-semibold text-primary-fg">
                      {counters.calls}
                    </span>
                  ) : null}
                </Link>

                <div className="hidden text-right sm:block">
                  <p className="truncate text-sm font-medium leading-tight text-fg">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-muted">
                    {STAFF_ROLES[user.role] ?? user.role}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary"
                >
                  {user.displayName.slice(0, 2).toLocaleUpperCase("tr-TR")}
                </span>
              </div>
            </div>
          </header>

          <main
            id="main"
            className={cn(
              // pb-24: mobil alt tab barın içeriği kapatmaması için
              "min-w-0 flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:pb-10",
              contained && "mx-auto w-full max-w-[86rem]",
            )}
          >
            <PageHeader
              title={title}
              description={description}
              breadcrumb={
                breadcrumb.length > 0
                  ? [{ label: "Yönetim", href: "/admin" }, ...breadcrumb]
                  : undefined
              }
              actions={actions}
            />
            <div className="mt-6">{children}</div>
          </main>
        </div>

        {/* Mobil alt navigasyon */}
        <nav
          aria-label="Ana navigasyon"
          className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/97 px-1 pt-1 backdrop-blur lg:hidden"
        >
          <ul className="mx-auto flex max-w-lg items-stretch">
            {MOBILE_TABS.map((item) => {
              const active = isActive(pathname, item);
              const count = counterFor(item.counter);
              return (
                <li key={item.href} className="min-w-0 flex-1">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[0.68rem] font-medium transition",
                      active ? "text-primary" : "text-muted",
                    )}
                  >
                    <span className="relative">
                      <item.icon size={20} aria-hidden="true" />
                      {count ? (
                        <span className="type-chit absolute -right-2.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[0.6rem] font-semibold text-primary-fg">
                          {count}
                        </span>
                      ) : null}
                    </span>
                    <span className="max-w-full truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
            <li className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setNavOpen(true)}
                aria-expanded={navOpen}
                className="flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-lg px-1 text-[0.68rem] font-medium text-muted"
              >
                <MORE_TAB.icon size={20} aria-hidden="true" />
                <span className="max-w-full truncate">{MORE_TAB.label}</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* "Daha fazla" çekmecesi */}
        {navOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-end bg-inverse/50 lg:hidden"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setNavOpen(false);
            }}
          >
            <div className="animate-fade-up flex max-h-[85dvh] w-full flex-col rounded-t-2xl bg-surface shadow-overlay">
              <div className="flex min-h-14 items-center justify-between gap-2 border-b border-border px-4">
                <span className="text-sm font-semibold text-fg">
                  Tüm bölümler
                </span>
                <button
                  type="button"
                  onClick={() => setNavOpen(false)}
                  aria-label="Kapat"
                  autoFocus
                  className="grid size-11 place-items-center rounded-lg text-fg-soft"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
                {navList}
                <div className="mt-5 border-t border-border pt-4">
                  {sidebarActions}
                </div>
              </div>
              <div className="safe-bottom border-t border-border p-3">
                <button
                  type="button"
                  onClick={logout}
                  className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-destructive"
                >
                  <LogOut size={18} aria-hidden="true" />
                  Çıkış yap
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminContext.Provider>
  );
}

function BranchSwitcher({
  branches,
  current,
  canSwitch,
}: {
  branches: Branch[];
  current: Branch;
  canSwitch: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!canSwitch || branches.length < 2) {
    return (
      <span className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm text-fg-soft">
        <Building2 size={16} aria-hidden="true" className="text-muted" />
        <span className="max-w-32 truncate">{current.name}</span>
      </span>
    );
  }

  async function switchTo(branchId: string) {
    setBusy(true);
    try {
      await api(`/api/admin/features/branches/${branchId}/switch`, json("POST"));
      // Şube kapsamı oturumda değiştiği için tüm ekran yeniden yüklenir.
      window.location.reload();
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={busy}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-fg-soft transition hover:border-primary/40"
      >
        <Building2 size={16} aria-hidden="true" className="text-muted" />
        <span className="max-w-28 truncate">{current.name}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label="Aktif şube"
          className="animate-fade-up absolute right-0 z-40 mt-1 min-w-56 rounded-xl border border-border bg-surface p-1 shadow-lg"
        >
          {branches.map((branch) => (
            <li key={branch.id}>
              <button
                type="button"
                role="option"
                aria-selected={branch.current}
                disabled={branch.current || busy}
                onClick={() => void switchTo(branch.id)}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-sm",
                  branch.current
                    ? "bg-primary-soft font-semibold text-primary"
                    : "text-fg hover:bg-sunken",
                )}
              >
                <span className="truncate">{branch.name}</span>
                {branch.current ? <span aria-hidden="true">✓</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ShellSkeleton({ message }: { message: string }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_1fr]">
      <div className="hidden border-r border-border bg-surface p-5 lg:block">
        <div className="flex items-center gap-2.5">
          <BrandMark className="size-8" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="mt-8 grid gap-2">
          {Array.from({ length: 9 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div
          role="status"
          aria-live="polite"
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <span className="sr-only">Yönetim paneli yükleniyor…</span>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="mt-6 h-80 w-full" />
        {message ? (
          <p role="alert" className="mt-6 text-sm font-medium text-destructive">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
