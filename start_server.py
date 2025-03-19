# -*- coding: utf-8 -*-
"""
启动带热更新的 Gunicorn 服务器
"""
import os
import sys
import subprocess
import logging
from pathlib import Path

# 配置日志
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

def start_server():
    """
    使用 Gunicorn 启动服务器，并启用热更新功能
    """
    try:
        # 检查 gunicorn 是否已安装
        try:
            import gunicorn
            logger.info("检测到 Gunicorn 已安装")
        except ImportError:
            logger.warning("未检测到 Gunicorn，正在安装...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", "gunicorn"])
            logger.info("Gunicorn 安装完成")
        
        # 设置环境变量
        os.environ["FLASK_ENV"] = "development"
        os.environ["PYTHONIOENCODING"] = "utf-8"
        
        # 构建启动命令
        cmd = [
            sys.executable, "-m", "gunicorn",
            "--config", "gunicorn_config.py",
            "server:app"
        ]
        
        logger.info("正在启动 Gunicorn 服务器...")
        logger.info(f"执行命令: {' '.join(cmd)}")
        
        # 执行命令并实时输出日志
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8'
        )
        
        # 实时输出日志
        for line in process.stdout:
            print(line, end='')
            sys.stdout.flush()
        
        # 等待进程结束
        return_code = process.wait()
        
        if return_code != 0:
            logger.error(f"Gunicorn 启动失败，错误码: {return_code}")
            return False
            
        return True
        
    except Exception as e:
        logger.error(f"启动服务器时出错: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    start_server()
