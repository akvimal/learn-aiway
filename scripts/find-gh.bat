@echo off
echo Checking for GitHub CLI installation...
echo.

REM Check if gh is in PATH
where gh >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: GitHub CLI is in PATH
    echo.
    gh --version
    echo.
    echo You can now run: gh auth login
    exit /b 0
)

echo GitHub CLI not found in PATH. Checking common installation locations...
echo.

REM Check default installation paths
set "PATHS_TO_CHECK=C:\Program Files\GitHub CLI\gh.exe"
set "PATHS_TO_CHECK=%PATHS_TO_CHECK%;%LOCALAPPDATA%\Programs\GitHub CLI\gh.exe"
set "PATHS_TO_CHECK=%PATHS_TO_CHECK%;%ProgramFiles(x86)%\GitHub CLI\gh.exe"

set FOUND=0
for %%P in (%PATHS_TO_CHECK%) do (
    if exist "%%P" (
        echo FOUND: %%P
        echo.
        "%%P" --version
        echo.
        set FOUND=1
        set GH_PATH=%%P
        goto :found
    )
)

if %FOUND%==0 (
    echo NOT FOUND: GitHub CLI is not installed
    echo.
    echo To install, run in PowerShell:
    echo   winget install --id GitHub.cli
    echo.
    echo Then restart your terminal.
    exit /b 1
)

:found
echo GitHub CLI is installed but not in PATH.
echo.
echo SOLUTION 1: Restart your terminal (recommended)
echo   - Close this terminal completely
echo   - Open a new terminal
echo   - Run: gh --version
echo.
echo SOLUTION 2: Use full path temporarily
echo   Full path: %GH_PATH%
echo.
echo SOLUTION 3: Add to PATH manually
echo   - Press Win + X, select System
echo   - Click "Advanced system settings"
echo   - Click "Environment Variables"
echo   - Edit "Path" under User variables
echo   - Add: C:\Program Files\GitHub CLI
echo   - Restart terminal
echo.

pause
