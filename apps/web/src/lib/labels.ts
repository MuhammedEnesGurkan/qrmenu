import type { BadgeTone } from "@/components/ui/badge";

type LabelEntry = { label: string; tone: BadgeTone; icon: string };

/** Sipariş durum makinesi — backend enumları son kullanıcıya ham gösterilmez. */
export const ORDER_STATES: Record<string, LabelEntry> = {
  SUBMITTED: { label: "Yeni", tone: "info", icon: "●" },
  ACCEPTED: { label: "Onaylandı", tone: "primary", icon: "✓" },
  PREPARING: { label: "Hazırlanıyor", tone: "warning", icon: "◐" },
  READY: { label: "Hazır", tone: "success", icon: "▲" },
  SERVING: { label: "Serviste", tone: "primary", icon: "→" },
  DELIVERED: { label: "Teslim edildi", tone: "neutral", icon: "✓✓" },
  REJECTED: { label: "Reddedildi", tone: "destructive", icon: "✕" },
  READY_FOR_PICKUP: { label: "Teslime hazır", tone: "success", icon: "▲" },
  PICKED_UP: { label: "Teslim alındı", tone: "neutral", icon: "✓✓" },
};

/** Kanban kolonlarının sırası. */
export const ORDER_STATE_ORDER = [
  "SUBMITTED",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "READY_FOR_PICKUP",
  "SERVING",
  "DELIVERED",
  "PICKED_UP",
  "REJECTED",
] as const;

export const KITCHEN_STATES: Record<string, LabelEntry> = {
  QUEUED: { label: "Kuyrukta", tone: "info", icon: "●" },
  PREPARING: { label: "Hazırlanıyor", tone: "warning", icon: "◐" },
  DONE: { label: "Tamamlandı", tone: "success", icon: "✓" },
};

export const WAITER_CALL_STATES: Record<string, LabelEntry> = {
  PENDING: { label: "Bekliyor", tone: "destructive", icon: "!" },
  ACKNOWLEDGED: { label: "Üstlenildi", tone: "warning", icon: "◐" },
  RESOLVED: { label: "Çözüldü", tone: "success", icon: "✓" },
};

export const ADDON_STATES: Record<string, LabelEntry> = {
  INACTIVE: { label: "Kapalı", tone: "neutral", icon: "○" },
  TRIAL: { label: "Deneme", tone: "info", icon: "◐" },
  ACTIVE: { label: "Etkin", tone: "success", icon: "✓" },
  PAST_DUE: { label: "Ödeme bekliyor", tone: "warning", icon: "!" },
  CANCELLED: { label: "İptal edildi", tone: "neutral", icon: "✕" },
  EXPIRED: { label: "Süresi doldu", tone: "destructive", icon: "✕" },
  SUSPENDED: { label: "Askıya alındı", tone: "destructive", icon: "!" },
};

export const SERVICE_MODES: Record<string, string> = {
  DINE_IN: "Masaya servis",
  SELF_SERVICE: "Gel-al / self servis",
};

export const STAFF_ROLES: Record<string, string> = {
  OWNER: "İşletme sahibi",
  BRANCH_MANAGER: "Şube müdürü",
  MENU_EDITOR: "Menü editörü",
  WAITER: "Garson",
  KITCHEN_STAFF: "Mutfak personeli",
  VIEWER: "Görüntüleyici",
};

/** Personel oluştururken atanabilecek roller (OWNER hariç). */
export const ASSIGNABLE_ROLES = [
  "BRANCH_MANAGER",
  "MENU_EDITOR",
  "WAITER",
  "KITCHEN_STAFF",
  "VIEWER",
] as const;

export const IMPORT_STATES: Record<string, LabelEntry> = {
  PREVIEW: { label: "Önizleme", tone: "info", icon: "◐" },
  COMMITTED: { label: "Uygulandı", tone: "success", icon: "✓" },
  FAILED: { label: "Başarısız", tone: "destructive", icon: "✕" },
};

export const BATCH_STATES: Record<string, LabelEntry> = {
  PREVIEW: { label: "Önizleme", tone: "info", icon: "◐" },
  COMMITTED: { label: "Uygulandı", tone: "success", icon: "✓" },
  ROLLED_BACK: { label: "Geri alındı", tone: "neutral", icon: "↺" },
  PARTIAL_ROLLBACK: { label: "Kısmen geri alındı", tone: "warning", icon: "!" },
  CONFLICT: { label: "Çakışma", tone: "destructive", icon: "!" },
};

const FALLBACK: LabelEntry = { label: "Bilinmiyor", tone: "neutral", icon: "?" };

export function describe(
  map: Record<string, LabelEntry>,
  key: string | null | undefined,
): LabelEntry {
  if (!key) return FALLBACK;
  return map[key] ?? { label: key, tone: "neutral", icon: "•" };
}
