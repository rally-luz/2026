@echo off
setlocal
cd /d "%~dp0"

where powershell >nul 2>nul
if errorlevel 1 (
  echo No se encontro PowerShell.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $html = Get-Content -Raw -LiteralPath 'index.html'; if ($html -match 'formulario_rally_por_la_luz_2026\.html') { $estado='cerrado' } else { $estado='abierto' }; Write-Host ('Cambiando registro a: ' + $estado); & '.\registro.ps1' $estado -Publicar"

echo.
echo Listo. Presiona una tecla para cerrar.
pause >nul
