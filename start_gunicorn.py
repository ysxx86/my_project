# -*- coding: utf-8 -*-
"""
启动带热更新的Gunicorn服务器的Python脚本
"""
import os
import sys
import subprocess
import logging
from pathlib import Path

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("启动脚本")

# 确保日志目录存在
log_dir = Path("logs")
if not log_dir.exists():
    log_dir.mkdir(parents=True)
    logger.info(f"创建日志目录: {log_dir}")

def install_package(package_name):
    """安装Python包"""
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', package_name])
        logger.info(f"成功安装 {package_name}")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"安装 {package_name} 失败: {str(e)}")
        return False

def check_gunicorn():
    """检查Gunicorn是否已安装，如果没有则安装"""
    try:
        import gunicorn
        logger.info("Gunicorn 已安装")
        return True
    except ImportError:
        logger.info("正在安装 Gunicorn...")
        return install_package("gunicorn")

def run_gunicorn():
    """启动Gunicorn服务器"""
    if not check_gunicorn():
        logger.error("无法安装Gunicorn，终止启动")
        return False
    
    # 设置环境变量
    os.environ["FLASK_ENV"] = "development"
    os.environ["PYTHONIOENCODING"] = "utf-8"
    
    # 检查配置文件是否存在
    config_path = Path("gunicorn_config.py")
    if not config_path.exists():
        logger.error("找不到gunicorn_config.py配置文件")
        return False
    
    # 启动Gunicorn服务器
    cmd = [
        sys.executable, '-m', 'gunicorn',
        '--config', 'gunicorn_config.py',
        'server:app'
    ]
    
    logger.info(f"启动命令: {' '.join(cmd)}")
    
    try:
        # 使用subprocess.run执行命令并实时输出日志
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8'
        )
        
        logger.info(f"Gunicorn服务器已启动，PID: {process.pid}")
        
        # 打印输出直到进程结束
        for line in process.stdout:
            print(line, end='')
        
        return_code = process.wait()
        if return_code != 0:
            logger.error(f"Gunicorn服务器异常退出，退出码: {return_code}")
            return False
            
        return True
        
    except Exception as e:
        logger.error(f"启动Gunicorn服务器时出错: {str(e)}")
        return False

if __name__ == "__main__":
    print("正在启动带热更新的班主任管理系统服务器...")
    run_gunicorn()
