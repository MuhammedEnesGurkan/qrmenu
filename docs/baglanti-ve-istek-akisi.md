# Bağlantı, istek ve teknoloji haritası

Bu belge MasaAkış'ın hangi parçadan hangi parçaya, hangi adres ve protokolle
istek gönderdiğini gösterir. Gerçek parola, Supabase proje referansı ve erişim
anahtarları repoda tutulmaz; aşağıdaki değerler ortam değişkenlerinden gelir.

## Sistem haritası

```text
Kullanıcının tarayıcısı
        |
        | HTTPS / sayfalar ve /backend/*
        v
Next.js web uygulaması :3000
        |
        | HTTP(S), API_URL + /api/*
        v
Spring Boot API :8080
        |                         |
        | PostgreSQL JDBC + TLS   | S3 API + TLS
        v                         v
Supabase PostgreSQL          S3-compatible object storage
        ^                    (production) / MinIO (development)
        |
        | pg_dump / pg_restore (yalnız operasyon runner'ı)
        |
Şifreli backup ve izole restore araçları

Abonelik sağlayıcısı -- HTTPS POST + HMAC --> Spring webhook endpoint'i
```

Tarayıcı Supabase'e, PostgreSQL'e veya object storage'a doğrudan bağlanmaz.
Supabase `anon`, `authenticated` ve `service_role` rollerinin uygulama
tablolarına doğrudan erişimi kapalıdır. Tenant ve şube kapsamı yalnız doğrulanmış
Spring oturumundan türetilir.

## Çalışan parçalar ve teknolojiler

| Parça | Teknoloji | Görevi |
|---|---|---|
| Web | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS | Sayfalar, SSR, tarayıcı bileşenleri ve API proxy |
| Web veri doğrulama | Zod | Public menü API yanıtını çalışma anında doğrular |
| API | Java 21, Spring Boot 4.1, Spring MVC | REST endpoint'leri ve iş kuralları |
| Güvenlik | Spring Security, Argon2id, HttpOnly cookie, CSRF, rate-limit | Kimlik, yetki, tenant/branch kapsamı ve istek koruması |
| Veri erişimi | PostgreSQL JDBC, Spring `JdbcClient`, JPA/Hibernate | Supabase PostgreSQL sorguları ve transaction yönetimi |
| Şema | Flyway V1–V11 | Tablo, constraint, index, seed ve RLS migration'ları |
| Veritabanı | Supabase PostgreSQL | Kalıcı uygulama verisi; yerel PostgreSQL kullanılmaz |
| Görsel deposu | MinIO Java SDK üzerinden S3-compatible API | Güvenli PNG nesnelerini production'da dış object store'a yazar |
| Gerçek zaman | Server-Sent Events (SSE) | Sipariş değişikliklerini personel ekranına iletir |
| Dosyalar | Apache POI | Güvenli XLSX içe aktarma |
| QR | ZXing | Menü ve masa QR PNG üretimi |
| Test | JUnit, MockMvc, ArchUnit, Testcontainers, Vitest, Playwright | API, mimari, migration, web ve tarayıcı doğrulaması |
| Paketleme | Docker, Docker Compose, GitHub Actions | Non-root image, production çalışma tanımı ve CI |

## Adresler ve ortam değişkenleri

| Bağlantı | Geliştirme | Production kaynağı |
|---|---|---|
| Tarayıcı → web | `http://localhost:3000` | Deployment'ın HTTPS alan adı |
| Web → API | `API_URL=http://localhost:8080` | Web container'ında private API servis adresi |
| API → Supabase | `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` | Platform secret manager |
| API → object store | `OBJECT_STORAGE_ENDPOINT`, access key, secret key, bucket | Platform secret manager |
| İzin verilen web origin'i | `WEB_ORIGIN=http://localhost:3000` | Web'in public HTTPS origin'i |
| QR yönlendirme tabanı | `PUBLIC_BASE_URL=http://localhost:3000` | Web'in public HTTPS adresi |

