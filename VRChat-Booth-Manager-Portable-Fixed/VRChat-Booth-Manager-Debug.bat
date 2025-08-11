@echo off
title VRChat Booth Manager v0.2.0 - Debug Mode
echo Starting VRChat Booth Manager (Debug Mode)...
echo.

REM 現在のディレクトリを表示
echo Current directory: %CD%
echo.

REM Node.jsのバージョンを確認
echo Checking Node.js version...
node --version
npm --version
echo.

REM package.jsonの存在確認
if exist package.json (
    echo ✓ package.json found
) else (
    echo ✗ package.json not found
)

REM main.jsの存在確認
if exist main.js (
    echo ✓ main.js found
) else (
    echo ✗ main.js not found
)

REM preload.jsの存在確認
if exist preload.js (
    echo ✓ preload.js found
) else (
    echo ✗ preload.js not found
)

REM node_modulesの存在確認
if exist node_modules (
    echo ✓ node_modules found
) else (
    echo ✗ node_modules not found - installing...
    npm install
)

echo.
echo Starting Electron with detailed error output...
echo ===============================================

REM Electronを詳細エラー出力で実行
npx electron . --trace-warnings --trace-uncaught

echo.
echo ===============================================
echo Exit code: %ERRORLEVEL%

REM 必ず一時停止
echo.
echo Press any key to exit...
pause > nul