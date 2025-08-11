@echo off
title VRChat Booth Manager v0.2.0 - Fixed Version
echo Starting VRChat Booth Manager (Fixed Version)...
echo.

REM まずnpmのパッケージを最新にインストール
echo Installing/updating dependencies...
npm install better-sqlite3@latest electron-is-dev@latest puppeteer@latest
echo.

REM Electron用にbetter-sqlite3を再ビルド
echo Rebuilding native modules for Electron...
npx electron-rebuild
echo.

REM アプリケーションを起動
echo Launching application...
npx electron .

REM エラーの場合は待機
if %ERRORLEVEL% neq 0 (
    echo.
    echo An error occurred. Press any key to exit...
    pause > nul
)