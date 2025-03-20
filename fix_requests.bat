@echo off
echo ======================================================
echo 修复缺失的requests模块
echo ======================================================
echo.

REM 显示当前Python
echo 当前Python路径:
where python
python --version
echo.

echo 直接安装requests模块...
python -m pip install requests==2.31.0 --no-cache-dir -v

echo.
echo 检查requests模块:
python -c "import requests; print('requests模块已成功安装!')" || echo "requests模块安装失败!"

echo.
echo 如果仍然失败，请尝试以下操作：
echo 1. 以管理员身份运行此脚本
echo 2. 运行命令: pip install --user requests==2.31.0
echo 3. 检查是否有多个Python安装，并确保使用正确的版本
echo.

pause 