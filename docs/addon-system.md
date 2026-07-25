# Eklenti sistemi

Eklentiler dışarıdan kod yüklenen plugin değildir. `AddonPlan` satış
yapılandırmasını, `AddonSubscription` ticari yaşam döngüsünü, `TenantAddon`
etkin entitlement'ı temsil eder.

Backend guard; tenant, addon kodu, durum, başlangıç, trial ve bitiş zamanını her
yazma işleminde değerlendirir. UI bu yanıtı yalnız deneyimi düzenlemek için
kullanır. Aktif olmayan ücretli endpoint `403 ADDON_NOT_ACTIVE` döndürür.

