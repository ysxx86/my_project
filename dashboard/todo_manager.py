# -*- coding: utf-8 -*-
import sqlite3
import json
import os
import datetime
from flask import jsonify, request

class TodoManager:
    """待办事项管理模块，支持简化版番茄时钟功能"""
    
    def __init__(self, db_path='students.db'):
        """初始化待办事项管理器"""
        self.db_path = db_path
        self._ensure_todo_table()
    
    def get_db_connection(self):
        """获取数据库连接"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def _ensure_todo_table(self):
        """确保待办事项表存在"""
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        # 创建待办事项表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS todos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                deadline TEXT,
                priority TEXT,
                status TEXT DEFAULT 'pending',
                created_at TEXT,
                updated_at TEXT,
                completed_at TEXT,
                pomodoro_count INTEGER DEFAULT 0,
                pomodoro_target INTEGER DEFAULT 0
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def get_todos(self, status=None):
        """获取待办事项列表"""
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        query = "SELECT * FROM todos"
        params = []
        
        if status:
            query += " WHERE status = ?"
            params.append(status)
        
        query += " ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END, deadline"
        
        cursor.execute(query, params)
        todos = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        return todos
    
    def add_todo(self, title, description=None, deadline=None, priority='medium', pomodoro_target=0):
        """添加新的待办事项"""
        if not title:
            return {'status': 'error', 'message': '待办事项标题不能为空'}
        
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.execute('''
            INSERT INTO todos (title, description, deadline, priority, status, created_at, updated_at, pomodoro_target)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (title, description, deadline, priority, 'pending', now, now, pomodoro_target))
        
        todo_id = cursor.lastrowid
        
        conn.commit()
        conn.close()
        
        return {'status': 'success', 'data': {'id': todo_id}}
    
    def update_todo(self, todo_id, data):
        """更新待办事项"""
        if not todo_id:
            return {'status': 'error', 'message': '待办事项ID不能为空'}
        
        allowed_fields = ['title', 'description', 'deadline', 'priority', 'status', 'pomodoro_target']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return {'status': 'error', 'message': '没有要更新的字段'}
        
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        # 检查待办事项是否存在
        cursor.execute("SELECT id FROM todos WHERE id = ?", (todo_id,))
        if not cursor.fetchone():
            conn.close()
            return {'status': 'error', 'message': f'待办事项 ID {todo_id} 不存在'}
        
        # 更新完成状态
        now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        update_data['updated_at'] = now
        
        if 'status' in update_data and update_data['status'] == 'completed':
            update_data['completed_at'] = now
        
        # 构建更新SQL
        set_clause = ", ".join([f"{field} = ?" for field in update_data.keys()])
        values = list(update_data.values())
        values.append(todo_id)
        
        cursor.execute(f"UPDATE todos SET {set_clause} WHERE id = ?", values)
        
        conn.commit()
        conn.close()
        
        return {'status': 'success'}
    
    def delete_todo(self, todo_id):
        """删除待办事项"""
        if not todo_id:
            return {'status': 'error', 'message': '待办事项ID不能为空'}
        
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        # 检查待办事项是否存在
        cursor.execute("SELECT id FROM todos WHERE id = ?", (todo_id,))
        if not cursor.fetchone():
            conn.close()
            return {'status': 'error', 'message': f'待办事项 ID {todo_id} 不存在'}
        
        cursor.execute("DELETE FROM todos WHERE id = ?", (todo_id,))
        
        conn.commit()
        conn.close()
        
        return {'status': 'success'}
    
    def add_pomodoro(self, todo_id):
        """添加一个番茄时钟记录"""
        if not todo_id:
            return {'status': 'error', 'message': '待办事项ID不能为空'}
        
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        # 检查待办事项是否存在
        cursor.execute("SELECT id, pomodoro_count, pomodoro_target FROM todos WHERE id = ?", (todo_id,))
        todo = cursor.fetchone()
        
        if not todo:
            conn.close()
            return {'status': 'error', 'message': f'待办事项 ID {todo_id} 不存在'}
        
        # 更新番茄时钟计数
        new_count = todo['pomodoro_count'] + 1
        now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.execute(
            "UPDATE todos SET pomodoro_count = ?, updated_at = ? WHERE id = ?",
            (new_count, now, todo_id)
        )
        
        # 如果达到番茄目标且目标不为0，自动完成任务
        if todo['pomodoro_target'] > 0 and new_count >= todo['pomodoro_target']:
            cursor.execute(
                "UPDATE todos SET status = 'completed', completed_at = ? WHERE id = ?",
                (now, todo_id)
            )
        
        conn.commit()
        conn.close()
        
        return {
            'status': 'success',
            'data': {
                'pomodoro_count': new_count,
                'pomodoro_target': todo['pomodoro_target']
            }
        }
    
    def reset_pomodoro(self, todo_id):
        """重置番茄时钟计数"""
        if not todo_id:
            return {'status': 'error', 'message': '待办事项ID不能为空'}
        
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        # 检查待办事项是否存在
        cursor.execute("SELECT id FROM todos WHERE id = ?", (todo_id,))
        if not cursor.fetchone():
            conn.close()
            return {'status': 'error', 'message': f'待办事项 ID {todo_id} 不存在'}
        
        now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.execute(
            "UPDATE todos SET pomodoro_count = 0, updated_at = ? WHERE id = ?",
            (now, todo_id)
        )
        
        conn.commit()
        conn.close()
        
        return {'status': 'success'}
    
    def get_pomodoro_stats(self):
        """获取番茄时钟统计信息"""
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        # 统计今日完成的番茄数
        today = datetime.datetime.now().strftime('%Y-%m-%d')
        cursor.execute(
            "SELECT SUM(pomodoro_count) as today_count FROM todos WHERE updated_at LIKE ?",
            (f"{today}%",)
        )
        today_count = cursor.fetchone()['today_count'] or 0
        
        # 统计总番茄数
        cursor.execute("SELECT SUM(pomodoro_count) as total_count FROM todos")
        total_count = cursor.fetchone()['total_count'] or 0
        
        # 统计已完成的待办事项数量
        cursor.execute("SELECT COUNT(*) as completed_count FROM todos WHERE status = 'completed'")
        completed_count = cursor.fetchone()['completed_count'] or 0
        
        # 统计待处理的待办事项数量
        cursor.execute("SELECT COUNT(*) as pending_count FROM todos WHERE status = 'pending'")
        pending_count = cursor.fetchone()['pending_count'] or 0
        
        conn.close()
        
        return {
            'today_pomodoro': today_count,
            'total_pomodoro': total_count,
            'completed_todos': completed_count,
            'pending_todos': pending_count
        }

# 添加API处理类
class TodoAPI:
    """处理待办事项相关的API请求"""
    
    def __init__(self, app):
        """初始化API处理器，注册路由"""
        self.app = app
        self.todo_manager = TodoManager()
        self._register_routes()
    
    def _register_routes(self):
        """注册API路由"""
        # 获取待办事项列表
        self.app.add_url_rule('/api/todos', 'todos_list', self.get_todos, methods=['GET'])
        
        # 添加待办事项
        self.app.add_url_rule('/api/todos', 'todos_add', self.add_todo, methods=['POST'])
        
        # 更新待办事项
        self.app.add_url_rule('/api/todos/<int:todo_id>', 'todos_update', self.update_todo, methods=['PUT'])
        
        # 删除待办事项
        self.app.add_url_rule('/api/todos/<int:todo_id>', 'todos_delete', self.delete_todo, methods=['DELETE'])
        
        # 番茄时钟相关
        self.app.add_url_rule('/api/todos/<int:todo_id>/pomodoro', 'todos_add_pomodoro', self.add_pomodoro, methods=['POST'])
        self.app.add_url_rule('/api/todos/<int:todo_id>/pomodoro/reset', 'todos_reset_pomodoro', self.reset_pomodoro, methods=['POST'])
        self.app.add_url_rule('/api/todos/pomodoro/stats', 'todos_pomodoro_stats', self.get_pomodoro_stats, methods=['GET'])
    
    def get_todos(self):
        """获取待办事项列表"""
        status = request.args.get('status')
        todos = self.todo_manager.get_todos(status)
        return jsonify({'status': 'success', 'data': todos})
    
    def add_todo(self):
        """添加待办事项"""
        data = request.get_json()
        result = self.todo_manager.add_todo(
            title=data.get('title'),
            description=data.get('description'),
            deadline=data.get('deadline'),
            priority=data.get('priority', 'medium'),
            pomodoro_target=data.get('pomodoro_target', 0)
        )
        
        if result['status'] == 'error':
            return jsonify(result), 400
        
        return jsonify(result)
    
    def update_todo(self, todo_id):
        """更新待办事项"""
        data = request.get_json()
        result = self.todo_manager.update_todo(todo_id, data)
        
        if result['status'] == 'error':
            return jsonify(result), 400
        
        return jsonify(result)
    
    def delete_todo(self, todo_id):
        """删除待办事项"""
        result = self.todo_manager.delete_todo(todo_id)
        
        if result['status'] == 'error':
            return jsonify(result), 400
        
        return jsonify(result)
    
    def add_pomodoro(self, todo_id):
        """添加番茄时钟记录"""
        result = self.todo_manager.add_pomodoro(todo_id)
        
        if result['status'] == 'error':
            return jsonify(result), 400
        
        return jsonify(result)
    
    def reset_pomodoro(self, todo_id):
        """重置番茄时钟"""
        result = self.todo_manager.reset_pomodoro(todo_id)
        
        if result['status'] == 'error':
            return jsonify(result), 400
        
        return jsonify(result)
    
    def get_pomodoro_stats(self):
        """获取番茄时钟统计数据"""
        stats = self.todo_manager.get_pomodoro_stats()
        return jsonify({'status': 'success', 'data': stats})

# 用于测试
if __name__ == "__main__":
    from flask import Flask
    app = Flask(__name__)
    api = TodoAPI(app)
    app.run(debug=True) 