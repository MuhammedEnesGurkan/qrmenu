"use client";

import { AdminShell } from "../admin/admin-shell";
import { ReportsTab } from "./reports-tab";

export function ReportsScreen() {
  return (
    <AdminShell
      title="Raporlar"
      description="Seçtiğin tarih aralığındaki sipariş hareketlerini incele."
      breadcrumb={[{ label: "Raporlar" }]}
    >
      <ReportsTab />
    </AdminShell>
  );
}
