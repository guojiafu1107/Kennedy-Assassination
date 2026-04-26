# 肯尼迪档案库 - 本地服务器启动器

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   肯尼迪档案库 - 本地服务器启动器" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$port = 8080

# 检查端口是否被占用
$portInUse = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "警告: 端口 $port 已被占用，尝试使用其他端口..." -ForegroundColor Yellow
    $port = 8081
}

Write-Host "正在启动服务器，请稍候..." -ForegroundColor Green
Write-Host "访问地址: http://localhost:$port" -ForegroundColor Yellow
Write-Host ""
Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Gray
Write-Host ""

# 尝试启动服务器
try {
    # 尝试使用 Python
    if (Get-Command python -ErrorAction SilentlyContinue) {
        Write-Host "使用 Python 启动服务器..." -ForegroundColor Green
        python -m http.server $port
    }
    # 尝试使用 Node.js
    elseif (Get-Command node -ErrorAction SilentlyContinue) {
        Write-Host "使用 Node.js 启动服务器..." -ForegroundColor Green
        $serverCode = @"
const http = require('http');
const fs = require('fs');
const path = require('path');
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
    let filePath = path.join('.', req.url === '/' ? '/index.html' : decodeURIComponent(req.url));
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen($port, () => console.log('Server running at http://localhost:$port/'));
"@
        node -e $serverCode
    }
    else {
        Write-Host "错误: 未找到 Python 或 Node.js，请安装其中一个" -ForegroundColor Red
        Read-Host "按 Enter 退出"
    }
} catch {
    Write-Host "启动失败: $_" -ForegroundColor Red
    Read-Host "按 Enter 退出"
}
