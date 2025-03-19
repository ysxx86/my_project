# -*- coding: utf-8 -*-
"""
班主任管理系统服务器启动脚本 - 端口8080版本
"""
import os
import logging
import importlib.util

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/server_8080.log", encoding="utf-8", mode="a"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("服务器启动器")

# 确保日志目录存在
if not os.path.exists("logs"):
    os.makedirs("logs")

def load_app():
    """动态加载Flask应用程序而不执行主程序"""
    try:
        spec = importlib.util.spec_from_file_location("server", "server.py")
        server = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(server)
        return server.app
    except Exception as e:
        logger.error(f"加载应用程序时出错: {str(e)}")
        return None

def run_server():
    """在端口8080上运行服务器"""
    try:
        app = load_app()
        if not app:
            logger.error("无法加载应用程序，无法启动服务器")
            return
            
        print("\n=============== 班主任管理系统服务器 - 端口8080 ===============")
        print("服务器正在启动，请稍候...\n")
        
        # 在端口8080上运行服务器
        app.run(host='0.0.0.0', port=8080, debug=True)
        
    except Exception as e:
        logger.error(f"启动服务器时出错: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())

if __name__ == "__main__":
    run_server()
