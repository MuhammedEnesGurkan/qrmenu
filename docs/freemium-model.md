# Freemium model

Bir tenant ücretsiz olarak tek şube, tek menü, kategori/ürün/fiyat yönetimi,
kalıcı public slug, genel QR ve temel görüntülenme sayısı kullanır. Fiyat
değişimi slug veya QR'ı değiştirmez.

Ücretli özellikler tekil eklenti ya da paket entitlement'ı olarak açılır.
Abonelik bittiğinde yeni ücretli işlem engellenir; tenant verisi ve ücretsiz QR
menü korunur. Plan ve paket fiyatları kodda değil veritabanındadır.

