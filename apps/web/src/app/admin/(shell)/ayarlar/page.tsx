import { Suspense } from "react";
import { SettingsScreen } from "@/components/settings/settings-screen";

export const metadata = { title: "Ayarlar" };

export default function SettingsPage() {
  // useSearchParams içeren istemci ağacı için gerekli sınır.
  return (
    <Suspense>
      <SettingsScreen />
    </Suspense>
  );
}
