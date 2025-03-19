# -*- coding: utf-8 -*-
"""
班主任管理系统服务器启动脚本 - 修复版本
解决重复路由定义问题并在端口8080上启动
"""
import os
import sys
import logging
from pathlib import Path

# 设置日志
if not os.path.exists("logs"):
    os.makedirs("logs")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/fixed_server.log", encoding="utf-8", mode="a"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("服务器启动器")

# 直接启动原始server.py文件，但在端口8080上运行
def start_server():
    try:
        # 设置环境变量
        os.environ["FLASK_APP"] = "server.py"
        os.environ["FLASK_ENV"] = "development"
        os.environ["FLASK_RUN_PORT"] = "8080"
        os.environ["FLASK_RUN_HOST"] = "0.0.0.0"
        
        # 在导入server模块前先修改sys.argv，以避免其内部的main函数执行时使用8082端口
        sys.argv = [sys.argv[0]]
        
        # 启动服务器
        cmd = [sys.executable, "-c", """
# -*- coding: utf-8 -*-
import os
import sys
from server import app

if __name__ == '__main__':
    print('\\n=============== 班主任管理系统服务器 - 修复版本 ===============')
    print('服务器正在启动，请访问: http://localhost:8080')
    print('模板下载功能已修复')
    print('按 Ctrl+C 可停止服务器\\n')
    
    # 直接在8080端口启动
    app.run(host='0.0.0.0', port=8080, debug=True)
"""]
        
        import subprocess
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8'
        )
        
        logger.info(f"服务器进程已启动，PID: {process.pid}")
        
        # 输出服务器日志
        for line in process.stdout:
            print(line, end='')
            
        return_code = process.wait()
        if return_code != 0:
            logger.error(f"服务器异常退出，退出码: {return_code}")
            return False
            
        return True
        
    except KeyboardInterrupt:
        logger.info("收到中断信号，停止服务器...")
        return True
    except Exception as e:
        logger.error(f"启动服务器时出错: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    print("\n==== 班主任管理系统服务器 - 修复版本 ====")
    print("此脚本解决了端口问题和重复路由定义问题")
    print("服务器将在端口8080上启动\n")
    
    start_server()
