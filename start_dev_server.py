# -*- coding: utf-8 -*-
"""
Windows兼容的Flask应用热重载服务器
自动启动开发模式(带热重载)
"""
import os
import sys
import time
import logging
import subprocess
from pathlib import Path

# 设置日志
logs_dir = "logs"
os.makedirs(logs_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(logs_dir, "dev_server.log"), encoding="utf-8", mode="a"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("开发服务器")

def install_dependencies():
    """安装必要的依赖包"""
    required_packages = ["flask"]
    for package in required_packages:
        try:
            __import__(package)
            logger.info(f"{package} 已安装")
        except ImportError:
            logger.info(f"正在安装 {package}...")
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", package])
                logger.info(f"{package} 安装成功")
            except Exception as e:
                logger.error(f"安装 {package} 失败: {e}")
                return False
    return True

def run_flask_dev_server():
    """运行Flask开发服务器（带热重载）"""
    try:
        # 设置Flask环境变量
        os.environ["FLASK_APP"] = "server.py"
        os.environ["FLASK_ENV"] = "development"
        os.environ["FLASK_DEBUG"] = "1"
        
        # 启动Flask开发服务器
        cmd = [sys.executable, "-m", "flask", "run", "--host=0.0.0.0", "--port=8080"]
        
        logger.info(f"启动Flask开发服务器: {' '.join(cmd)}")
        print("\n班主任管理系统开发服务器(带热重载)启动中...")
        print("修改Python文件后，服务器将自动重新加载。\n")
        
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8'
        )
        
        logger.info(f"Flask开发服务器已启动，PID: {process.pid}")
        
        # 输出服务器日志
        for line in process.stdout:
            print(line, end='')
            
        return_code = process.wait()
        if return_code != 0:
            logger.error(f"Flask开发服务器异常退出，退出码: {return_code}")
            return False
            
        return True
        
    except KeyboardInterrupt:
        logger.info("收到中断信号，停止服务器...")
        return True
    except Exception as e:
        logger.error(f"启动Flask开发服务器时出错: {e}")
        return False

if __name__ == "__main__":
    print("==== 班主任管理系统开发服务器 ====")
    print("Windows兼容版本 - 带热重载功能")
    print()
    
    # 安装依赖
    if install_dependencies():
        # 直接启动开发模式服务器
        run_flask_dev_server()
    else:
        print("初始化失败，无法启动服务器。")
        input("按回车键退出...")
