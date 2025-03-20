@echo off
echo 正在启动班主任管理系统服务器...
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 错误: 未检测到Python，请确保已安装Python并添加到系统PATH中。
    echo 请访问 https://www.python.org/downloads/ 下载并安装Python。
    pause
    exit /b 1
)

REM 检查requests模块
python -c "import requests" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 错误: 缺少必要的Python模块。
    echo 请先运行 setup_env.bat 安装所需依赖。
    echo.
    echo 是否现在运行环境配置? (Y/N)
    set /p choice=选择: 
    if /i "%choice%"=="Y" (
        call setup_env.bat
    ) else (
        echo 操作已取消。请手动运行setup_env.bat后再尝试启动服务器。
        pause
        exit /b 1
    )
)

REM 检查虚拟环境是否存在并激活
if exist venv\Scripts\activate.bat (
    echo 使用虚拟环境...
    call venv\Scripts\activate.bat
) else (
    echo 使用系统Python环境...
)

echo 正在启动服务器...
echo.
echo 如果启动失败，请尝试运行setup_env.bat配置环境。
echo.

REM 启动服务器
python server.py

pause 