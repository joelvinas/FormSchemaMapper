@echo off
TITLE Form Migration Portal Server

echo Starting local web server on port 8000...
echo Directory: %CD%
echo.

:: Launch the browser automatically after a short delay
start "" "http://localhost:8000"

:: Run local Python HTTP server
python -m http.server 8000

pause