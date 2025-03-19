# -*- coding: utf-8 -*-
# Gunicorn 配置文件
import multiprocessing

# 绑定的IP和端口
bind = "0.0.0.0:8080"

# 工作进程数量，建议设置为CPU核心数 x 2 + 1
workers = multiprocessing.cpu_count() * 2 + 1

# 工作模式
worker_class = "sync"

# 每个工作进程处理的最大并发量
worker_connections = 1000

# 超时时间（秒）
timeout = 30

# 允许处理的最大请求数，超过后工作进程会重启
max_requests = 2000
max_requests_jitter = 200

# 守护进程运行
daemon = False

# 日志配置
accesslog = "logs/gunicorn_access.log"
errorlog = "logs/gunicorn_error.log"
loglevel = "info"

# 热重载相关配置
reload = True  # 启用热重载
reload_engine = "auto"

# 监控变更的文件或目录列表
reload_extra_files = [
    "server.py",
    "utils/*.py",
    "templates/*.html",
]

# 设置环境变量
raw_env = [
    "FLASK_ENV=development",
    "PYTHONIOENCODING=utf-8"
]
