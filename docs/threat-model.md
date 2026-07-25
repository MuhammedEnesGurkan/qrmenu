# Tehdit modeli

Başlıca varlıklar: personel oturumu, tenant kataloğu, masa QR tokenı, sipariş
snapshot'ı ve abonelik entitlement'ı.

Öncelikli tehditler: IDOR/cross-tenant erişim, QR token sızıntısı veya tahmini,
istemci fiyat manipülasyonu, sipariş replay'i, eklenti guard atlama, CSV formula
injection, görsel polyglot ve webhook replay. Kontroller sırasıyla object scope,
256-bit token exchange, server-side pricing, idempotency, backend entitlement,
güvenli parser/re-encode ve imzalı BillingEvent'tir.