Next.js yapılandırmasındaki rewrite:

```text
Tarayıcı: /backend/api/admin/catalog
Next.js:  API_URL + /api/admin/catalog
Yerel:    http://localhost:8080/api/admin/catalog
```

Bu sayede tarayıcı backend host'unu bilmez, cookie'ler web origin'inde kalır ve
production'da API public internete açılmadan private servis olarak çalışabilir.

## İstek türleri

### 1. Public menü

```text
Tarayıcı GET /m/{slug}
  → Next.js Server Component
  → GET API_URL/api/public/menus/{slug}?locale=tr
  → Spring PublicMenuController
  → Supabase PostgreSQL
  → yayınlanmış public DTO
  → Next.js HTML
```

Next.js sunucu tarafı bu cevabı 30 saniyelik revalidation ile alır. API yanıtı
Zod ile doğrulanır. Geliştirmede yalnız `demo-kafe` için API ulaşılamazsa gömülü
demo veri fallback'i vardır; production'da fallback kullanılmaz.

### 2. Yönetici kaydı, giriş ve yönetim çağrıları

```text
POST /backend/api/auth/login
  → Next rewrite
  → POST /api/auth/login
  → Argon2id parola kontrolü
  → Supabase staff/session kayıtları
  ← MASA_SESSION (HttpOnly) + MASA_CSRF cookie

PATCH /backend/api/admin/catalog/products/{id}/price
  → MASA_SESSION cookie + X-CSRF-Token header
  → session doğrulama
  → permission + tenant + aktif branch kontrolü
  → transaction ve optimistic version kontrolü
  → Supabase UPDATE
```

Tarayıcıdaki `admin-api.ts`, GET dışındaki çağrılarda okunabilir `MASA_CSRF`
cookie'sini `X-CSRF-Token` header'ına koyar. Oturum tokenı JavaScript tarafından
okunamaz; tarayıcı `HttpOnly` cookie'yi `credentials: include` ile kendisi yollar.

### 3. Masa QR ve sipariş

```text
Kamera/tarayıcı GET /q/{rawToken}
  → Next.js Route Handler
  → GET API_URL/api/public/table/exchange/{rawToken}
  → Spring yalnız token hash'ini Supabase'te arar
  ← 303 + MASA_TABLE (HttpOnly) + MASA_TABLE_CSRF
  → Next raw tokenı URL'den atar
  → 303 /siparis

POST /backend/api/table/orders
  → MASA_TABLE + X-CSRF-Token + Idempotency-Key
  → sunucuda ürün/mevcutluk/fiyat kontrolü
  → sipariş ve fiyat snapshot'ı Supabase'e yazılır
```

Raw QR tokenı veritabanında ve uygulama logunda saklanmaz. QR değişimi ve hassas
yanıtlar `no-store` ve `no-referrer` kullanır.

### 4. Personel sipariş ekranı

```text
EventSource GET /backend/api/admin/order-events
  → Spring SSE bağlantısı
  ← transaction commit sonrasında `order` olayı
  → ekran GET /api/admin/orders ve waiter-calls verisini yeniler
```

SSE koparsa ekran 15 saniyelik polling ile devam eder. Mutfak kuyruğu 5 saniye,
public hazır numarası ekranı 4 saniye aralıkla yenilenir.

### 5. Görsel yükleme ve okuma

```text
POST multipart /backend/api/admin/assets
  → en fazla 5 MB
  → ImageIO ile decode, piksel/boyut kontrolü ve metadata'sız PNG re-encode
  → SHA-256 ile tenant içinde tekilleştirme
  → S3-compatible object storage'a tenant/hash.png
  → Supabase asset_object tablosuna metadata + object_key

GET /api/public/assets/{uuid}
  → Next public asset rewrite
  → Supabase'ten metadata/object_key
  → object storage'dan PNG
  ← immutable cache + ETag
```

