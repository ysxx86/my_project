# -*- coding: utf-8 -*-
"""
Windows兼容的热重载服务器
使用Waitress作为WSGI服务器，结合Werkzeug的热重载功能
"""
import os
import sys
import logging
import subprocess
from pathlib import Path

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join("logs", "server.log"), encoding="utf-8", mode="a"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("热重载服务器")

# 确保日志目录存在
if not os.path.exists("logs"):
    os.makedirs("logs")
    logger.info("创建日志目录: logs")

def install_packages():
    """安装必要的包"""
    packages = ["waitress", "flask", "werkzeug"]
    for package in packages:
        try:
            __import__(package)
            logger.info(f"{package} 已安装")
        except ImportError:
            logger.info(f"安装 {package}...")
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", package])
                logger.info(f"{package} 安装成功")
            except subprocess.CalledProcessError as e:
                logger.error(f"{package} 安装失败: {e}")
                return False
    return True

def create_reload_server_script():
    """创建热重载服务器启动脚本"""
    script_path = os.path.join(os.getcwd(), "reload_server_helper.py")
    with open(script_path, "w", encoding="utf-8") as f:
        f.write('''# -*- coding: utf-8 -*-
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
''')
    logger.info(f"热重载服务器启动脚本已创建: {script_path}")
    return script_path

def run_reload_server():
    """运行热重载服务器"""
    if not install_packages():
        logger.error("安装依赖包失败，无法启动服务器")
        return False
    
    script_path = create_reload_server_script()
    
    logger.info("启动热重载服务器...")
    cmd = [sys.executable, script_path]
    
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8'
        )
        
        logger.info(f"服务器已启动，进程ID: {process.pid}")
        
        # 实时输出日志
        for line in process.stdout:
            print(line, end='')
            
        return_code = process.wait()
        if return_code != 0:
            logger.error(f"服务器异常退出，退出码: {return_code}")
            return False
            
        return True
        
    except KeyboardInterrupt:
        logger.info("收到中断信号，正在停止服务器...")
        return True
    except Exception as e:
        logger.error(f"启动服务器时出错: {e}")
        return False

if __name__ == "__main__":
    print("==== 班主任管理系统热重载服务器 ====")
    print("Windows兼容版本 - 使用Waitress + Werkzeug")
    print()
    run_reload_server()
