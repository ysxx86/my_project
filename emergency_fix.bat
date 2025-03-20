@echo off
echo ======================================================
echo 班主任管理系统 - 紧急修复工具
echo ======================================================
echo.

echo [诊断] 当前环境信息:
echo Python位置:
where python
python --version
echo.
echo Pip位置:
where pip
echo.

echo [步骤1] 清理虚拟环境...
if exist venv (
    echo 删除现有虚拟环境...
    rmdir /S /Q venv
    echo 虚拟环境已删除。
) else (
    echo 未发现虚拟环境，跳过清理。
)

echo [步骤2] 尝试直接安装关键依赖...
echo 使用python -m pip安装requests...
python -m pip install requests==2.31.0 --force-reinstall --no-cache-dir

echo 使用python -m pip安装reportlab...
python -m pip install reportlab==4.1.0 --force-reinstall --no-cache-dir

echo [步骤3] 验证安装结果...
python -c "import sys; print('Python路径:', sys.executable)"
python -c "import requests; print('requests已安装，版本:', requests.__version__)" || echo "requests安装失败!"
python -c "import reportlab; print('reportlab已安装，版本:', reportlab.Version)" || echo "reportlab安装失败!"

echo.
echo [步骤4] 启动系统...
echo.
echo 是否现在启动系统? (Y/N)
set /p choice=选择: 
if /i "%choice%"=="Y" (
    echo 启动班主任管理系统...
    python server.py
) else (
    echo 操作已取消。
)

echo.
echo ======================================================
echo 修复操作完成!
echo ======================================================

pause 