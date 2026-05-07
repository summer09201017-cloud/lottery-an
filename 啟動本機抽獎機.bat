@echo off
chcp 65001 >nul
title 隨機抽獎機 — 本機伺服器
cd /d "%~dp0"

echo.
echo ===========================================
echo   隨機抽獎機 ^| 本機伺服器
echo ===========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [錯誤] 找不到 Node.js，請先到 https://nodejs.org 下載安裝 LTS 版。
    echo.
    pause
    exit /b 1
)

if not exist node_modules (
    echo [初次執行] 安裝相依套件中，約需 1-2 分鐘...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [錯誤] 套件安裝失敗，請檢查網路後再試。
        pause
        exit /b 1
    )
    echo.
)

echo 啟動 dev server...
echo 約 5 秒後瀏覽器會自動開啟 http://localhost:5173/。按 Ctrl+C 可結束。
echo 想用同網段手機測試：終端機會印出 Network: 開頭的網址。
echo.

REM 背景排程：等 5 秒後用預設瀏覽器開啟。
REM 用 PowerShell hidden window，比 vite --open 在中文路徑下更穩定。
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 5; Start-Process 'http://localhost:5173/'"

call npm run dev -- --host

echo.
echo 伺服器已關閉。
pause
