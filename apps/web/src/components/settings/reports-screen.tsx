"use client";

import { AdminScreen } from "../admin/admin-shell";
import { ReportsTab } from "./reports-tab";

export function ReportsScreen() {
  return (
    <AdminScreen
      title="Raporlar"
      description="Seçtiğin tarih aralığındaki sipariş hareketlerini incele."
      breadcrumb={[{ label: "Raporlar" }]}
    >
      <ReportsTab />
    </AdminScreen>
  );
}
