# MasaAkış

MasaAkış, işletmeler için ücretsiz QR menü temeli ve kontrollü SaaS eklentileri
üzerine kurulu, responsive bir web uygulamasıdır. İlk sürüm modüler monolit
Spring Boot API ve Next.js web uygulamasından oluşur.

## Supabase kurulumu

Veritabanı bu bilgisayarda çalıştırılmaz. Bir Supabase projesi oluşturup
Dashboard'daki **Connect** ekranından Session pooler bağlantısını alın. Spring
Boot kalıcı bir backend olduğu için IPv4 ağlarda Session pooler (`5432`), IPv6
destekli sunucularda direct connection (`5432`) uygundur. Transaction pooler
(`6543`) bu uygulamanın varsayılan bağlantısı değildir.

`.env.example` dosyasını şablon olarak kullanın ve gerçek değerleri shell/deploy
ortamına secret olarak tanımlayın. JDBC URL `jdbc:postgresql://` ile başlamalı ve
`sslmode=require` içermelidir. Örnek:

```text
DATABASE_URL=jdbc:postgresql://aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require
DATABASE_USERNAME=postgres.PROJECT_REF
DATABASE_PASSWORD=...
```

Parolayı URL içine koymadığımız için özel karakterleri URL-encode etmek
gerekmez. İlk API başlangıcında Flyway şemayı ve demo menüyü Supabase'e uygular.
Supabase Data API'ye açık `public` şemasındaki uygulama tablolarında RLS etkin,
`anon`, `authenticated` ve `service_role` doğrudan erişimi kapalıdır; public
menü yalnız Spring API üzerinden sunulur.

## Hızlı başlangıç

Gereksinimler: Java 21+, Maven 3.9+, Node.js 22+; görsel depolama geliştirmesi
için isteğe bağlı Docker.

```bash
mvn -f apps/api/pom.xml spring-boot:run
npm --prefix apps/web install
npm --prefix apps/web run dev
```

MinIO gerektiğinde ayrıca `docker compose -f infra/compose.yaml up -d` ile
başlatılabilir; Compose artık PostgreSQL içermez.

Object storage kullanırken `OBJECT_STORAGE_ENABLED=true` ve S3-compatible
endpoint/access/secret/bucket değişkenlerini tanımlayın. Production profili bunu,
Secure cookie'yi, HTTPS public URL'yi, güçlü webhook secret'ını ve ayrı migration
job'ını fail-fast olarak zorunlu tutar.

- Web: http://localhost:3000/m/demo-kafe
- API: http://localhost:8080/api/public/menus/demo-kafe
- Health: http://localhost:8080/actuator/health
- Readiness: http://localhost:8080/actuator/health/readiness

Production container, CI ve backup/restore adımları `docs/deployment.md` ve
`docs/operations.md` belgelerindedir.

Web, API, Supabase, object storage ve webhook arasındaki tüm istek/bağlantı
akışı `docs/baglanti-ve-istek-akisi.md` belgesinde anlatılır.

Demo verisi Flyway migration tarafından oluşturulur.
