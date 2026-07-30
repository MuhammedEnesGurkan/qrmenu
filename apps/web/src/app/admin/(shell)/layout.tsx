import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Yönetim kabuğu rota değişimlerinde yerinde kalsın diye layout seviyesinde
 * kurulur. Aksi halde her gezinmede sidebar/üst bar yeniden mount olur,
 * oturum bilgisi tekrar çekilir ve sayfa geçişi animasyonu mümkün olmaz.
 *
 * Giriş/kayıt ekranları bu kabuğun dışındadır: kendi route grubu yok ama
 * AdminShell oturum yoksa /admin/giris'e yönlendirdiği için bu sayfalar
 * kabuğu hiç render etmez.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
