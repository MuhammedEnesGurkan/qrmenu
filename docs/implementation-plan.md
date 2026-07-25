# Uygulama planı

## Başlangıç incelemesi

İnceleme tarihi: 25 Temmuz 2026.

Repo başlangıçta boştur: kaynak kod, paket manifesti, Git deposu, test veya
altyapı tanımı bulunmamıştır. Bu nedenle korunması gereken mevcut bir mimari ya
da çalışan kod yoktur.

Yerel araçlar:

| Araç | Bulunan sürüm | Proje hedefi |
|---|---:|---:|
| Java | 25.0.1 | Java 21 bytecode |
| Maven | 3.9.11 | 3.9+ |
| Node.js | 22.21.1 | 22 LTS+ |
| npm | 10.9.4 | 10+ |
| Docker | 29.1.2 | güncel |
| Docker Compose | 2.40.3 | v2 |

Başlangıç build/test sonucu: çalıştırılacak proje olmadığı için **uygulanamaz**.
Git kontrolü de `not a git repository` sonucu vermiştir. İlk gerçek baseline,
iskelet oluşturulduktan sonra bu belgenin sonundaki doğrulama günlüğüne yazılır.

## Hedef mimari

- `apps/api`: Java 21, Spring Boot 4.1, Maven, PostgreSQL, Flyway, Security,
  Validation, JPA, Actuator ve OpenAPI.
- `apps/web`: Next.js 16 App Router, React, strict TypeScript, Tailwind,
  TanStack Query, React Hook Form, Zod, Vitest ve Playwright.
- `infra`: Yalnız MinIO içeren Compose geliştirme ortamı; PostgreSQL Supabase'te.
- `docs`: ürün, güvenlik, domain ve karar kayıtları.

API tek deploy edilen modüler monolittir. Paket sınırları domain modülleridir;
bir modül başka modülün repository'sine bağlanmaz. Modüller application
service, event ve ilerleyen aşamada transactional outbox ile konuşur. Entity'ler
API'ye verilmez; immutable DTO kullanılır.

## Aşama 1 — Ücretsiz QR menü

1. Tenant, tek şube, menü, kategori, ürün ve fiyat şemasını migration ile kur.
2. Public slug sorgusunu salt-okunur DTO olarak sun; yalnız yayınlanmış, aktif,
   arşivlenmemiş ve sıralı içeriği döndür.
3. Admin katalog komutlarını tenant bağlamı ve permission kontrolüyle ekle.
4. Ürün ekleme, düzenleme, arşivleme, aktiflik, mevcutluk ve fiyat değişimini
   ayrı use-case'ler olarak uygula.
5. Kalıcı menü URL'si ve genel QR indirme servisini ekle.
6. Mobile-first public menü, ürün detay görünümü ve yazdırma stilini tamamla.
7. Asset yüklemeyi MIME sniffing, yeniden encode ve S3/MinIO ile tamamla.
8. Tenant izolasyonu, public filtreleme ve permission entegrasyon testlerini yaz.

## Aşama 2 — Kimlik ve yetki

1. Membership, role, permission şeması ve varsayılan rol seed'leri.
2. Argon2id parola, cookie oturumu, CSRF ve giriş rate-limit.
3. Merkezi permission evaluator ve branch scope.
4. Owner, menu editor, waiter, kitchen ve viewer endpoint testleri.
5. Personel ve rol/izin yönetim ekranları.

## Aşama 3 — Eklenti ve abonelik

1. AddonPlan, TenantAddon, AddonSubscription ve paket modelleri.
2. Süre duyarlı entitlement servisi ve `@RequiresAddon`.
3. Mock `SubscriptionProvider`, imzalı/idempotent webhook.
4. Trial, aktivasyon, dönem sonu iptal ve expiry job.
5. Owner-only eklenti mağazası; ücretler veritabanından.
6. Expiry sonrası yazma kapanması ve geçmiş verinin korunması testleri.

## Aşama 4 — Masadan sipariş

