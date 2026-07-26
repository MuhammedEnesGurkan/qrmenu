import {
  BarChart3,
  ChefHat,
  ConciergeBell,
  FileSpreadsheet,
  Home,
  LayoutGrid,
  MoreHorizontal,
  Puzzle,
  Receipt,
  Settings,
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
  /** Sayaç anahtarı; shell canlı sayıyı buradan basar. */
  counter?: "orders" | "calls";
};

export type NavGroup = { title: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Genel",
    items: [
      { href: "/admin", label: "Yönetim paneli", icon: Home, exact: true },
      {
        href: "/admin/siparisler",
        label: "Siparişler",
        icon: Receipt,
        counter: "orders",
      },
      { href: "/admin/masalar", label: "Masalar ve QR", icon: LayoutGrid },
      { href: "/admin/menu", label: "Menü yönetimi", icon: UtensilsCrossed },
    ],
  },
  {
    title: "Operasyon",
    items: [
      {
        href: "/admin/garson",
        label: "Garson paneli",
        icon: ConciergeBell,
        counter: "calls",
      },
      { href: "/admin/mutfak", label: "Mutfak", icon: ChefHat },
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
        label: "Eklenti merkezi",
        icon: Puzzle,
        permission: "subscription/manage",
      },
      { href: "/admin/raporlar", label: "Raporlar", icon: BarChart3 },
    ],
  },
  {
    title: "Yönetim",
    items: [
      {
        href: "/admin/personel",
        label: "Personel ve yetkiler",
        icon: UsersRound,
        permission: "membership/manage",
      },
      { href: "/admin/ayarlar", label: "Ayarlar", icon: Settings },
    ],
  },
];

/**
 * Mobil alt navigasyon. Dört kalıcı hedef + "Daha fazla" çekmecesi;
 * bunlar günün büyük bölümünde tek elle en sık dokunulan ekranlar.
 */
export const MOBILE_TABS: NavItem[] = [
  { href: "/admin", label: "Ana sayfa", icon: Home, exact: true },
  {
    href: "/admin/siparisler",
    label: "Siparişler",
    icon: Receipt,
    counter: "orders",
  },
  { href: "/admin/masalar", label: "Masalar", icon: LayoutGrid },
  { href: "/admin/menu", label: "Menü", icon: UtensilsCrossed },
];

export const MORE_TAB = {
  label: "Daha fazla",
  icon: MoreHorizontal,
};

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
