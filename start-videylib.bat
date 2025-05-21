@echo off
cd /d %~dp0
echo *** VideyLib - Application Startup ***
echo.

echo Starting VideyLib in development mode...
echo Application will be available at: http://localhost:3000

echo.
echo Starting server...
start cmd /c "npm run dev"

echo Waiting for server to start (10 seconds)...
timeout /t 10 /nobreak > nul
echo Opening browser...
start "" "http://localhost:3000"

echo.
echo VideyLib is running! You can close this window when done.
echo (Server is running in a separate command window)
pause 