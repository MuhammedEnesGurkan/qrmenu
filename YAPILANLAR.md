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

- Mutfak istasyonları ve self-servis ekranları
- Raporlama, çoklu dil ve production deployment

## 25 Temmuz 2026 — Masa QR, sipariş ve garson akışı

- Alan ve masa yönetimi, kapasite, 256-bit rastgele QR tokenı ve yalnız
  SHA-256 hash saklama modeli Supabase Flyway V7 ile uygulandı.
- QR rotasyonu tek transaction’da önceki tokenı kapatıyor; yeni QR’ın raw
  değeri yalnız oluşturma/yenileme cevabında ve indirilebilir PNG içinde bir
  kez gösteriliyor.
- `/q/{token}` akışı tokenı sunucuda değiştirip HttpOnly, kısa ömürlü
  `MASA_TABLE` ve ayrı CSRF cookie’si oluşturuyor; 303 ile tokensız
  `/siparis` adresine yönlendiriyor.
- Token exchange yanıtına `no-store` ve `no-referrer` uygulandı; eski QR’ın
  rotasyon sonrasında 404 olması doğrulandı.
- Müşteri menüsü, erişilebilir adet kontrolleri, sepet, sunucu fiyatlı sipariş
  ve garson çağırma ekranları tamamlandı.
- Sipariş fiyatı ve ürün adı sipariş anında aktif katalogdan sunucuda
  snapshot’lanıyor; istemci toplamına güvenilmiyor.
- Idempotency-Key ile aynı siparişin tekrar oluşturulması engellendi; sipariş
  ve ürün satırları tenant/table-session kapsamıyla korunuyor.
- SUBMITTED → ACCEPTED → PREPARING → READY → SERVING → DELIVERED allow-list
  durum makinesi, rol izni ve optimistic version kontrolü eklendi.
- Garson çağrılarında PENDING → ACKNOWLEDGED → RESOLVED akışı ve sipariş/çağrı
  outbox event kayıtları eklendi.
- `/admin/masalar` ve `/admin/siparisler` operasyon ekranları eklendi; eklenti
  süresi dolduğunda geçmiş okuma korunurken yeni ücretli yazmalar guard
  tarafından kapanıyor.
- Müşteri ekranında tutarın tahmini olduğu ve ödeme/POS/mali belge olmadığı
  açıkça belirtildi.
- API testleri 5/5, TypeScript, Vitest 1/1 ve Next.js production build
  başarılı. Supabase smoke testinde exchange 303, server-side toplam,
  idempotency, ACCEPTED geçişi, garson çağrısı, rotasyon ve eski token iptali
  birlikte doğrulandı.

## 25 Temmuz 2026 — Eklenti ve abonelik çekirdeği

- TABLE_ORDERING, SELF_SERVICE, CATALOG_PRO, MULTILINGUAL, ADVANCED_REPORTS,
  MULTI_BRANCH, BRANDING ve KITCHEN_STATIONS planları veritabanı fiyatlarıyla
  seed edildi.
- AddonPlan, AddonSubscription, TenantAddon ve idempotent BillingEvent
  tabloları Supabase Flyway V6 ile uygulandı; tümünde RLS ve istemci rol
  erişim engeli etkin.
- INACTIVE, TRIAL, ACTIVE, PAST_DUE, CANCELLED, EXPIRED ve SUSPENDED yaşam
  döngüsü; deneme süresi, dönem sonu iptal ve optimistic version alanları
  eklendi.
- Backend’de süre ve durum denetleyen merkezi entitlement servisi ile
  `@RequiresAddon` AOP guard’ı hazırlandı.
- Süresi dolan trial/abonelikleri EXPIRED yapıp yalnız yeni ücretli yazmaları
  kapatan scheduler eklendi; tenant verileri silinmiyor.
- Mock provider referansı, raw-body HMAC-SHA256 doğrulaması ve provider/event
  kimliğine göre idempotent webhook işleme tamamlandı.
- Eklenti mağazası owner paneline bağlandı; plan fiyatı/durumu, trial başlatma
  ve dönem sonunda iptal seçenekleri sunuluyor.
- Spring Boot 4.1’in resmi `spring-boot-starter-aspectj` modülü kullanıldı.
- API testleri 5/5 geçti. Supabase smoke testinde sekiz plan, trial, dönem sonu
  iptal, imzalı ACTIVE webhook’u ve aynı event’in ikinci kez işlenmemesi
  doğrulandı.

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

+## 25 Temmuz 2026 — Mutfak istasyonları ve self-servis

- Supabase Flyway V8 ile şube public hazır ekranı slug’ı, mutfak istasyonları,
  kategori-istasyon eşlemesi, sipariş kalemi mutfak durumu ve açık teslim
  numarası tekillik kuralı eklendi.
- SELF_SERVICE siparişleri için sunucuda PII içermeyen teslim numarası üretiliyor;
  müşteri ekranında servis biçimi seçimi ve teslim numarası gösterimi tamamlandı.
- Kabul edilen siparişlerin kategoriye göre etkin istasyona atomik yönlendirilmesi
  sağlandı; eşleşmeyen kategori varsa kabul transaction’ı güvenli biçimde geri
  alınıyor.
- İstasyon kuyruğunda QUEUED → PREPARING → DONE akışı ve tüm kalemler
  tamamlandığında masaya serviste READY, self-serviste READY_FOR_PICKUP kuralı
  uygulandı.
- `/admin/mutfak` tablet ekranı ve PII göstermeyen, dört saniyede yenilenen
  `/hazir/{subeSlug}` büyük hazır numarası ekranı eklendi.
- Eklenti süresi dolduğunda yeni ücretli yazmalar kapanırken sipariş ve çağrı
  geçmişinin salt okunur erişimi korunacak şekilde read guard’ları düzeltildi.
- API testleri 5/5, web Vitest 1/1, TypeScript ve Next.js production build
  başarılı. V8 Supabase’e uygulandı.
- Gerçek Supabase smoke testinde QR exchange 303, sunucu fiyatlandırması, benzersiz
  teslim numarası, istasyon yönlendirmesi, PREPARING/DONE ve public hazır ekranında
  READY_FOR_PICKUP görünümü birlikte doğrulandı.

## Kayıt kuralı

Her yeni aşamada bu belgeye aşağıdakiler eklenecektir:

1. Tarih ve aşama adı
2. Eklenen veya değiştirilen özellikler
3. Veritabanı/migration değişiklikleri
4. Çalıştırılan test ve build sonuçları
5. Bilinen eksikler ve sonraki adım
