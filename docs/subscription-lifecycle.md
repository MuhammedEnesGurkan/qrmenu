# Abonelik yaşam döngüsü

Durumlar: `INACTIVE`, `TRIAL`, `ACTIVE`, `PAST_DUE`, `CANCELLED`, `EXPIRED`,
`SUSPENDED`.

Provider adapter ticari işlemi yapar, imzalı webhook idempotent BillingEvent
olarak işlenir, sonra entitlement güncellenir. Dönem sonu iptal mevcut dönemde
erişimi korur. Expiry yeni ücretli yazmayı kapatır ama geçmiş veriyi silmez.

