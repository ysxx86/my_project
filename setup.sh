#!/bin/bash
# 安装脚本：安装Python依赖并设置字体

echo "=== 学生评语管理系统安装脚本 ==="
echo

# 确保pip可用
if command -v pip >/dev/null 2>&1; then
    echo "✓ pip已安装"
else
    echo "✗ 未检测到pip，请先安装Python和pip"
    exit 1
fi

# 安装依赖
echo "正在安装Python依赖..."
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✓ 依赖安装成功"
else
    echo "✗ 依赖安装失败，请检查错误信息"
    exit 1
fi

# 检查字体目录
echo "正在检查字体目录..."
mkdir -p utils/fonts

# 尝试复制系统字体（仅作为示例，具体路径可能因系统而异）
FONT_FOUND=false

# Windows系统字体位置
if [ -f "C:/Windows/Fonts/simsun.ttc" ]; then
    echo "发现Windows SimSun字体，正在复制..."
    cp "C:/Windows/Fonts/simsun.ttc" utils/fonts/SimSun.ttf
    FONT_FOUND=true
fi

# macOS系统字体
if [ -f "/System/Library/Fonts/PingFang.ttc" ] && [ "$FONT_FOUND" = false ]; then
    echo "发现macOS PingFang字体，正在复制..."
    cp "/System/Library/Fonts/PingFang.ttc" utils/fonts/SimSun.ttf
    FONT_FOUND=true
fi

if [ "$FONT_FOUND" = false ]; then
    echo "未能自动找到中文字体。"
    echo "请手动将中文字体文件复制到 utils/fonts/ 目录，并命名为 SimSun.ttf"
fi

echo
echo "安装完成。请运行 python server.py 启动服务器" 