@echo off
chcp 65001 >nul
cd /d "%~dp0app\frontend"

echo ========================================
echo   霓虹战机 · Neon Fighter
echo ========================================
echo.
echo [1] 本地开发 (pnpm dev) — 推荐
echo [2] 生产构建预览 (pnpm preview)
echo [3] 单文件离线版构建 (仅备用)
echo.
set /p choice="请选择 (1/2/3): "

if "%choice%"=="1" (
    echo.
    echo [INFO] 启动开发服务器，浏览器将自动打开...
    start http://localhost:3000
    call pnpm dev
) else if "%choice%"=="2" (
    echo.
    echo [INFO] 正在构建生产版本...
    call pnpm build
    if errorlevel 1 (
        echo [ERROR] 构建失败
        pause
        exit /b 1
    )
    echo [INFO] 启动预览服务器...
    start http://localhost:4173
    call pnpm preview
) else if "%choice%"=="3" (
    echo.
    echo [INFO] 正在构建单文件离线版...
    call pnpm build:standalone
    if errorlevel 1 (
        echo [ERROR] 构建失败
        pause
        exit /b 1
    )
    echo [INFO] 构建完成，正在打开...
    start "" "dist-standalone\index.html"
) else (
    echo 无效选择，按任意键退出...
    pause >nul
)

