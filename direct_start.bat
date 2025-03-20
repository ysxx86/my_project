@echo off
echo ======================================================
echo 班主任管理系统 - 直接启动脚本
echo ======================================================
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 错误: 未检测到Python安装!
    echo 请安装Python并确保已添加到系统PATH。
    pause
    exit /b 1
)

REM 显示当前Python信息
echo 当前使用的Python:
python -c "import sys; print(sys.executable)"
python --version
echo.

REM 检查关键模块
python -c "import requests" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 警告: 缺少requests模块!
    echo 是否安装? (Y/N)
    set /p install=选择: 
    if /i "%install%"=="Y" (
        echo 安装requests模块...
        python -m pip install requests==2.31.0 --no-cache-dir
    ) else (
        echo 未安装requests模块，服务器可能无法正常启动。
    )
)

python -c "import reportlab" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 警告: 缺少reportlab模块!
    echo 是否安装? (Y/N)
    set /p install=选择: 
    if /i "%install%"=="Y" (
        echo 安装reportlab模块...
        python -m pip install reportlab==4.1.0 --no-cache-dir
    ) else (
        echo 未安装reportlab模块，PDF功能可能无法使用。
    )
)

echo.
echo 启动服务器...
echo 如果出现模块导入错误，请运行emergency_fix.bat进行修复。
echo.

REM 直接启动服务器
python server.py

pause 