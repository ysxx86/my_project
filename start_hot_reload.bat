@echo off
echo 正在启动带有热更新功能的班主任管理系统服务器...
echo.

:: 创建日志目录
if not exist logs mkdir logs

:: 检查虚拟环境
if exist venv (
    call venv\Scripts\activate
) else (
    echo 正在创建虚拟环境...
    python -m venv venv
    call venv\Scripts\activate
    echo 正在安装依赖...
    pip install -r requirements.txt
    pip install gunicorn
)

:: 启动服务器
python start_server.py

:: 如果服务器异常退出
echo.
echo 服务器已停止运行
pause
