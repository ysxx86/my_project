# -*- coding: utf-8 -*-
"""
热重载服务器启动脚本
"""
import os
import sys
import time
import logging
import threading
import subprocess
from pathlib import Path
from waitress import serve
import werkzeug.serving
import importlib.util

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("热重载服务器")

# 加载 Flask 应用
def load_app():
    """动态加载 Flask 应用"""
    try:
        spec = importlib.util.spec_from_file_location("server", "server.py")
        server = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(server)
        return server.app
    except Exception as e:
        logger.error(f"加载应用失败: {e}", exc_info=True)
        return None

# 启动热重载服务器
def run_server():
    """启动带有热重载功能的服务器"""
    app = load_app()
    if not app:
        logger.error("无法加载应用，服务器无法启动")
        return

    # 设置热重载器
    reloader = werkzeug.serving.StaticFilesHandler(app, "static")
    
    # 启动重载监控线程
    reloader_thread = threading.Thread(
        target=werkzeug.serving._reloader_stat,
        args=(
            [
                "server.py", 
                "utils", 
                "pages", 
                "templates", 
                "js", 
                "css"
            ], 
            interval=1
        )
    )
    reloader_thread.daemon = True
    reloader_thread.start()
    
    logger.info("热重载监控已启动，监控文件变化...")
    
    # 用Waitress启动服务器
    logger.info("启动Waitress服务器在 http://127.0.0.1:8080")
    try:
        serve(app, host='0.0.0.0', port=8080)
    except KeyboardInterrupt:
        logger.info("服务器已停止")
    except Exception as e:
        logger.error(f"服务器运行出错: {e}", exc_info=True)

if __name__ == "__main__":
    print("班主任管理系统服务器（带热重载）正在启动...")
    print("按 Ctrl+C 可以停止服务器")
    run_server()
