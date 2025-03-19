@echo off
echo 正在启动自定义热重载服务器...
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
)

:: 启动自定义热重载服务器
python hot_reload_server.py

:: 如果服务器异常退出
echo.
echo 服务器已停止运行
pause
