# Production operasyon runbook

## Yayınlama

1. Supabase direct connection kullanan tek seferlik migration job'ında API
   image'ını `FLYWAY_ENABLED=true` ile çalıştır; başarısızsa uygulama rollout'u
   başlatma.
2. API instance'larında `prod` profilini, `FLYWAY_ENABLED=false`, Secure
   cookie, HTTPS public URL, en az 32 karakter webhook secret ve S3-compatible
   object storage secret'larını platform secret manager'dan ver.
3. `/actuator/health/liveness` process, `/actuator/health/readiness` Supabase
   bağlantısı için kullanılmalı. Readiness yeşil olmadan trafik açılmamalı.
4. Web image'ında `API_URL` private API adresidir; TLS edge'de sonlanır.
5. Rollback uygulama image'ını geri alır; migration'lar ileri uyumlu tutulur ve
   production veritabanında otomatik down migration çalıştırılmaz.

## Alarm ve olay müdahalesi

- 5xx oranı, p95 gecikme, Hikari bekleyen bağlantı, readiness, 429 oranı,
  webhook signature hatası, outbox birikimi ve object-store hatası izlenir.
- Olayda request-id ile log korelasyonu yapılır; cookie, QR raw token, parola,
  JDBC URL ve webhook body loglanmaz.
- Şüpheli QR sızıntısında yalnız ilgili masa QR'ı rotate edilir. Şüpheli personel
  oturumunda kullanıcı devre dışı bırakılır ve session kayıtları iptal edilir.

## Şifreli backup ve izole restore tatbikatı

Backup runner'da PostgreSQL client ve `age` bulunur. Parola komut satırına
yazılmaz; `BACKUP_PGSERVICE` ve izinleri dar `PGPASSFILE` kullanılır.

```powershell
$env:BACKUP_PGSERVICE="masaakis-production"
$env:BACKUP_AGE_RECIPIENT="age1..."
./ops/backup.ps1 -BackupDirectory "D:\secured-backups"
```

Restore yalnız production'dan ağ ve credential olarak ayrılmış, silinebilir
tatbikat veritabanında çalıştırılır:

```powershell
$env:RESTORE_PGSERVICE="masaakis-restore-drill"
$env:RESTORE_CONFIRMATION="RESTORE_ISOLATED_DATABASE"
./ops/restore.ps1 -EncryptedBackup "D:\secured-backups\masaakis-....dump.age"
```

Tatbikat kaydı checksum, başlangıç/bitiş, dump yaşı (RPO), toplam süre (RTO),
Flyway V11, RLS tablo sayısı, örnek asset SHA-256, public menü ve auth smoke
sonuçlarını içerir. Şifre çözme anahtarı backup ile aynı sistemde tutulmaz.
