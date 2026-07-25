# Backup ve restore

PostgreSQL günlük tam, aralıklı WAL; object storage versioned backup kullanır.
Backup şifreli, tenant verisiyle aynı credential'dan bağımsız ve retention
politikalıdır.

Restore düzenli izole ortamda denenir: checksum doğrula, veritabanını geri al,
Flyway sürümünü kontrol et, asset referanslarını örnekle, smoke test çalıştır ve
RPO/RTO sonucunu kaydet.

`ops/backup.ps1` custom-format `pg_dump` çıktısını age recipient ile şifreler
ve SHA-256 manifest üretir. `ops/restore.ps1` checksum'u doğrular ve yalnız
`RESTORE_ISOLATED_DATABASE` onayıyla belirtilen izole service'e restore eder.
Komutlar parola taşımak yerine `pg_service.conf` ve dar izinli `PGPASSFILE`
kullanır. Ayrıntılı tatbikat kontrol listesi `docs/operations.md` içindedir.
