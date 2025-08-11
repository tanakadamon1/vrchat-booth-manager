@echo off
title VRChat Booth Manager v0.2.0 - FINAL VERSION
echo ================================================
echo VRChat Booth Manager v0.2.0 (FINAL VERSION)
echo ================================================
echo.

REM 現在のディレクトリを確認
echo Current directory: %CD%
echo.

REM Node.jsとnpmの確認
echo Checking Node.js...
node --version
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Checking npm...
npm --version
if %ERRORLEVEL% neq 0 (
    echo ERROR: npm is not available
    pause
    exit /b 1
)

REM 必要なファイルの確認
echo Checking required files...
if not exist "main-localStorage.js" (
    echo ERROR: main-localStorage.js not found
    pause
    exit /b 1
)

if not exist "package.json" (
    echo ERROR: package.json not found
    pause
    exit /b 1
)

REM 依存関係をインストール
echo Installing dependencies...
npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Starting VRChat Booth Manager...
echo Data will be saved to: %USERPROFILE%\VRChat-Booth-Manager\
echo.

REM アプリケーションを起動（npm scriptを使用）
npm start

if %ERRORLEVEL% neq 0 (
    echo.
    echo Application exited with error code: %ERRORLEVEL%
    echo.
    echo Troubleshooting tips:
    echo 1. Make sure Node.js is properly installed
    echo 2. Try running as administrator
    echo 3. Check if antivirus is blocking the application
    echo.
    pause
) else (
    echo.
    echo Application closed normally.
)