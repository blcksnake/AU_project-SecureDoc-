@echo off
echo Fixing Security Vulnerabilities in SecureDoc
echo ===========================================

echo.
echo Step 1: Updating backend dependencies...
cd .
call npm audit fix
if %errorlevel% neq 0 (
    echo Backend audit fix completed with warnings
)

echo.
echo Step 2: Updating frontend dependencies...
cd frontend
call npm audit fix
if %errorlevel% neq 0 (
    echo Frontend audit fix completed with warnings
)

echo.
echo Step 3: Force fixing remaining vulnerabilities...
call npm audit fix --force
if %errorlevel% neq 0 (
    echo Force fix completed with warnings
)

echo.
echo Step 4: Checking for remaining vulnerabilities...
call npm audit
if %errorlevel% neq 0 (
    echo Some vulnerabilities may remain - check output above
) else (
    echo No vulnerabilities found!
)

echo.
echo Step 5: Updating to latest secure versions...
call npm update

echo.
echo Step 6: Final security check...
call npm audit

echo.
echo ===========================================
echo Security update completed!
echo ===========================================
echo.
echo If vulnerabilities remain, they may be:
echo 1. In development dependencies (less critical)
echo 2. Require manual package updates
echo 3. Be false positives
echo.
echo For production deployment, consider:
echo - Using npm ci instead of npm install
echo - Implementing dependency scanning
echo - Regular security updates
echo.
pause
