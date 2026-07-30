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

## Uygulama kapsamı durumu

- Planlanan ürün modülleri tamamlandı; kalan işler uygulama geliştirmesi değil,
  hedef platformda secret tanımlama, image yayınlama ve periyodik operasyon
  tatbikatlarıdır.

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

## 25 Temmuz 2026 — Mutfak istasyonları ve self-servis

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

## 25 Temmuz 2026 — Katalog Pro içe aktarma ve toplu fiyat

- Supabase Flyway V9 ile hash-idempotent import job/satırları ve
  PriceChangeBatch/PriceChangeItem snapshot tabloları eklendi; RLS ve doğrudan
  istemci erişim engeli etkinleştirildi.
- 5 MB ve 5000 satır limitli CSV/XLSX önizleme → onay akışı tamamlandı; hatalı
  satırlar katalog transaction’ına girmiyor ve aynı dosya hash’i aynı işi dönüyor.
- Dosya biçimi istemci MIME beyanına güvenmeden içerikten doğrulanıyor; UTF-8
  hataları, XLSX zip bombası, aşırı entry, dış bağlantı, makro ve formül hücreleri
  reddediliyor.
- Apache POI 5.5.1 ile gerçek XLSX okuma ve formül reddi otomatik testi eklendi.
- CSV dışa aktarmada =, +, - ve @ ile başlayan hücrelere spreadsheet formula
  injection koruması uygulandı.
- SET, ADD ve PERCENT toplu fiyat önizleme/onay akışı eklendi; optimistic version
  kontrolü önizleme sonrası değişiklikleri engelliyor.
- Geri alma yalnız ürün hâlâ batch’in uyguladığı fiyat ve version’daysa eski
  değeri yüklüyor; sonraki manuel değişiklikleri ezmeden CONFLICT ve
  PARTIAL_ROLLBACK raporluyor.
- `/admin/katalog-pro` yönetim ekranı dosya önizleme/onay, güvenli export,
  toplu fiyat ve çakışma güvenli rollback işlevleriyle tamamlandı.
- API testleri 6/6, web Vitest 1/1, TypeScript ve Next.js production build
  başarılı. V9 Supabase’e uygulandı.
- Gerçek Supabase smoke testinde CSV preview/commit, hash idempotency, yüzde fiyat
  commit’i, sonradan değişmiş fiyatta PARTIAL_ROLLBACK ve export formula escaping
  birlikte doğrulandı.

## 25 Temmuz 2026 — Çoklu dil, rapor, çoklu şube ve marka

- Supabase Flyway V10 ile menü/kategori/ürün çevirileri, oturumun aktif şubesi
  ve yapılandırılmış marka alanları eklendi; çeviri tablolarında RLS ve istemci
  rol erişim engeli etkinleştirildi.
- MULTILINGUAL guard’lı dil kaydı, ürün bazlı çeviri tamamlama sayacı, public
  locale allow-list/fallback ve menü dil seçici tamamlandı.
- ADVANCED_REPORTS için en fazla 90 günlük durum adetleri, tahmini sipariş
  değerleri ve ürün hazırlama adetleri eklendi; ödeme, tahsilat ve kesin ciro
  olmadığı API ve arayüzde açıkça belirtiliyor.
- MULTI_BRANCH için tenant başına 5 etkin şube limiti, şubeyle birlikte boş
  menü oluşturma, OWNER-only aktif şube değiştirme ve oturum branch scope’u
  tamamlandı. Abonelik bitse de mevcut şubeler arasında veri okuma korunuyor.
- BRANDING yalnız güvenli hex renkler ile SYSTEM/SERIF/ROUNDED font ve
  CARDS/COMPACT yerleşim allow-list’lerini kabul ediyor; serbest CSS/HTML
  saklanmıyor.
- Public menü seçili çeviriyi ve marka renk/font seçeneklerini uyguluyor;
  powered-by görünürlüğü yapılandırılmış boolean ile yönetiliyor.
- `/admin/ayarlar` ekranı şube yönetimi, dil/eksik çeviri görünümü, marka
  seçenekleri ve operasyon raporunu tek yerde sunuyor.
- API testleri 6/6, web Vitest 1/1, TypeScript ve Next.js production build
  başarılı. V10 Supabase’e uygulandı.
- Gerçek Supabase smoke testinde İngilizce menü/ürün, public locale, marka
  rengi, tahmini değer uyarılı rapor, yeni şube, session branch switch ve
  merkez şubeye dönüş birlikte doğrulandı.

## 25 Temmuz 2026 — Production hazırlığı ve son doğrulama

- Flyway V11 ile görsel binary içeriği ile object-store anahtarı arasında
  tutarlılık constraint'i eklendi; eski veritabanı görsellerini okumaya devam
  eden, yeni görselleri S3-compatible depoya yazan geçiş tamamlandı.
- Production profilinde Secure cookie, HTTPS public URL, en az 32 karakter
  webhook secret'ı, object storage ve ayrı Flyway job kullanımı için fail-fast
  kontroller eklendi.
