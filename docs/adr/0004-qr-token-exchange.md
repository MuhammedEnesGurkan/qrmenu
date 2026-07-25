# ADR-0004: QR token exchange ve temiz yönlendirme

Durum: Kabul edildi.

Masa QR'ı en az 256-bit rastgele token taşır; veritabanında yalnız hash saklanır.
Exchange sonrası HttpOnly table session oluşturulur ve 303 ile tokensız URL'ye
gidilir. Böylece token history, referer, log ve analytics yüzeyinden çıkarılır.

