# Deployment

PostgreSQL yerelde çalıştırılmaz; geliştirme ve production veritabanı Supabase
Postgres'tir. Uzun yaşayan Spring Boot API, ağ uygunsa direct connection;
IPv4-only ortamda Supabase Session pooler kullanır. Her ikisi de `5432` portunda
ve `sslmode=require` ile bağlanır. Transaction pooler (`6543`) ancak serverless
deploy'a geçilirse ve prepared statement davranışı ayrıca ele alınırsa seçilir.

`infra/compose.yaml` yalnız geliştirme amaçlı MinIO'yu açar. API Java 21
container, web Node 24 LTS standalone output olarak çalıştırılacak; TLS reverse
proxy'de sonlandırılır.

`DATABASE_URL`, `DATABASE_USERNAME` ve `DATABASE_PASSWORD` production
secret'larıdır; image veya repoya yazılmaz. Production'da migration API
başlangıcından önce direct connection kullanan tek kontrollü job ile uygulanır
ve API'de `FLYWAY_ENABLED=false` yapılır. Hikari havuzu instance başına düşük
tutulur; toplam bağlantı sayısı Supabase proje limitine göre hesaplanır.
Readiness veritabanını, liveness yalnız process sağlığını ölçer.