- Kayıt, giriş, QR exchange, webhook, okuma ve yazma yollarına farklı pencereli
  IP/path rate-limit; doğrulanmış `X-Request-Id` ve hassas yanıtlara `no-store`
  header'ları eklendi.
- Sipariş, durum ve garson çağrısı değişiklikleri commit sonrasında SSE ile
  personel ekranına iletiliyor; bağlantı kesilirse 15 saniyelik polling fallback'i
  çalışıyor.
- Liveness yalnız process'i, readiness Supabase bağlantısını denetleyecek
  biçimde Actuator grupları ayrıldı.
- API ve Next.js için non-root, healthcheck'li Dockerfile'lar; read-only
  filesystem, tmpfs, tüm capability'leri düşürme ve no-new-privileges kullanan
  production Compose tanımı eklendi. Production Compose yerel veritabanı içermez.
- GitHub Actions'a Java 21 API testleri, Node 24 typecheck/Vitest/build/audit,
  Chromium-Firefox-WebKit Playwright matrisi ve iki container build işi eklendi.
- `age` ile şifreli custom-format `pg_dump`, SHA-256 manifest, izole hedef ve
  açık onay korumalı restore scriptleri ile yayınlama/olay/backup runbook'u
  tamamlandı.
- Next bağımlılık zincirindeki Playwright, PostCSS, Sharp, Vite ve Vitest
  güvenlik bulguları yamalı sürümlere yükseltildi; tam `npm audit` sonucu 0 açık.
- API test sonucu 7 çalıştırma, 0 hata ve 1 kontrollü skip'tir. Skip edilen
  Testcontainers V1–V11/RLS testi yerel Docker daemon kapalı olduğu içindir;
  Docker bulunan CI runner'ında zorunlu olarak çalışır. API production JAR
  paketi başarıyla üretildi.
- Web sonucu: TypeScript başarılı, Vitest 1/1, Next.js production build başarılı
  ve Playwright 6/6. Testler 320, 360, 375, 390, 412 px ile masaüstünde Chromium,
  WebKit ve Firefox'u kapsıyor; arama alanı tüm motorlarda 44 px dokunma hedefi.
- Geliştirme ve production Compose config'leri ile backup/restore PowerShell
  sözdizimi doğrulandı. Docker daemon ve `age` bu makinede çalışmadığı için image
  build ile gerçek restore tatbikatı CI/hedef operasyon ortamında yürütülecek.
- Gerçek Supabase smoke testinde şema V11, readiness/liveness `UP`, request-id,
  `no-store` ve QR exchange rate-limit'inin 31. istekte 429 vermesi doğrulandı.

## 25 Temmuz 2026 — Bağlantı ve istek akışı belgesi

- Tarayıcı → Next.js → Spring Boot → Supabase/object storage bağlantıları tek
  sistem haritasında belgelendi.
- Public menü SSR, aynı-origin `/backend` proxy, yönetici cookie/CSRF, masa QR
  exchange, sipariş, SSE, görsel ve webhook akışları adım adım kaydedildi.
- Kullanılan teknoloji zinciri, ortam değişkenleri, endpoint grupları ve Spring
  filtre/transaction sırası `docs/baglanti-ve-istek-akisi.md` dosyasına eklendi.
- Saklanan `/api/public/assets/...` görsel yollarının Next.js üzerinden Spring
  API'ye ulaşması için eksik public asset rewrite'ı eklendi.

## 25 Temmuz 2026 — Kayıt ekranı CSP düzeltmesi

- Next.js App Router'ın inline hydration scriptlerini engelleyen CSP kuralı
  düzeltildi; kayıt ve giriş formlarının React `onSubmit` akışı yeniden çalışır.
- `upgrade-insecure-requests` yalnız production'a alındı; localhost geliştirme
  ortamındaki HTTP scriptleri artık yanlışlıkla HTTPS'e yükseltilmez.
- Next.js geliştirme sunucusuna `localhost`, `127.0.0.1` ve yerel ağ adresi
  (`10.2.0.2`) için `allowedDevOrigins` tanımlandı; HMR/client kaynaklarının
  cross-origin engeline takılması önlendi.
- Playwright'a veritabanına test hesabı yazmadan kayıt formunun hydrate olup
  `POST /backend/api/auth/register` göndermesini doğrulayan regresyon testi
  eklendi.

## 25 Temmuz 2026 — Arayüz yeniden tasarımı (frontend)

- `globals.css` gerçek bir tasarım token sistemine dönüştürüldü: background,
  surface, elevated, sunken, foreground, muted, primary/hover/soft, accent,
  border, input, ring, success, warning, destructive, info, inverse, radius ve
  gölge ölçekleri semantik CSS değişkenleri olarak tanımlandı. Componentlerdeki
  `#176b52`, `#17201b`, `#fffdf8`, `#68736b` gibi ham hex kullanımı kaldırıldı.
- Sistem fontu yerine `next/font/google` üzerinden Inter (`latin`, `latin-ext`)
  kullanılıyor; Türkçe karakterler alt kümeye dahil.