1. Area, DiningTable, 256-bit QR token hash ve atomik rotasyon.
2. Token exchange, HttpOnly TableSession cookie ve HTTP 303 temiz yönlendirme.
3. Sunucu fiyatlandırması, snapshot ve idempotent sipariş oluşturma.
4. Kilitli durum makinesi ve optimistic concurrency.
5. Garson paneli, çağrılar, SSE ve transactional outbox.
6. Tenant/token/log sızıntısı güvenlik testleri.

## Aşama 5 — Mutfak ve self-servis

1. Kabul sonrası mutfak kuyruğu ve istasyon yönlendirmesi.
2. İstasyonların tamamlanmasına bağlı READY kuralı.
3. PII içermeyen benzersiz teslim numarası ve public hazır ekranı.
4. Tablet/büyük ekran erişilebilirlik ve Playwright senaryoları.

## Aşama 6 — Katalog Pro

1. Güvenli CSV/XLSX parser ve iki aşamalı preview/commit.
2. Import hash/idempotency, satır sonuçları ve limitler.
3. Toplu fiyat preview, transaction ve PriceChangeBatch.
4. Sonradan değişmiş fiyatı ezmeyen conflict-aware rollback.
5. CSV export ve formula injection koruması.

## Aşama 7 — İlave eklentiler

1. Çoklu dil ve eksik çeviri uyarıları.
2. Ödeme/ciro iddiası içermeyen gelişmiş operasyon raporları.
3. Çoklu şube limitleri ve branch scope.
4. Güvenli yapılandırılmış marka seçenekleri.

## Aşama 8 — Production hazırlığı

1. Threat model bulgularını kapat, rate limits ve header'ları sertleştir.
2. Testcontainers, ArchUnit, Vitest ve Playwright matrisini CI'a bağla.
3. Container hardening, secrets, gözlemlenebilirlik ve health check.
4. Şifreli backup/restore tatbikatı ve operasyon runbook'ları.
5. Erişilebilirlik, 320–412 px ve hedef tarayıcı testlerini tamamla.

## Ücretsiz QR menü boşlukları

Başlangıçta tüm fonksiyonlar eksikti. Aşama 1 iskeleti; public menü DTO'su,
kalıcı slug, tenantlı şema, demo içerik ve responsive menüyü kapsar. Admin CRUD,
görsel pipeline, gerçek QR dosyası, yayın workflow'u ve uçtan uca testler kalan
işlerdir.

## Eklenti sistemi boşlukları

Addon planı, entitlement, abonelik, paket, provider adapter, webhook,
`@RequiresAddon`, expiry scheduler ve mağaza arayüzünün tamamı başlangıçta
eksiktir. Bunlar Aşama 3'te, ücretli endpoint yazılmadan önce tamamlanacaktır.

## Yetki ve güvenlik bulguları

Başlangıçta authentication, authorization, tenant izolasyonu, CSRF, CORS,
güvenlik header'ları, rate-limit ve audit yoktur. Public allow-list ve güvenlik
header'ları Aşama 1'de; personel cookie oturumu, permission matrisi ve object
scope Aşama 2'de devreye alınır. Admin yazma endpoint'leri gerçek auth gelene
kadar production profilinde kapalı tutulmalıdır.

## Responsive gereksinimler

- 320, 360, 375, 390 ve 412 px'de yatay taşma olmamalı.
- Dokunma hedefleri en az 44×44 px ve odak göstergeleri görünür olmalı.
- Menü mobile-first; tablet/desktop'ta içerik genişliği sınırlandırılmalı.
- iOS safe-area, azaltılmış hareket, baskı stili ve klavye erişimi desteklenmeli.
- Personel PWA manifest/service worker altyapısı ve offline sınırları açık olmalı.

## Doğrulama günlüğü

- 25 Temmuz 2026: PostgreSQL Compose'tan kaldırıldı; Supabase JDBC, SSL, düşük
  bağlantı havuzu ve RLS migration yapılandırması eklendi.
- API: 3 test geçti (MVC güvenlik/public menü ve ArchUnit).
- Web: 1 Vitest testi geçti, TypeScript kontrolü ve Next.js production build
  başarılı. Production ve toplam npm audit sonucu 0 açık.
- Compose config yalnız MinIO servisi içeriyor; yerel PostgreSQL başlatılmadı.