`OBJECT_STORAGE_ENABLED=false` yalnız geliştirme fallback'idir ve PNG binary'sini
Supabase tablosunda tutar. `prod` profili object storage kapalıysa başlamaz.

### 6. Abonelik webhook'u

```text
Sağlayıcı POST /api/webhooks/subscriptions
  → raw body + signature header
  → HMAC-SHA256 constant-time doğrulama
  → provider/event kimliğine göre idempotency
  → abonelik ve entitlement transaction'ı
```

Webhook internetten Spring API'ye ulaşabilen kontrollü tek endpoint'tir. Secret
yalnız deploy ortamından gelir; webhook body veya secret loglanmaz.

## Endpoint grupları

| Grup | Örnekler | Kimlik |
|---|---|---|
| `/api/public/menus`, `/assets`, `/pickups` | Menü, görsel, hazır numarası | Public, salt okuma |
| `/api/public/table/exchange` | QR tokenını kısa oturuma çevirir | Tek kullanımlık/geçerli QR tokenı |
| `/api/auth` | Register, login, me, logout | Login/register public; me/logout personel cookie |
| `/api/admin/catalog` | Menü, kategori, ürün, fiyat, yayın ve QR | Personel cookie + CSRF + permission |
| `/api/admin/staff` | Personel ve rol yönetimi | Membership yönetme izni |
| `/api/admin/addons` | Plan, trial ve iptal | Owner/entitlement kuralları |
| `/api/admin/tables`, `/orders`, `/kitchen` | Masa, sipariş, çağrı ve istasyon | İlgili operasyon izni |
| `/api/admin/catalog-pro` | CSV/XLSX, export, toplu fiyat | CATALOG_PRO entitlement + izin |
| `/api/admin/features` | Şube, dil, marka ve rapor | İlgili addon entitlement + izin |
| `/api/table` | Masa menüsü, sipariş ve garson çağrısı | Masa cookie + yazmalarda CSRF |
| `/api/webhooks/subscriptions` | Abonelik sağlayıcısı olayı | HMAC signature |
| `/actuator/health/*` | Liveness ve Supabase readiness | Public operasyon probe'u |

Tam yöntem ve request/response şemaları çalışan uygulamada `/v3/api-docs` ve
geliştirmede `/swagger-ui.html` üzerinden görülebilir.

## API içindeki işlem sırası

Bir istek Spring'e ulaştığında genel sıra şöyledir:

1. `RequestMetadataFilter` güvenli `X-Request-Id` üretir veya doğrular.
2. `ApiRateLimitFilter` IP, yöntem ve path grubuna göre limiti uygular.
3. `SessionAuthenticationFilter` personel cookie'sinin hash'ini Supabase'te
   bulup `StaffPrincipal` oluşturur.
4. Yazma isteğinde `CsrfProtectionFilter` cookie/header eşleşmesini doğrular.
5. Controller request doğrulamasını yapar ve application service'i çağırır.
6. Service permission, tenant/branch object scope ve gerekiyorsa addon
   entitlement kontrolünü yapar.
7. JDBC/JPA transaction Supabase'e uygulanır; olaylar outbox'a yazılır.
8. Commit sonrasında SSE olayı yayınlanır; cevap request-id ile döner.

## İlgili kaynak dosyaları

- Web proxy ve public asset rewrite: `apps/web/next.config.ts`
- Yönetim istemcisi: `apps/web/src/lib/admin-api.ts`
- Masa istemcisi: `apps/web/src/lib/table-api.ts`
- Public menü SSR: `apps/web/src/lib/menu.ts`
- QR route handler: `apps/web/src/app/q/[token]/route.ts`
- API bağlantı ayarları: `apps/api/src/main/resources/application.yaml`
- Spring güvenlik zinciri: `apps/api/src/main/java/com/masaakis/security/SecurityConfiguration.java`
- Production servis haritası: `infra/compose.production.yaml`
- Ortam değişkeni şablonu: `.env.example`
