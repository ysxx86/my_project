@echo off
echo 正在启动班主任管理系统服务器...
echo 此版本支持在导入学生时先清空数据库，然后再导入新学生。
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 未检测到Python，请确保已安装Python并添加到系统PATH中。
    echo 请访问 https://www.python.org/downloads/ 下载并安装Python。
    pause
    exit /b 1
)

REM 检查虚拟环境是否存在
if exist venv\Scripts\activate (
    echo 检测到虚拟环境，将使用虚拟环境。
    call venv\Scripts\activate
) else (
    echo 未检测到虚拟环境，将使用系统Python。
)

REM 检查依赖
python -c "import flask" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 正在安装必要的依赖...
    pip install -r requirements.txt
)

REM 启动服务器
python server.py

pause 