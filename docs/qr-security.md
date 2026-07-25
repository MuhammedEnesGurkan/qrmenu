# QR güvenliği

Genel QR yalnız `/m/{slug}` açar ve sipariş bağlamı taşımaz. Masa QR'ı en az
32 byte CSPRNG token kullanır; yalnız SHA-256/HMAC hash saklanır.

Exchange tokenı doğrular, kısa ömürlü HttpOnly/Secure/SameSite table session
cookie'si yazar ve 303 ile tokensız URL'ye yönlendirir. Referrer-Policy
`no-referrer`, exchange yanıtı `no-store` olur. Token log, audit, analytics ve
exception mesajlarına alınmaz. Rotasyon eski hash'i aynı transaction'da iptal
eder.

