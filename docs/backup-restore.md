# Backup ve restore

PostgreSQL günlük tam, aralıklı WAL; object storage versioned backup kullanır.
Backup şifreli, tenant verisiyle aynı credential'dan bağımsız ve retention
politikalıdır.

Restore düzenli izole ortamda denenir: checksum doğrula, veritabanını geri al,
Flyway sürümünü kontrol et, asset referanslarını örnekle, smoke test çalıştır ve
RPO/RTO sonucunu kaydet.

