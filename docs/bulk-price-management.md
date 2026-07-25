# Toplu fiyat yönetimi

Her işlem önce eski/yeni fiyat ve farkı gösteren preview üretir. Atama, sabit
artış/azalış, yüzde ve tanımlı yuvarlama stratejileri BigDecimal ile hesaplanır.

Commit tek transaction içinde PriceChangeBatch/Item snapshot'ı oluşturur.
Rollback yalnız mevcut değer commit sonrası beklenen değerle eşleşiyorsa geri
alır; tekil değişiklik varsa conflict raporlar ve sessizce ezmez.

