import {
  BarChart3,
  ChefHat,
  FileSpreadsheet,
  LayoutDashboard,
  Puzzle,
  Receipt,
  Settings,
  Table2,
  UsersRound,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Bu izin yoksa bağlantı hiç gösterilmez (disabled bırakılmaz). */
  permission?: string;
  exact?: boolean;
};

export type NavGroup = { title: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Genel",
    items: [
      {
        href: "/admin",
        label: "Genel bakış",
        icon: LayoutDashboard,
        exact: true,
      },
      { href: "/admin/menu", label: "Menü ve ürünler", icon: UtensilsCrossed },
    ],
  },
  {
    title: "Operasyon",
    items: [
      { href: "/admin/siparisler", label: "Siparişler", icon: Receipt },
      { href: "/admin/mutfak", label: "Mutfak", icon: ChefHat },
      { href: "/admin/masalar", label: "Masalar", icon: Table2 },
    ],
  },
  {
    title: "Büyüme",
    items: [
      {
        href: "/admin/katalog-pro",
        label: "Katalog Pro",
        icon: FileSpreadsheet,
        permission: "catalog/write",
      },
      {
        href: "/admin/eklentiler",
        label: "Eklentiler",
        icon: Puzzle,
        permission: "subscription/manage",
      },
      {
        href: "/admin/ayarlar?sekme=raporlar",
        label: "Raporlar",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Yönetim",
    items: [
      {
        href: "/admin/personel",
        label: "Personel",
        icon: UsersRound,
        permission: "membership/manage",
      },
      { href: "/admin/ayarlar", label: "Şubeler ve marka", icon: Settings },
    ],
  },
];

export function visibleGroups(permissions: string[]): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.permission || permissions.includes(item.permission),
    ),
  })).filter((group) => group.items.length > 0);
}

export function isActive(pathname: string, item: NavItem) {
  const base = item.href.split("?")[0];
  return item.exact ? pathname === base : pathname.startsWith(base);
}
