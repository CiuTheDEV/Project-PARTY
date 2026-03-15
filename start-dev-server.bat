@echo off
setlocal

REM Zawsze przechodz do folderu, w ktorym lezy ten plik.
cd /d "%~dp0"

echo.
echo [Project Party] Startuje lokalny serwer developerski...
echo Folder: %cd%
echo.

where pnpm >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Nie znaleziono polecenia pnpm.
  echo Uruchom najpierw:
  echo   corepack enable
  echo   corepack prepare pnpm@10.6.0 --activate
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\vite\bin\vite.js" (
  echo [INFO] Brakuje lokalnych zaleznosci. Uruchamiam pnpm install...
  call pnpm install
  if errorlevel 1 (
    echo.
    echo [BLAD] pnpm install nie powiodl sie.
    pause
    exit /b 1
  )
)

echo.
echo [Project Party] Uruchamiam pnpm dev
echo.
call pnpm dev

echo.
echo [Project Party] Serwer zakonczyl dzialanie.
pause
