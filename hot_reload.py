# -*- coding: utf-8 -*-
"""
Windows兼容的Flask应用热重载服务器
使用Flask内置的热重载功能和waitress作为生产服务器
"""
import os
import sys
import time
import logging
import threading
import subprocess
from pathlib import Path

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join("logs", "hot_reload.log"), encoding="utf-8", mode="a"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("热重载服务器")

# 确保日志目录存在
if not os.path.exists("logs"):
    os.makedirs("logs")
    logger.info("创建日志目录: logs")

def install_dependencies():
    """安装必要的依赖包"""
    required_packages = ["waitress", "flask", "flask-cors"]
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
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

def run_waitress_server():
    """运行Waitress生产服务器"""
    try:
        from waitress import serve
        import server
        
        logger.info("启动Waitress生产服务器在 http://0.0.0.0:8080")
        print("\n班主任管理系统服务器已启动!")
        print("访问地址: http://localhost:8080")
        print("按 Ctrl+C 可以停止服务器\n")
        
        serve(server.app, host='0.0.0.0', port=8080)
        return True
        
    except KeyboardInterrupt:
        logger.info("收到中断信号，停止服务器...")
        return True
    except Exception as e:
        logger.error(f"启动Waitress服务器时出错: {e}")
        return False

def main():
    """主函数"""
    print("==== 班主任管理系统服务器 ====")
    print("Windows兼容版本")
    print()
    
    # 安装依赖
    if not install_dependencies():
        logger.error("安装依赖失败，无法启动服务器")
        return
        
    # 提供服务器选择选项
    print("请选择服务器启动模式:")
    print("1. 开发模式 (带热重载)")
    print("2. 生产模式 (稳定但无热重载)")
    
    choice = input("请输入选择 (1/2，默认1): ").strip() or "1"
    
    if choice == "1":
        print("\n启动开发模式服务器 (带热重载功能)...")
        run_flask_dev_server()
    else:
        print("\n启动生产模式服务器...")
        run_waitress_server()

if __name__ == "__main__":
    main()
