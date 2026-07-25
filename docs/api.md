# API

`GET /api/public/menus/{slug}` yayınlanmış menüyü public DTO olarak döndürür.
Tenant, branch, internal status ve yönetim alanları yanıtta yoktur. Slug küçük
harf, rakam ve tireyle sınırlıdır.

Tamamlanan sözleşme aileleri:

- `/api/public`: yayınlanmış menü, locale ve self-servis hazır ekranı
- `/api/auth`: kayıt, giriş, oturum ve güvenli çıkış
- `/api/admin`: katalog, personel, masa, sipariş, mutfak, eklenti, içe/dışa
  aktarma, toplu fiyat, çeviri, şube, marka ve operasyon raporları
- `/api/table`: QR exchange sonrası sepet siparişi ve garson çağrısı
- `/api/billing/webhooks`: imzalı ve idempotent sağlayıcı webhook'u

Yönetim yazmaları cookie oturumu, CSRF, tenant/branch object scope ve permission
kontrolünden geçer. Ücretli modüllerde backend entitlement guard uygulanır.
Hatalar standart `{status, code, message}` gövdesini kullanır; yönetim ve token
yanıtlarında request-id ile `no-store` header'ı üretilir.

OpenAPI JSON `/v3/api-docs`, geliştirme UI'ı `/swagger-ui.html` adresindedir.
