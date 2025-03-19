@echo off
chcp 65001 >nul
echo 正在启动班主任管理系统...

REM 检查Python是否已安装
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误: 未找到Python，请先安装Python 3.6+
    echo 您可以从 https://www.python.org/downloads/ 下载并安装Python
    pause
    exit /b 1
)

REM 显示Python版本
python --version

REM 创建templates和uploads文件夹
if not exist templates mkdir templates
if not exist uploads mkdir uploads

REM 安装依赖
echo 正在安装必要的依赖...
pip install -r requirements.txt

REM 如果有必要，创建数据库目录
if not exist data mkdir data

REM 启动后端服务器
echo 正在启动后端服务器...
start "班主任管理系统后端" python server.py

REM 等待服务器启动
echo 等待服务器启动...
timeout /t 3 /nobreak >nul

REM 打开网页
echo 正在打开网页界面...
start "" "http://localhost:8080"

echo.
echo 班主任管理系统已启动。请使用浏览器访问 http://localhost:8080
echo 服务器运行在后台。关闭命令窗口将停止服务器。
echo.

pause 