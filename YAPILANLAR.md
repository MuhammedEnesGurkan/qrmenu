# Yapılanlar

Bu belge MasaAkış QR menü projesinde tamamlanan çalışmaları kronolojik olarak
kaydeder. Bundan sonraki her geliştirme aşamasında değişiklikler, doğrulama
sonuçları ve varsa kalan işler bu dosyaya eklenecektir.

## 25 Temmuz 2026 — Proje temeli

- Java 21 hedefli Spring Boot 4.1 modüler monolit API iskeleti oluşturuldu.
- Next.js 16 App Router, React ve TypeScript web uygulaması oluşturuldu.
- Tenant, şube, menü, kategori ve ürün domain modeli hazırlandı.
- Flyway ile temel katalog şeması ve demo menü migration'ları yazıldı.
- Public menü endpoint'i eklendi:
  `GET /api/public/menus/{slug}`
- Health endpoint'i eklendi:
  `GET /actuator/health`
- Public endpoint allow-list, CORS ve temel güvenlik header'ları eklendi.
- ArchUnit modül sınırı testi ve public menü MVC testleri yazıldı.
- Ürün kapsamı, domain modeli, güvenlik, izin matrisi, abonelik, sipariş durum
  makinesi ve deployment kararları `docs/` altında belgelendi.

## 25 Temmuz 2026 — Public QR menü arayüzü

- Mobile-first public menü sayfası hazırlandı:
  `/m/{slug}`
- Demo menü, kategoriler, ürünler, fiyat ve alerjen bilgileri gösterildi.
- Para biçimlendirme ve API yanıtı için Zod doğrulaması eklendi.
- Responsive tasarım, safe-area, yazdırma ve erişilebilir dokunma hedefleri
  tanımlandı.
- PWA manifest, ikon ve service worker kayıt altyapısı eklendi.
- Vitest birim testi ve Playwright responsive senaryosu oluşturuldu.
- Vitest'in Playwright senaryolarını toplamaması için test alanları ayrıldı.

## 25 Temmuz 2026 — Supabase geçişi

- Yerel PostgreSQL varsayılanı tamamen kaldırıldı.
- Docker Compose içinden PostgreSQL servisi ve volume'u çıkarıldı; yalnız
  geliştirme amaçlı MinIO bırakıldı.
- Spring datasource yapılandırması Supabase JDBC değişkenlerini zorunlu
  kullanacak hale getirildi.
- SSL, düşük Hikari bağlantı havuzu ve bağlantı zaman aşımı ayarları eklendi.
- Yerel `.env` dosyasının Spring Boot tarafından isteğe bağlı okunması
  sağlandı.
- Gerçek `.env` ve `apps/web/.env.local` dosyaları Git dışında bırakıldı.
- Supabase Session pooler bağlantısının bu ağda protokol zaman aşımına uğraması
  nedeniyle yerel test bağlantısı Transaction pooler `6543` ve
  `prepareThreshold=0` ile yapılandırıldı.
- Supabase `public` şemasındaki uygulama tablolarında RLS etkinleştirildi.
- `anon`, `authenticated` ve `service_role` rollerinin uygulama
  tablolarına doğrudan erişimi kaldırıldı.
- Automatic RLS event trigger nedeniyle boş sayılmayan yeni Supabase şeması için
  Flyway baseline sürümü güvenli biçimde `0` olarak ayarlandı.
- Flyway V1, V2 ve V3 migration'ları Supabase'e başarıyla uygulandı.

## 25 Temmuz 2026 — Spring Boot 4 uyumluluk düzeltmeleri

- Ayrıştırılmış Web MVC ve Security test starter bağımlılıkları eklendi.
- Spring Boot 4'te ayrı modüle taşınan Flyway starter eklendi.
- Hibernate `MultipleBagFetchException` hatası, kategori ve ürün
  koleksiyonlarının aynı sorguda birlikte fetch edilmesi engellenerek
  düzeltildi.
- Public menü sorgusu transaction içinde ürünleri güvenli biçimde lazy-load
  edecek şekilde düzenlendi.

## 25 Temmuz 2026 — Doğrulama

- API testleri: 3 test başarılı.
- Web birim testi: 1 test başarılı.
- TypeScript typecheck başarılı.
- Next.js production build başarılı.
- npm audit sonucu: 0 güvenlik açığı.
- Docker Compose config doğrulandı; yerel PostgreSQL referansı kalmadı.
- Supabase migration sonucu: şema sürümü V3.
- Backend health sonucu: `UP`.
- Public API sonucu: `Demo Kafe`, 2 kategori.
- Web uçtan uca kontrolü: HTTP 200 ve Demo Kafe içeriği doğrulandı.

## 25 Temmuz 2026 — Git ve GitHub yayını

- Yerel proje `main` branch'iyle Git deposuna dönüştürüldü.
- GitHub remote'u `MuhammedEnesGurkan/qrmenu` olarak tanımlandı.
- Uzak reponun boş olduğu push öncesinde doğrulandı.
- `.env`, `.env.local`, loglar, Maven/npm cache'leri, build çıktıları ve
  TypeScript build cache dosyaları Git dışında bırakıldı.
- Staged içerik gerçek Supabase proje referansı, parola ve private key
  desenlerine karşı tarandı; gizli bilgi bulunmadı.
- Proje kaynakları, migration'lar ve belgeler doğrudan `main` branch'ine
  pushlandı.

## Şu anda çalışan kapsam

- Public QR menü ana sayfası
- Slug ile kalıcı menü adresi
- Yayınlanmış ve aktif katalog içeriği
- Supabase PostgreSQL bağlantısı ve Flyway migration'ları
- Responsive Next.js menü arayüzü
- Temel API güvenliği ve health kontrolü

## Henüz tamamlanmayan ana modüller

- Admin giriş, kayıt ve oturum yönetimi
- İşletme ve şube kurulum akışı
- Admin kategori, ürün ve fiyat CRUD ekranları
- Menü yayınlama iş akışı
- Ürün görsel yükleme
- QR üretme ve indirme
- Personel, rol ve izin yönetimi
- Eklenti ve abonelik sistemi
- Masadan sipariş, garson ve mutfak ekranları
- Raporlama, çoklu dil ve production deployment

## Kayıt kuralı

Her yeni aşamada bu belgeye aşağıdakiler eklenecektir:

1. Tarih ve aşama adı
2. Eklenen veya değiştirilen özellikler
3. Veritabanı/migration değişiklikleri
4. Çalıştırılan test ve build sonuçları
5. Bilinen eksikler ve sonraki adım
