# -*- coding: utf-8 -*-
"""
基于 watchdog 的自定义热重载服务器
可以监控指定文件和目录的变化，自动重启 Gunicorn 服务器
"""
import os
import sys
import time
import subprocess
import signal
import logging
from pathlib import Path

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/hot_reload.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("热重载服务器")

# 确保日志目录存在
log_dir = Path("logs")
if not log_dir.exists():
    log_dir.mkdir(parents=True)

# 安装必要的依赖
def install_dependencies():
    required_packages = ["gunicorn", "watchdog"]
    for package in required_packages:
        try:
            __import__(package)
            logger.info(f"已安装 {package}")
        except ImportError:
            logger.info(f"正在安装 {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            logger.info(f"{package} 安装完成")

# 监控文件变化
def start_file_watcher(server_process):
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
    
    class ChangeHandler(FileSystemEventHandler):
        def __init__(self, server_process, restart_server_func):
            self.server_process = server_process
            self.restart_server = restart_server_func
            self.last_restart_time = time.time()
            self.debounce_time = 2  # 防抖动时间（秒）
        
        def on_any_event(self, event):
            # 忽略目录变化和临时文件
            if event.is_directory or event.src_path.endswith(('.pyc', '.pyo', '.pyd', '.git')):
                return
                
            # 只监控 Python 文件、HTML、CSS 和 JS 文件
            if not any(event.src_path.endswith(ext) for ext in ('.py', '.html', '.css', '.js')):
                return
                
            # 防抖动处理
            current_time = time.time()
            if current_time - self.last_restart_time < self.debounce_time:
                return
                
            self.last_restart_time = current_time
            logger.info(f"检测到文件变化: {event.src_path}")
            self.restart_server(self.server_process)
    
    observer = Observer()
    # 监控当前目录及子目录
    paths_to_watch = [
        ".", 
        "utils", 
        "templates", 
        "pages", 
        "js", 
        "css"
    ]
    
    for path in paths_to_watch:
        if os.path.exists(path):
            observer.schedule(
                ChangeHandler(server_process, restart_server),
                path=path,
                recursive=True
            )
            logger.info(f"监控目录: {path}")
    
    observer.start()
    logger.info("文件监控已启动")
    
    try:
        while server_process.poll() is None:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("接收到关闭信号")
    finally:
        observer.stop()
        observer.join()

# 启动 Gunicorn 服务器
def start_server():
    # 设置环境变量
    os.environ["FLASK_ENV"] = "development"
    os.environ["PYTHONIOENCODING"] = "utf-8"
    
    # 构建 Gunicorn 命令
    cmd = [
        sys.executable, "-m", "gunicorn",
        "server:app",
        "--bind", "0.0.0.0:8080",
        "--workers", "1",  # 开发环境使用单进程更方便调试
        "--timeout", "120",
        "--access-logfile", "logs/gunicorn_access.log",
        "--error-logfile", "logs/gunicorn_error.log",
        "--log-level", "info"
    ]
    
    logger.info(f"启动服务器: {' '.join(cmd)}")
    
    # 使用 subprocess.Popen 启动服务器
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding='utf-8'
    )
    
    logger.info(f"服务器进程 PID: {process.pid}")
    return process

# 重启服务器
def restart_server(process):
    if process and process.poll() is None:
        logger.info(f"正在终止服务器进程 (PID: {process.pid})...")
        
        # Windows 下使用 taskkill 强制终止进程树
        if os.name == 'nt':
            subprocess.call(['taskkill', '/F', '/T', '/PID', str(process.pid)])
        else:
            # Linux/Mac 下使用 SIGTERM 信号
            os.kill(process.pid, signal.SIGTERM)
            
        # 等待进程结束
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            logger.warning("服务器进程未在预期时间内终止，强制结束")
            if os.name == 'nt':
                subprocess.call(['taskkill', '/F', '/PID', str(process.pid)])
            else:
                os.kill(process.pid, signal.SIGKILL)
    
    logger.info("正在重启服务器...")
    return start_server()

def main():
    # 安装依赖
    install_dependencies()
    
    try:
        # 启动服务器
        server_process = start_server()
        
        # 启动文件监控
        start_file_watcher(server_process)
        
    except KeyboardInterrupt:
        logger.info("接收到用户中断，正在关闭...")
    except Exception as e:
        logger.error(f"发生错误: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
    
    logger.info("服务器已退出")

if __name__ == "__main__":
    main()
