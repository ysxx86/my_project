# -*- coding: utf-8 -*-
"""
直接启动班主任管理系统服务器 - 端口8080
"""
# 导入必要的模块
import os
import sys
import importlib

# 设置环境变量
os.environ["FLASK_APP"] = "server.py"
os.environ["FLASK_DEBUG"] = "1"

# 主函数
if __name__ == "__main__":
    print("\n=============== 班主任管理系统服务器 ===============")
    print("服务器正在端口8080上启动...")
    print("请访问: http://localhost:8080")
    print("按Ctrl+C停止服务器\n")
    
    # 尝试导入server模块中的app对象
    try:
        from server import app
        
        # 直接在8080端口上运行app
        app.run(host='0.0.0.0', port=8080, debug=True)
    except Exception as e:
        print(f"启动服务器时出错: {e}")
        sys.exit(1)
