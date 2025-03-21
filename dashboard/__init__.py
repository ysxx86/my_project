# -*- coding: utf-8 -*-
from dashboard.db_manager import DashboardManager
from dashboard.api_handler import DashboardAPI
from dashboard.todo_manager import TodoManager, TodoAPI

def init_dashboard(app):
    """初始化仪表盘功能并集成到Flask应用中"""
    # 初始化API处理器
    dashboard_api = DashboardAPI(app)
    todo_api = TodoAPI(app)
    
    # 返回所有管理器，便于其他模块使用
    return {
        'dashboard_manager': DashboardManager(),
        'todo_manager': TodoManager(),
        'dashboard_api': dashboard_api,
        'todo_api': todo_api
    } 