- `src/components/ui/` altında ortak component seti oluşturuldu: Button,
  IconButton, Input, Textarea, Select, Checkbox, Switch, Badge, Card, StatCard,
  Dialog, Sheet, ConfirmDialog, Tabs, SegmentedControl, DropdownMenu, Toast,
  Skeleton, EmptyState, ErrorState, Alert, PageHeader, SectionHeader,
  Breadcrumb, FormField.
- Tüm `/admin` route'ları ortak `AdminShell` kullanıyor: masaüstünde gruplanmış
  sidebar, mobilde açılır navigasyon, breadcrumb, kullanıcı/rol bilgisi, aktif
  şube seçimi ve çıkış. Navigasyon oturumun izin listesine göre üretiliyor;
  yetkisiz seçenek gösterilmiyor.
- Yeni frontend route'ları eklendi: `/admin/menu`, `/admin/personel`,
  `/admin/eklentiler`. `/admin` göreve odaklı bir genel bakış ekranına dönüştü.
- Landing page sticky navbar, hero, güven bandı, özellikler, nasıl çalışır,
  eklenti modeli, son CTA ve footer bölümleriyle yeniden yazıldı.
- Public menü `/m/{slug}`: gerçek logo veya işletme adından üretilen baş harf
  fallback'i, sticky kategori navigasyonu ve smooth scroll, erişilebilir arama,
  `next/image` ile ürün görselleri, CARDS ve COMPACT için gerçekten farklı iki
  yerleşim, mobilde bottom sheet / masaüstünde dialog ürün detayı, marka
  renginin WCAG kontrastıyla uygulanması.
- `/siparis` ekranı: sticky kategori navigasyonu, ürün görselleri, net adet
  kontrolleri, sabit sepet çubuğu, bottom sheet sepet, servis biçimi segment
  kontrolü, garson çağırmanın ana CTA'dan ayrılması ve güçlü sipariş başarı
  ekranı.
- Backend enumları son kullanıcıya ham gösterilmiyor; sipariş, mutfak, garson
  çağrısı, eklenti, import ve fiyat batch durumları için Türkçe etiket eşlemesi
  eklendi (`src/lib/labels.ts`).
- `window.alert` kaldırıldı; tüm geri bildirimler toast ile veriliyor.
  Kategori/ürün arşivleme, personel devre dışı bırakma, menü yayından kaldırma,
  eklenti iptali, QR yenileme, import ve toplu fiyat işlemleri onay diyaloğu
  istiyor.
- Tek satıra sıkıştırılmış `admin-dashboard.tsx`, `table-admin.tsx`,
  `staff-orders.tsx`, `kitchen-board.tsx`, `product-features.tsx`,
  `catalog-pro.tsx` ve `table-order.tsx` dosyaları okunabilir ve küçük
  componentlere bölünmüş yapılara dönüştürüldü.
- Frontend hatası düzeltildi: yüklenen görseller `/api/public/assets/{id}`
  biçiminde göreli yol döndüğü için public menü Zod şeması (`url()`) menüyü
  reddediyordu; şema aynı-origin yolları ve `https://` adreslerini kabul edecek,
  diğer şemaları atacak biçimde güncellendi.
- Yatay taşmayı kaynağında engellemek için kolon tanımı olmayan grid'lere
  `minmax(0, 1fr)` kuralı eklendi; kategori şeridi otomatik ortalaması
  `scrollIntoView` yerine yalnız şeridin `scrollLeft` değerini güncelliyor
  (WebKit'te sayfayı geri sıçratıyordu).
- Backend, migration, endpoint URL'leri, oturum/CSRF, tenant-şube izolasyonu,
  rol izinleri, QR token akışı, sipariş durum makinesi, sunucu tarafı
  fiyatlama, Idempotency-Key ve eklenti entitlement kontrolleri değiştirilmedi.
- Yeni bağımlılık: yalnız `lucide-react`. Global state kütüphanesi veya ağır UI
  framework eklenmedi.
- Doğrulama: TypeScript başarılı, Vitest 14/14, Next.js production build
  başarılı, `npm audit` 0 açık, Playwright 144/144. Playwright matrisi 320, 390,
  430, 768, 1280 ve 1440 px genişlikleri ile Chromium, WebKit ve Firefox'u
  kapsıyor; 14 route × 8 kırılım noktasında yatay taşma olmadığı doğrulandı.
- Bilinen eksik: yönetim ekranlarının uçtan uca doğrulaması mock API ile
  yapıldı; gerçek Supabase + Spring Boot ile smoke test tekrar çalıştırılmalı.
  Dar ekranda aktif şube değiştirme üst bardan kaldırıldı, Ayarlar > Şubeler
  üzerinden yapılıyor.

## Kayıt kuralı

Her yeni aşamada bu belgeye aşağıdakiler eklenecektir:

1. Tarih ve aşama adı
2. Eklenen veya değiştirilen özellikler
3. Veritabanı/migration değişiklikleri
4. Çalıştırılan test ve build sonuçları
5. Bilinen eksikler ve sonraki adım
