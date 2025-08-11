@echo off
echo VRChat Booth Manager - Development Mode
echo.
echo Starting React dev server...
start cmd /k "cd renderer && npm run dev"
echo.
echo Waiting 5 seconds for React server to start...
timeout /t 5 > nul
echo.
echo Starting Electron app...
npm run compile
npx electron .