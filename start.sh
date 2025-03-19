#!/bin/bash

echo "正在启动班主任管理系统..."

# 检查Python是否已安装
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到Python，请先安装Python 3.6+"
    echo "您可以从 https://www.python.org/downloads/ 下载并安装Python"
    exit 1
fi

# 显示Python版本
python3 --version

# 创建必要的目录
mkdir -p templates uploads

# 安装依赖
echo "正在安装必要的依赖..."
pip3 install -r requirements.txt

# 启动后端服务器
echo "正在启动后端服务器..."
python3 server.py &
SERVER_PID=$!

# 等待服务器启动
echo "等待服务器启动..."
sleep 3

# 尝试打开浏览器
echo "正在尝试打开网页界面..."
if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:8080" &
elif command -v open &> /dev/null; then
    open "http://localhost:8080" &
else
    echo "无法自动打开浏览器，请手动访问 http://localhost:8080"
fi

echo ""
echo "班主任管理系统已启动。请使用浏览器访问 http://localhost:8080"
echo "服务器运行在后台 (PID: $SERVER_PID)。"
echo "按 Ctrl+C 停止服务器。"
echo ""

# 等待用户中断
wait $SERVER_PID 