# API

İlk çalışan sözleşme:

`GET /api/public/menus/{slug}` yayınlanmış menüyü public DTO olarak döndürür.
Tenant, branch, internal status ve yönetim alanları yanıtta yoktur. Slug küçük
harf, rakam ve tireyle sınırlıdır.

OpenAPI JSON `/v3/api-docs`, geliştirme UI'ı `/swagger-ui.html` adresindedir.
Gelecek endpointler gereksinim belgesindeki public/staff/admin namespace'lerini
ve standart `{status, code, message}` hata gövdesini kullanır.

