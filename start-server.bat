@echo off
chcp 936 >nul
echo ==========================================
echo   JFK Archive - Local Server Launcher
echo ==========================================
echo.
echo Starting server, please wait...
echo Visit: http://localhost:8080
echo.
echo Press Ctrl+C to stop server
echo.

:: Try npx serve first
npx serve . -p 8080 2>nul

:: If failed, try Python
if %errorlevel% neq 0 (
    echo Trying Python server...
    python -m http.server 8080 2>nul
)

:: If still failed, use Node.js builtin
if %errorlevel% neq 0 (
    echo Trying Node.js server...
    node -e "const http=require('http'),fs=require('fs'),path=require('path');const server=http.createServer((req,res)=>{let filePath=path.join('.',req.url==='/'?'/index.html':req.url);if(fs.existsSync(filePath)&&fs.statSync(filePath).isFile()){fs.createReadStream(filePath).pipe(res);}else{res.statusCode=404;res.end('Not Found');}});server.listen(8080,()=>console.log('Server running at http://localhost:8080/'));"
)

pause
