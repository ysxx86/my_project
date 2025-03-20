@echo off
echo ======================================================
echo 班主任管理系统 - 环境配置工具
echo ======================================================
echo.

REM 显示Python路径和版本信息（诊断用）
echo [诊断] 检查Python安装信息:
where python
python --version
echo.

REM 创建并激活虚拟环境
echo [步骤1] 创建Python虚拟环境...
if not exist venv (
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo 创建虚拟环境失败! 尝试继续使用系统Python...
    ) else (
        echo 虚拟环境创建成功!
    )
)

REM 激活虚拟环境
if exist venv\Scripts\activate.bat (
    echo 激活虚拟环境...
    call venv\Scripts\activate.bat
    echo 当前Python: 
    where python
    python --version
) else (
    echo 未找到虚拟环境，将使用系统Python。
)

REM 升级pip本身
echo [步骤2] 升级pip...
python -m pip install --upgrade pip

REM 先单独安装关键模块
echo [步骤3] 安装关键依赖...
python -m pip install requests==2.31.0 --no-cache-dir
python -m pip install reportlab==4.1.0 --no-cache-dir

REM 安装其他依赖
echo [步骤4] 安装所有依赖...
python -m pip install -r requirements.txt --no-cache-dir

REM 验证安装
echo [步骤5] 验证模块安装...
echo 检查requests模块:
python -c "import requests; print(f'requests模块已安装 (版本: {requests.__version__})')" || echo "请求模块安装失败!"

echo 检查reportlab模块:
python -c "import reportlab; print(f'reportlab模块已安装 (版本: {reportlab.Version})')" || echo "reportlab模块安装失败!"

echo 检查flask模块:
python -c "import flask; print(f'flask模块已安装 (版本: {flask.__version__})')" || echo "flask模块安装失败!"

echo.
echo ======================================================
echo 环境配置完成!
echo 如果有任何模块未成功安装，请以管理员身份运行此脚本。
echo ======================================================

pause 