# ADR-0002: Modüler monolit

Durum: Kabul edildi.

İlk ürünün operasyonel karmaşıklığını düşük tutmak için mikroservis yerine paket
sınırları ArchUnit ile korunan tek API seçildi. Gerekli asenkron güvenilirlik
transactional outbox ile sağlanır.

