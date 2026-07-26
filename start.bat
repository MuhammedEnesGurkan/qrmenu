@echo off
REM ---------------------------------------------------------------------------
REM  MasaAkis - yerel gelistirme baslatici
REM
REM  Spring Boot API'yi :8080, Next.js web uygulamasini :3000 uzerinde ayaga
REM  kaldirir ve tarayiciyi acar. Her servis kendi penceresinde calisir;
REM  durdurmak icin pencereyi kapatmak ya da Ctrl+C yeterlidir.
REM ---------------------------------------------------------------------------
setlocal EnableDelayedExpansion
cd /d "%~dp0"

REM Maven'a verilecek calisma dizini: ters bolu yerine duz bolu kullanilir,
REM aksi halde spring-boot-maven-plugin yolu proje klasorune gore cozuyor.
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "ROOT_FWD=%ROOT:\=/%"

echo.
echo   MasaAkis yerel ortam baslatiliyor
echo   ------------------------------------------------
echo.

REM --- On kosullar -----------------------------------------------------------
REM API, Supabase baglanti bilgilerini depo kokundeki .env dosyasindan okur
REM (application.yaml: import optional:file:.env[.properties]). Bu dosya
REM sureci baslatan calisma dizinine gore aranir, bu yuzden asagida
REM spring-boot.run.workingDirectory acikca depo koku olarak verilir.
if not exist ".env" (
  echo   [HATA] .env bulunamadi.
  echo          .env.example dosyasini .env olarak kopyalayip Supabase
  echo          baglanti bilgilerini doldurun.
  echo.
  pause
  exit /b 1
)

for %%C in (java mvn npm) do (
  where %%C >nul 2>&1 || (
    echo   [HATA] %%C bulunamadi. PATH'e ekleyip tekrar deneyin.
    echo          Gerekli: JDK 21+, Apache Maven, Node.js 20+
    echo.
    pause
    exit /b 1
  )
)

if not exist "apps\web\node_modules" (
  echo   [1/3] Web bagimliliklari kuruluyor, birkac dakika surebilir...
  call npm install
  if errorlevel 1 (
    echo   [HATA] npm install basarisiz oldu.
    echo.
    pause
    exit /b 1
  )
) else (
  echo   [1/3] Web bagimliliklari zaten kurulu.
)

REM --- Servisler -------------------------------------------------------------
echo   [2/3] API baslatiliyor  -^> http://localhost:8080
start "MasaAkis API" cmd /k "cd /d "%ROOT%" && mvn -f apps/api/pom.xml spring-boot:run "-Dspring-boot.run.workingDirectory=%ROOT_FWD%""

echo   [3/3] Web baslatiliyor  -^> http://localhost:3000
start "MasaAkis Web" cmd /k "cd /d "%ROOT%" && npm --prefix apps\web run dev"

REM --- Web hazir olana kadar bekle -------------------------------------------
echo.
echo   Web sunucusu bekleniyor...
set READY=0
for /l %%i in (1,1,60) do (
  if !READY!==0 (
    powershell -NoProfile -Command "try { $null = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2; exit 0 } catch { exit 1 }" >nul 2>&1
    if !errorlevel!==0 ( set READY=1 ) else ( timeout /t 2 /nobreak >nul )
  )
)

echo.
if !READY!==1 (
  echo   Web hazir, tarayici aciliyor.
  start "" http://localhost:3000
) else (
  echo   [UYARI] Web sunucusu 2 dakika icinde yanit vermedi.
  echo           "MasaAkis Web" penceresindeki hatalari kontrol edin.
)

echo.
echo   ------------------------------------------------
echo   Ana sayfa        http://localhost:3000
echo   Yonetim paneli   http://localhost:3000/admin
echo   Garson paneli    http://localhost:3000/admin/garson
echo   Demo QR menu     http://localhost:3000/m/demo-kafe
echo   API health       http://localhost:8080/actuator/health
echo   ------------------------------------------------
echo.
echo   API ilk aciliste Supabase'e baglanip Flyway kontrolu yapar;
echo   hazir olmasi 30-60 saniye surebilir.
echo.
echo   Durdurmak icin "MasaAkis API" ve "MasaAkis Web" pencerelerini kapatin
echo   ya da bu klasordeki stop.bat dosyasini calistirin.
echo.
pause
