@echo off
echo Starting SecureDoc - Professional Document Redaction Platform
echo.

echo Checking if Node.js is installed...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is required but not found.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
call npm install

echo.
echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo Starting backend server...
start "Backend Server" cmd /k "node server.js"

echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak

echo.
echo Starting frontend...
cd frontend
start "Frontend" cmd /k "npm start"

echo.
echo ========================================
echo SecureDoc is starting!
echo ========================================
echo.
echo Backend API: http://localhost:8080
echo Frontend: http://localhost:3000
echo Health Check: http://localhost:8080/health
echo.
echo Press any key to exit this script...
pause > nul
