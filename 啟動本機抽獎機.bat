@echo off
title 隨機抽獎機 - 本機伺服器
cd /d "%~dp0"

echo.
echo ===========================================
echo   隨機抽獎機 - 本機伺服器
echo ===========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [錯誤] 找不到 Node.js
    echo 請先到 https://nodejs.org 下載安裝 LTS 版。
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
echo 約 5 秒後瀏覽器會自動開啟 http://localhost:5173/
echo 按 Ctrl+C 可結束。同網段手機測試請看終端機印出的 Network: 網址。
echo.

start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 5; Start-Process 'http://localhost:5173/'"

call npm run dev -- --host

echo.
echo 伺服器已關閉。
pause