# Güvenlik

Personel auth Aşama 2'de Argon2id ve sunucu taraflı cookie session kullanır;
token localStorage'a yazılmaz. CSRF state-changing personel çağrılarında
zorunludur. CORS yalnız yapılandırılmış web origin'ine izin verir.

CSP, HSTS (TLS edge/prod), nosniff, no-referrer, Permissions-Policy,
frame-ancestors ve hassas yanıtlarda no-store uygulanır. Object authorization
tenant ve branch scope'u doğrular; uygun cross-tenant sorgu 404 döndürür.

