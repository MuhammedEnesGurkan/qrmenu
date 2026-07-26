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
  Building2,
  ChevronDown,
  ExternalLink,
  LogOut,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { api, json, type AuthUser } from "@/lib/admin-api";
import { STAFF_ROLES } from "@/lib/labels";
import { BrandMark } from "@/components/landing/brand-mark";
import { Breadcrumb, PageHeader, type Crumb } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/states";
import { isActive, visibleGroups } from "./nav";

type Branch = { id: string; name: string; current: boolean };

type AdminContextValue = {
  user: AuthUser;
  branches: Branch[];
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
  /** false ise sayfa kendi genişliğini yönetir (mutfak/kanban gibi geniş ekranlar). */
  contained?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [failure, setFailure] = useState("");
  const [navOpen, setNavOpen] = useState(false);

  const reloadShell = useCallback(async () => {
    try {
      const me = await api<AuthUser>("/api/auth/me");
      setUser(me);
      // Şube listesi eklentiye bağlı olabilir; erişilemezse sessizce gizlenir.
      try {
        const settings = await api<{ branches: Branch[] }>(
          "/api/admin/features",
        );
        setBranches(settings.branches ?? []);
      } catch {
        setBranches([]);
      }
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

  if (!user) {
    return <ShellSkeleton message={failure} />;
  }

  const groups = visibleGroups(user.permissions);
  const currentBranch = branches.find((branch) => branch.current);

  const navList = (
    <nav aria-label="Yönetim menüsü" className="grid gap-6">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted">
            {group.title}
          </p>
          <ul className="mt-1.5 grid gap-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item);
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
                    <item.icon
                      size={18}
                      aria-hidden="true"
                      className="shrink-0"
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <AdminContext.Provider value={{ user, branches, reloadShell }}>
      <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
        {/* Masaüstü sidebar */}
        <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-surface lg:flex">
          <div className="flex min-h-16 items-center gap-2.5 border-b border-border px-5">
            <BrandMark className="size-8" />
            <span className="text-sm font-semibold tracking-[-0.01em] text-fg">
              MasaAkış
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
            {navList}
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
              <button
                type="button"
                onClick={() => setNavOpen(true)}
                aria-label="Menüyü aç"
                aria-expanded={navOpen}
                className="grid size-11 shrink-0 place-items-center rounded-lg border border-border text-fg lg:hidden"
              >
                <MenuIcon size={20} aria-hidden="true" />
              </button>

              <Link
                href="/admin"
                className="flex items-center gap-2 lg:hidden"
                aria-label="Genel bakış"
              >
                <BrandMark className="size-8" />
              </Link>

              <div className="ml-auto flex min-w-0 items-center gap-2">
                {/* Dar ekranda şube seçimi Ayarlar > Şubeler üzerinden yapılır. */}
                {currentBranch ? (
                  <div className="hidden sm:block">
                    <BranchSwitcher
                      branches={branches}
                      current={currentBranch}
                      canSwitch={user.role === "OWNER"}
                    />
                  </div>
                ) : null}

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
                <button
                  type="button"
                  onClick={logout}
                  aria-label="Çıkış yap"
                  title="Çıkış yap"
                  className="grid size-11 place-items-center rounded-lg text-muted transition hover:bg-sunken hover:text-destructive lg:hidden"
                >
                  <LogOut size={18} aria-hidden="true" />
                </button>
              </div>
            </div>
          </header>

          <main
            id="main"
            className={cn(
              "safe-bottom min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8",
              contained && "mx-auto w-full max-w-6xl",
            )}
          >
            <PageHeader
              title={title}
              description={description}
              breadcrumb={[{ label: "Yönetim", href: "/admin" }, ...breadcrumb]}
              actions={actions}
            />
            <div className="mt-6 sm:mt-8">{children}</div>
          </main>
        </div>

        {/* Mobil açılır navigasyon */}
        {navOpen ? (
          <div
            className="fixed inset-0 z-50 flex bg-inverse/50 lg:hidden"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setNavOpen(false);
            }}
          >
            <div className="safe-top animate-fade-up flex h-full w-[min(20rem,85vw)] flex-col bg-surface shadow-overlay">
              <div className="flex min-h-16 items-center justify-between gap-2 border-b border-border px-4">
                <span className="flex items-center gap-2.5">
                  <BrandMark className="size-8" />
                  <span className="text-sm font-semibold text-fg">
                    MasaAkış
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setNavOpen(false)}
                  aria-label="Menüyü kapat"
                  autoFocus
                  className="grid size-11 place-items-center rounded-lg text-fg-soft"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
                {navList}
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
      <span className="hidden items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-fg-soft sm:inline-flex">
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
        <span className="max-w-24 truncate sm:max-w-32">{current.name}</span>
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
                {branch.current ? (
                  <span aria-hidden="true">✓</span>
                ) : (
                  <ExternalLink size={14} aria-hidden="true" className="text-muted" />
                )}
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
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <div className="hidden border-r border-border bg-surface p-5 lg:block">
        <Skeleton className="h-8 w-32" />
        <div className="mt-8 grid gap-2">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-10 w-40" />
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
        <Skeleton className="mt-6 h-72 w-full" />
        {message ? (
          <p role="alert" className="mt-6 text-sm font-medium text-destructive">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
