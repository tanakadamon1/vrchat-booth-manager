@echo off
title VRChat Booth Manager v0.2.0 - Safe Mode
echo Starting VRChat Booth Manager (Safe Mode)...
echo.
echo NOTE: This safe mode disables database and thumbnail features
echo but should run without dependency issues.
echo.

REM セーフモードで実行（依存関係エラーを回避）
npx electron main-safe.js

if %ERRORLEVEL% neq 0 (
    echo.
    echo Safe mode also failed. Error code: %ERRORLEVEL%
    echo Press any key to exit...
    pause > nul
) else (
    echo Safe mode completed successfully.
)