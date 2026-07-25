# Sipariş durum makinesi

Masadan sipariş: `SUBMITTED → ACCEPTED → PREPARING → READY → SERVING →
DELIVERED`. Reddetme yalnız uygun erken durumdan, iptal ayrı talep akışıyla
yapılır. `SUBMITTED` mutfak iş listesine girmez.

Self-servis: `SUBMITTED → ACCEPTED → PREPARING → READY_FOR_PICKUP → PICKED_UP`.
Geçişler backend'de allow-list, permission ve optimistic lock ile doğrulanır.
READY/SERVING dışından DELIVERED geçişi yoktur.

