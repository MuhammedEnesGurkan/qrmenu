@echo off
REM ---------------------------------------------------------------------------
REM  MasaAkis - yerel gelistirme durdurucu
REM  :8080 (API) ve :3000 (web) portlarini dinleyen surecleri kapatir.
REM ---------------------------------------------------------------------------
setlocal EnableDelayedExpansion

echo.
echo   MasaAkis servisleri durduruluyor
echo   ------------------------------------------------

for %%P in (8080 3000) do (
  set "FOUND="
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr /r /c:":%%P .*LISTENING"') do (
    if not "%%A"=="0" (
      set "FOUND=1"
      echo   :%%P  PID %%A kapatiliyor
      taskkill /PID %%A /T /F >nul 2>&1
    )
  )
  if not defined FOUND echo   :%%P  zaten bos
)

echo   ------------------------------------------------
echo   Tamamlandi.
echo.
pause
