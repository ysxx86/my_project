# -*- coding: utf-8 -*-
import json
from flask import jsonify, request
from dashboard.db_manager import DashboardManager

class DashboardAPI:
    """处理仪表盘相关的API请求"""
    
    def __init__(self, app):
        """初始化API处理器，注册路由"""
        self.app = app
        self.db_manager = DashboardManager()
        self._register_routes()
    
    def _register_routes(self):
        """注册API路由"""
        # 获取仪表盘基本信息
        self.app.add_url_rule('/api/dashboard/info', 'dashboard_info', self.get_dashboard_info, methods=['GET'])
        
        # 获取评语完成情况
        self.app.add_url_rule('/api/dashboard/comments', 'dashboard_comments', self.get_comments_info, methods=['GET'])
        
        # 获取成绩录入情况
        self.app.add_url_rule('/api/dashboard/grades', 'dashboard_grades', self.get_grades_info, methods=['GET'])
        
        # 获取报告生成情况
        self.app.add_url_rule('/api/dashboard/reports', 'dashboard_reports', self.get_reports_info, methods=['GET'])
        
        # 获取学科成绩分布
        self.app.add_url_rule('/api/dashboard/grade-distribution', 'grade_distribution', self.get_grade_distribution, methods=['GET'])
        
        # 获取待办事项
        self.app.add_url_rule('/api/dashboard/todos', 'dashboard_todos', self.get_todos, methods=['GET'])
        
        # 获取最近活动
        self.app.add_url_rule('/api/dashboard/activities', 'dashboard_activities', self.get_activities, methods=['GET'])
    
    def get_dashboard_info(self):
        """获取仪表盘基本信息"""
        try:
            current_class = self.db_manager.get_current_class()
            current_semester = self.db_manager.get_current_semester()
            total_students = self.db_manager.get_total_students()
            
            comments = self.db_manager.get_comments_completion()
            grades = self.db_manager.get_grades_completion()
            reports = self.db_manager.get_reports_generation()
            
            return jsonify({
                'status': 'success',
                'data': {
                    'current_class': current_class,
                    'current_semester': current_semester,
                    'total_students': total_students,
                    'comments_completed': comments['completed'],
                    'comments_percentage': comments['percentage'],
                    'grades_completed': grades['all_completed'],
                    'grades_percentage': round((grades['all_completed'] / grades['total'] * 100) if grades['total'] > 0 else 0, 1),
                    'reports_ready': reports['ready'],
                    'reports_percentage': reports['percentage']
                }
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    def get_comments_info(self):
        """获取评语完成情况"""
        try:
            comments = self.db_manager.get_comments_completion()
            return jsonify({
                'status': 'success',
                'data': comments
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    def get_grades_info(self):
        """获取成绩录入情况"""
        try:
            grades = self.db_manager.get_grades_completion()
            return jsonify({
                'status': 'success',
                'data': grades
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    def get_reports_info(self):
        """获取报告生成情况"""
        try:
            reports = self.db_manager.get_reports_generation()
            return jsonify({
                'status': 'success',
                'data': reports
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    def get_grade_distribution(self):
        """获取学科成绩分布"""
        try:
            distribution = self.db_manager.get_grade_distribution()
            return jsonify({
                'status': 'success',
                'data': distribution
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    def get_todos(self):
        """获取待办事项"""
        try:
            todos = self.db_manager.get_todo_list()
            return jsonify({
                'status': 'success',
                'data': todos
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    def get_activities(self):
        """获取最近活动"""
        try:
            limit = request.args.get('limit', default=5, type=int)
            activities = self.db_manager.get_recent_activities(limit=limit)
            return jsonify({
                'status': 'success',
                'data': activities
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500

# 用于测试
if __name__ == "__main__":
    from flask import Flask
    app = Flask(__name__)
    api = DashboardAPI(app)
    app.run(debug=True) 