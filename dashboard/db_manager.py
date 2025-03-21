# -*- coding: utf-8 -*-
import sqlite3
import os
import datetime

class DashboardManager:
    """首页仪表盘数据管理器"""
    
    def __init__(self, db_path='students.db'):
        """初始化数据库连接"""
        self.db_path = db_path
        
    def get_db_connection(self):
        """获取数据库连接"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def get_current_class(self):
        """获取当前班级，从学生表中获取最常见的班级"""
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT class, COUNT(class) as count 
            FROM students 
            GROUP BY class 
            ORDER BY count DESC
            LIMIT 1
        """)
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return result['class']
        return "未设置班级"
    
    def get_current_semester(self):
        """获取当前学期，从学生表中获取最新的学期"""
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT semester
            FROM students
            WHERE semester IS NOT NULL AND semester != ''
            ORDER BY created_at DESC
            LIMIT 1
        """)
        
        result = cursor.fetchone()
        conn.close()
        
        if result and result['semester']:
            return result['semester']
            
        # 如果没有学期数据，则生成当前学年学期
        current_date = datetime.datetime.now()
        year = current_date.year
        month = current_date.month
        
        if 2 <= month <= 7:  # 第二学期
            return f"{year-1}-{year}学年第二学期"
        else:  # 第一学期
            return f"{year}-{year+1}学年第一学期"
    
    def get_total_students(self):
        """获取学生总数"""
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) as count FROM students")
        result = cursor.fetchone()
        conn.close()
        
        return result['count'] if result else 0
    
    def get_comments_completion(self):
        """获取评语完成情况"""
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        # 获取总学生数
        cursor.execute("SELECT COUNT(*) as total FROM students")
        total = cursor.fetchone()['total']
        
        # 获取已完成评语的学生数
        cursor.execute("""
            SELECT COUNT(*) as completed 
            FROM students 
            WHERE comments IS NOT NULL AND comments != ''
        """)
        completed = cursor.fetchone()['completed']
        
        # 获取未完成评语的学生
        cursor.execute("""
            SELECT id, name 
            FROM students 
            WHERE comments IS NULL OR comments = ''
            ORDER BY name
        """)
        incomplete_students = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return {
            'total': total,
            'completed': completed,
            'incomplete': total - completed,
            'percentage': round((completed / total * 100) if total > 0 else 0, 1),
            'incomplete_students': incomplete_students
        }
    
    def get_grades_completion(self):
        """获取成绩录入完成情况"""
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        # 获取总学生数
        cursor.execute("SELECT COUNT(*) as total FROM students")
        total = cursor.fetchone()['total']
        
        # 列出所有主要学科
        subjects = ['yuwen', 'shuxue', 'yingyu', 'daof', 'kexue', 'tiyu', 'yinyue', 'meishu']
        
        # 构建查询语句，检查至少有一个学科成绩不为空
        query_conditions = [f"{subject} IS NOT NULL AND {subject} != ''" for subject in subjects]
        query = f"""
            SELECT COUNT(*) as completed 
            FROM students 
            WHERE {" OR ".join(query_conditions)}
        """
        
        cursor.execute(query)
        has_some_grades = cursor.fetchone()['completed']
        
        # 统计每个学生的成绩完成情况
        query_all_completed = f"""
            SELECT COUNT(*) as all_completed
            FROM students
            WHERE {" AND ".join(query_conditions)}
        """
        
        cursor.execute(query_all_completed)
        all_completed = cursor.fetchone()['all_completed']
        
        conn.close()
        
        return {
            'total': total,
            'has_some_grades': has_some_grades,
            'all_completed': all_completed,
            'percentage': round((has_some_grades / total * 100) if total > 0 else 0, 1)
        }
    
    def get_reports_generation(self):
        """获取报告生成情况，只有当学生信息、评语和所有成绩都填写后才能生成报告"""
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        # 获取总学生数
        cursor.execute("SELECT COUNT(*) as total FROM students")
        total = cursor.fetchone()['total']
        
        # 主要学科列表
        subjects = ['yuwen', 'shuxue', 'yingyu', 'daof', 'kexue', 'tiyu', 'yinyue', 'meishu']
        
        # 构建查询，检查学生个人信息、评语和所有主要学科成绩是否都已填写
        personal_info_conditions = [
            "name IS NOT NULL AND name != ''",
            "gender IS NOT NULL AND gender != ''",
            "class IS NOT NULL AND class != ''"
        ]
        
        grade_conditions = [f"{subject} IS NOT NULL AND {subject} != ''" for subject in subjects]
        
        query = f"""
            SELECT COUNT(*) as ready
            FROM students
            WHERE 
                {" AND ".join(personal_info_conditions)} AND
                comments IS NOT NULL AND comments != '' AND
                {" AND ".join(grade_conditions)}
        """
        
        cursor.execute(query)
        ready_for_report = cursor.fetchone()['ready']
        
        conn.close()
        
        return {
            'total': total,
            'ready': ready_for_report,
            'percentage': round((ready_for_report / total * 100) if total > 0 else 0, 1)
        }
    
    def get_grade_distribution(self):
        """获取学科成绩分布情况"""
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        # 获取班级信息，确定年级
        grade_level = self._get_grade_level()
        
        # 主要学科列表
        subjects = {
            'yuwen': '语文',
            'shuxue': '数学',
            'yingyu': '英语',
            'daof': '道法',
            'kexue': '科学',
            'tiyu': '体育',
            'yinyue': '音乐',
            'meishu': '美术'
        }
        
        result = {}
        
        for subject_key, subject_name in subjects.items():
            # 不同年级的评分标准不同
            if grade_level in [1, 2]:  # 一二年级
                excellent_threshold = 90
                good_threshold = 70
                pass_threshold = 60
            else:  # 其他年级
                excellent_threshold = 90
                good_threshold = 75
                pass_threshold = 60
            
            # 查询各等级的学生数
            cursor.execute(f"""
                SELECT 
                    COUNT(CASE WHEN CAST({subject_key} AS REAL) >= {excellent_threshold} THEN 1 END) as excellent,
                    COUNT(CASE WHEN CAST({subject_key} AS REAL) >= {good_threshold} AND CAST({subject_key} AS REAL) < {excellent_threshold} THEN 1 END) as good,
                    COUNT(CASE WHEN CAST({subject_key} AS REAL) >= {pass_threshold} AND CAST({subject_key} AS REAL) < {good_threshold} THEN 1 END) as pass,
                    COUNT(CASE WHEN CAST({subject_key} AS REAL) < {pass_threshold} THEN 1 END) as fail,
                    COUNT({subject_key}) as total
                FROM students
                WHERE {subject_key} IS NOT NULL AND {subject_key} != ''
            """)
            
            distribution = cursor.fetchone()
            
            if distribution and distribution['total'] > 0:
                result[subject_name] = {
                    'excellent': distribution['excellent'],
                    'good': distribution['good'],
                    'pass': distribution['pass'],
                    'fail': distribution['fail'],
                    'total': distribution['total'],
                    'excellent_rate': round(distribution['excellent'] / distribution['total'] * 100, 1)
                }
            else:
                result[subject_name] = {
                    'excellent': 0, 'good': 0, 'pass': 0, 'fail': 0, 'total': 0, 'excellent_rate': 0
                }
        
        conn.close()
        return result
    
    def get_recent_activities(self, limit=5):
        """获取最近的活动记录"""
        # 注意：这个功能需要在数据库中添加活动记录表，或者从现有数据推断
        # 这里我们模拟一些活动记录，实际应用中应该从数据库获取
        
        # 可以从学生表的更新时间、评语更新时间等推断出活动
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        # 获取最近更新的学生记录
        cursor.execute("""
            SELECT name, updated_at
            FROM students
            WHERE updated_at IS NOT NULL
            ORDER BY updated_at DESC
            LIMIT ?
        """, (limit,))
        
        recent_updates = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        activities = []
        for update in recent_updates:
            activities.append({
                'type': 'update',
                'content': f"更新了学生 {update['name']} 的信息",
                'time': update['updated_at']
            })
        
        # 如果记录不足，添加一些模拟数据
        if len(activities) < limit:
            sample_activities = [
                {'type': 'grade', 'content': '录入了期末成绩', 'time': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')},
                {'type': 'comment', 'content': '批量生成了学生评语', 'time': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')},
                {'type': 'report', 'content': '导出了学生报告', 'time': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')},
                {'type': 'student', 'content': '添加了新学生', 'time': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')},
                {'type': 'setting', 'content': '更新了系统设置', 'time': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            ]
            
            for i in range(min(limit - len(activities), len(sample_activities))):
                activities.append(sample_activities[i])
        
        return activities
    
    def get_todo_list(self):
        """获取待办事项列表"""
        # 实际应用中需要从数据库获取，这里模拟一些待办事项
        todos = [
            {
                'title': '完成学生评语',
                'description': '为剩余学生完成期末评语',
                'deadline': (datetime.datetime.now() + datetime.timedelta(days=3)).strftime('%Y-%m-%d'),
                'priority': 'high'
            },
            {
                'title': '录入期末成绩',
                'description': '录入语文、数学和英语科目的期末成绩',
                'deadline': (datetime.datetime.now() + datetime.timedelta(days=5)).strftime('%Y-%m-%d'),
                'priority': 'medium'
            },
            {
                'title': '导出学期报告',
                'description': '为所有学生生成并导出学期报告',
                'deadline': (datetime.datetime.now() + datetime.timedelta(days=7)).strftime('%Y-%m-%d'),
                'priority': 'medium'
            },
            {
                'title': '准备家长会',
                'description': '准备期末家长会演示文稿和讲话稿',
                'deadline': (datetime.datetime.now() + datetime.timedelta(days=10)).strftime('%Y-%m-%d'),
                'priority': 'low'
            }
        ]
        
        return todos
    
    def _get_grade_level(self):
        """从班级名称推断年级"""
        current_class = self.get_current_class()
        
        # 尝试从班级名称中提取年级信息
        # 假设格式为"x年级x班"或"x年x班"
        if '年级' in current_class:
            try:
                grade = int(current_class.split('年级')[0])
                return grade
            except ValueError:
                pass
        
        if '年' in current_class:
            try:
                grade = int(current_class.split('年')[0])
                return grade
            except ValueError:
                pass
        
        # 默认返回五年级
        return 5

# 用于测试
if __name__ == "__main__":
    manager = DashboardManager()
    print(f"当前班级: {manager.get_current_class()}")
    print(f"当前学期: {manager.get_current_semester()}")
    print(f"学生总数: {manager.get_total_students()}")
    
    comments = manager.get_comments_completion()
    print(f"评语完成: {comments['completed']}/{comments['total']} ({comments['percentage']}%)")
    
    grades = manager.get_grades_completion()
    print(f"成绩录入: {grades['has_some_grades']}/{grades['total']} ({grades['percentage']}%)")
    
    reports = manager.get_reports_generation()
    print(f"报告生成: {reports['ready']}/{reports['total']} ({reports['percentage']}%)") 