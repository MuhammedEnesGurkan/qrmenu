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
- İşletme sahibi kayıt/giriş/çıkış ve oturum sorgulama
- Argon2id parola, hashlenmiş sunucu oturumu, CSRF ve giriş rate-limit
- Tenant/şube bağlı üyelik, personel rolleri ve audit kaydı

## 25 Temmuz 2026 — Kimlik, oturum ve yetkilendirme

- İşletme kaydının tenant, merkez şube, yayınlanmamış ilk menü ve OWNER
  üyeliğini tek transaction içinde oluşturması sağlandı.
- E-posta/parola girişi, mevcut oturumu sorgulama ve güvenli çıkış endpoint’leri
  eklendi.
- Parolalar Argon2id ile; oturum ve CSRF değerleri yalnız SHA-256 hash olarak
  veritabanında saklanacak şekilde tasarlandı.
- `HttpOnly` personel oturum cookie’si, ayrı CSRF cookie/header doğrulaması,
  SameSite ve production Secure cookie seçenekleri eklendi.
- Giriş denemelerine IP ve e-posta bazlı bellek içi rate-limit uygulandı.
- OWNER, BRANCH_MANAGER, MENU_EDITOR, WAITER, KITCHEN_STAFF ve VIEWER
  rollerinin en az yetki izin setleri tanımlandı.
- Kimlik tabloları, üyelik, oturum ve audit log için Supabase Flyway V4
  migration’ı uygulandı; RLS etkinleştirildi ve istemci rollerinin doğrudan
  tablo erişimi kaldırıldı.
- Spring Security stateless zinciri, CORS credentials, özel oturum filtresi ve
  CSRF filtresiyle tamamlandı; filtrelerin servlet zincirine çift kaydı
  engellendi.
- API testleri 5/5 geçti; Supabase üzerinde kayıt → `/me` → CSRF korumalı
  çıkış smoke senaryosu başarıyla doğrulandı.

## Henüz tamamlanmayan ana modüller

- Eklenti ve abonelik sistemi
- Masadan sipariş, garson ve mutfak ekranları
- Raporlama, çoklu dil ve production deployment

## 25 Temmuz 2026 — Admin katalog, görsel, QR ve personel

- `/admin/kayit`, `/admin/giris` ve oturum kontrollü `/admin` sayfaları
  tamamlandı; ana sayfaya yönetici bağlantıları eklendi.
- Tenant ve şube kapsamlı kategori oluşturma/düzenleme/gizleme/arşivleme
  akışları eklendi.
- Ürün oluşturma, bilgi düzenleme, aktiflik, mevcut/tükendi, arşivleme ve
  optimistic version kontrollü fiyat güncelleme akışları tamamlandı.
- Boş menünün yayınlanmasını engelleyen yayınla/yayından kaldır iş akışı ve
  kalıcı public menü bağlantısı admin paneline bağlandı.
- Genel menü adresini kullanan 768×768 PNG QR üretimi ve indirmesi eklendi;
  QR içinde geçici token veya tenant kimliği bulunmuyor.
- Görseller dosya uzantısı/MIME beyanına güvenmeden decode edilip boyut ve
  piksel limitlerinden geçiriliyor, metadata’dan arındırılmış PNG olarak
  yeniden kodlanıyor ve SHA-256 ile tekilleştiriliyor.
- Asset, katalog yayın zamanı ve ürün version alanları Supabase Flyway V5 ile
  uygulandı; asset tablosunda RLS ve doğrudan istemci erişim engeli etkin.
- Personel listeleme, oluşturma, rol atama ve devre dışı bırakma API/paneli
  eklendi; yönetici kendi hesabını kapatamıyor ve rol yükseltme sınırları
  backend tarafından denetleniyor.
- Next.js aynı-origin backend rewrite ile cookie oturumlarını production’a
  uygun biçimde taşıyor; CSRF header istemci yardımcı katmanında merkezi.
- API testleri 5/5, TypeScript kontrolü, Vitest 1/1 ve Next.js production build
  başarılı.
- Supabase smoke testlerinde kategori → ürün → fiyat → yayın → QR zinciri ile
  OWNER’ın WAITER oluşturması, WAITER’ın okuması ve katalog yazmasının 403
  ile engellenmesi doğrulandı.

## Kayıt kuralı

Her yeni aşamada bu belgeye aşağıdakiler eklenecektir:

1. Tarih ve aşama adı
2. Eklenen veya değiştirilen özellikler
3. Veritabanı/migration değişiklikleri
4. Çalıştırılan test ve build sonuçları
5. Bilinen eksikler ve sonraki adım
