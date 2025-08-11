@echo off
title VRChat Booth Manager v0.2.0
echo Starting VRChat Booth Manager...
echo.

REM Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    npm install
    echo.
)

REM Start the application
echo Launching application...
npx electron .

REM Pause if there's an error
if %ERRORLEVEL% neq 0 (
    echo.
    echo An error occurred. Press any key to exit...
    pause > nul
)