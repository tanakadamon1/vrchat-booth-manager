@echo off
title VRChat Booth Manager v0.2.0 - WORKING VERSION
echo ================================================
echo VRChat Booth Manager v0.2.0 (Working Version)
echo ================================================
echo.
echo This version uses JSON files instead of SQLite
echo Data will be saved to: %USERPROFILE%\VRChat-Booth-Manager\
echo.
echo Starting application...

REM 動作する版を起動
npx electron main-localStorage.js

if %ERRORLEVEL% neq 0 (
    echo.
    echo Error occurred with code: %ERRORLEVEL%
    echo Press any key to exit...
    pause > nul
) else (
    echo.
    echo Application closed normally.
)