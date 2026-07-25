# Mimari

MasaAkış, tek PostgreSQL veritabanı kullanan modüler monolittir. API ve web ayrı
deploy edilebilir; domain iş kuralları API'dedir.

Her tenant kaydı `tenant_id`, şubeye ait kayıtlar ayrıca `branch_id` taşır.
Tenant bilgisi istemcinin gönderdiği kaynak kimliğinden türetilmez; doğrulanmış
membership/session bağlamından gelir. Public menü yalnız benzersiz slug ile
yayınlanmış içerik okur.

Modüller repository paylaşmaz. Modül dışı ihtiyaçlar application port ile
sunulur. Transaction sonrası entegrasyon olayları outbox tablosuna yazılır.
Ücretli yetenekler hem UI capability yanıtı hem backend entitlement guard ile
korunur.

