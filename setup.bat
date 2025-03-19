@echo off
:: 学生评语管理系统安装脚本 (Windows版)
echo === 学生评语管理系统安装脚本 ===
echo.

:: 检查pip是否可用
where pip >nul 2>nul
if %errorlevel% neq 0 (
    echo X 未检测到pip，请先安装Python和pip
    pause
    exit /b 1
)
echo √ pip已安装

:: 安装依赖
echo 正在安装Python依赖...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo X 依赖安装失败，请检查错误信息
    pause
    exit /b 1
)
echo √ 依赖安装成功

:: 检查字体目录
echo 正在检查字体目录...
if not exist utils\fonts mkdir utils\fonts

:: 尝试复制Windows系统字体
set FONT_FOUND=false
if exist C:\Windows\Fonts\simsun.ttc (
    echo 发现Windows SimSun字体，正在复制...
    copy "C:\Windows\Fonts\simsun.ttc" "utils\fonts\SimSun.ttf" >nul
    set FONT_FOUND=true
) else if exist C:\Windows\Fonts\simfang.ttf (
    echo 发现Windows SimFang字体，正在复制...
    copy "C:\Windows\Fonts\simfang.ttf" "utils\fonts\SimSun.ttf" >nul
    set FONT_FOUND=true
)

if "%FONT_FOUND%"=="false" (
    echo 未能自动找到中文字体。
    echo 请手动将中文字体文件复制到 utils\fonts\ 目录，并命名为 SimSun.ttf
)

echo.
echo 安装完成。请运行 python server.py 启动服务器
pause 