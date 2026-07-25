# Tehdit modeli

Başlıca varlıklar: personel oturumu, tenant kataloğu, masa QR tokenı, sipariş
snapshot'ı ve abonelik entitlement'ı.

Öncelikli tehditler: IDOR/cross-tenant erişim, QR token sızıntısı veya tahmini,
istemci fiyat manipülasyonu, sipariş replay'i, eklenti guard atlama, CSV formula
injection, görsel polyglot ve webhook replay. Kontroller sırasıyla object scope,
256-bit token exchange, server-side pricing, idempotency, backend entitlement,
güvenli parser/re-encode ve imzalı BillingEvent'tir.

## Kapatılan bulgular

| Tehdit | Uygulanan kontrol |
|---|---|
| Cross-tenant/branch IDOR | Her yönetim sorgusunda tenant + branch scope, OWNER-only branch switch |
| QR tahmini/sızıntısı | 256-bit token, hash-only saklama, 303 exchange, no-store/referrer ve atomik rotate |
| Fiyat/replay | Sunucu katalog fiyatı, snapshot, Idempotency-Key ve optimistic version |
| Yetki/eklenti atlama | En az yetkili rol matrisi ve backend `@RequiresAddon` |
| Dosya saldırıları | Görsel decode/re-encode; XLSX zip/formül/makro/dış-link limitleri; CSV escaping |
| Webhook replay | Constant-time HMAC ve provider event unique kaydı |
| Brute force/DoS | Login özel ve genel IP/path pencere rate-limit, multipart/row/pixel sınırları |
| Secret/supply chain | Repo secret taraması, prod fail-fast, CI test/build/container matrisi |
| Veri kaybı | S3-compatible object store, age şifreli dump, checksum ve izole restore runbook |

Kalan operasyonel riskler: in-memory rate-limit ve SSE tek instance kapsamlıdır;
çok instance rollout'ta edge rate-limit ile Redis/event bus zorunludur.
