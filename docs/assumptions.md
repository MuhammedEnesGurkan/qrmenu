# Varsayımlar

- Repo 25 Temmuz 2026 tarihinde boş ve Git metadata'sı olmadan teslim edildi.
- Ürün ücretsiz QR menü temeliyle başlamış, ardından personel kimliği, eklenti,
  sipariş, mutfak ve operasyon modülleri tamamlanmıştır.
- Geliştirme verisi yalnızca `demo` profilinde yüklenir.
- SaaS abonelikleri ile restoran müşterisinin ödemesi kesin biçimde ayrıdır;
  restoran tahsilatı bu ürünün kapsamı dışındadır.
- Public menü slug'ı kalıcıdır; ürün ve fiyat güncellemeleri QR'ı değiştirmez.
- Görseller içerik doğrulama ve yeniden kodlama sonrasında S3-compatible object
  store'a yazılır; geliştirmede açıkça etkinleştirilen veritabanı fallback'i
  dışında dış URL kabul edilmez. QR PNG sunucuda üretilir.
- Varsayılan para birimi TRY, varsayılan dil `tr` ve ücretsiz limit bir şubedir.
