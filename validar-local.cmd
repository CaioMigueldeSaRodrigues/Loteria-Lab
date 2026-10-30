@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js nao encontrado. Instale o Node.js LTS e tente novamente.
  echo.
  pause
  exit /b 1
)
echo.
echo ============================================
echo    LOTERIA LAB - VALIDACAO LOCAL
echo ============================================
echo.
echo Abra no navegador: http://127.0.0.1:5173
echo A aplicacao funciona SOMENTE neste computador.
echo Para encerrar, pressione Ctrl+C nesta janela.
echo.
node scripts\serve.mjs
echo.
echo Servidor encerrado.
pause
