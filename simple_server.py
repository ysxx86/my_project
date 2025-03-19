# -*- coding: utf-8 -*-
"""
简化版班主任管理系统服务器 - 8080端口
"""
import os
import sys
from flask import Flask

# 创建一个简单的代理应用来避免重复路由定义问题
from server import app

if __name__ == '__main__':
    print("\n=============== 班主任管理系统服务器 - 简化版 ===============")
    print("服务器正在启动，请访问: http://localhost:8080")
    print("按 Ctrl+C 可停止服务器\n")
    
    # 在端口8080上启动
    app.run(host='0.0.0.0', port=8080, debug=True)
