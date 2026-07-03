@echo off
title Subir cambios Rally por la Luz 2026

cd /d "%~dp0"

echo.
echo Sincronizando con GitHub...
git pull --rebase origin main

if errorlevel 1 (
  echo.
  echo ERROR: No se pudo sincronizar. Revisa conflictos.
  pause
  exit /b 1
)

echo.
echo Preparando cambios...
git add apps-script/Code.gs

echo.
echo Creando commit...
git commit -m "Agrega boton Google Calendar al correo de registro"

echo.
echo Publicando en GitHub...
git push origin main

if errorlevel 1 (
  echo.
  echo ERROR: No se pudo publicar en GitHub.
  pause
  exit /b 1
)

echo.
echo Listo. Cambios publicados en GitHub.
pause