@echo off
echo Installing Python dependencies for Booth search...
echo.

REM Try different Python commands
echo Trying python...
python -m pip install beautifulsoup4 requests
if %ERRORLEVEL% EQU 0 goto success

echo Trying python3...
python3 -m pip install beautifulsoup4 requests
if %ERRORLEVEL% EQU 0 goto success

echo Trying py...
py -m pip install beautifulsoup4 requests
if %ERRORLEVEL% EQU 0 goto success

echo ERROR: Could not install dependencies. Please install Python and pip first.
pause
exit /b 1

:success
echo.
echo Dependencies installed successfully!
echo You can now use the Booth search feature.
pause