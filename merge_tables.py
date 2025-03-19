# -*- coding: utf-8 -*-
import sqlite3
import pandas as pd
import os
from datetime import datetime

def merge_tables():
    """
    合并students和grades表，移除grades表，将成绩字段添加到students表中
    """
    db_path = 'students.db'
    
    if not os.path.exists(db_path):
        print(f"数据库文件 {db_path} 不存在!")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 检查students表是否已有成绩字段
        cursor.execute("PRAGMA table_info(students)")
        columns = cursor.fetchall()
        column_names = [column[1] for column in columns]
        
        # 需要添加的成绩字段
        grade_fields = [
            'daof', 'yuwen', 'shuxue', 'yingyu', 'laodong', 
            'tiyu', 'yinyue', 'meishu', 'kexue', 'zonghe', 
            'xinxi', 'shufa'
        ]
        
        # 检查是否有学期字段
        if 'semester' not in column_names:
            print("添加学期字段到students表")
            cursor.execute("ALTER TABLE students ADD COLUMN semester TEXT DEFAULT '上学期'")
        
        # 为students表添加成绩字段
        for field in grade_fields:
            if field not in column_names:
                print(f"添加 {field} 字段到students表")
                cursor.execute(f"ALTER TABLE students ADD COLUMN {field} TEXT DEFAULT ''")
        
        # 检查grades表是否存在
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='grades'")
        grades_exists = cursor.fetchone() is not None
        
        if grades_exists:
            print("存在grades表，正在迁移数据...")
            
            # 获取成绩数据
            cursor.execute('''
            SELECT student_id, semester, daof, yuwen, shuxue, yingyu, laodong, 
                   tiyu, yinyue, meishu, kexue, zonghe, xinxi, shufa 
            FROM grades
            ''')
            grades_data = cursor.fetchall()
            
            # 将成绩数据更新到students表
            for grade in grades_data:
                student_id = grade[0]
                semester = grade[1]
                
                # 检查学生是否存在
                cursor.execute("SELECT id FROM students WHERE id = ?", (student_id,))
                if cursor.fetchone():
                    # 构建UPDATE语句
                    set_clause = ", ".join([f"{field} = ?" for field in grade_fields])
                    cursor.execute(f'''
                    UPDATE students SET
                        {set_clause},
                        semester = ?
                    WHERE id = ?
                    ''', grade[2:] + (semester, student_id))
                    print(f"更新学生 {student_id} 的成绩数据")
            
            # 删除grades表
            cursor.execute("DROP TABLE grades")
            print("已删除grades表")
        
        print("数据库结构更新完成")
        
    except Exception as e:
        print(f"更新表结构时出错: {e}")
        conn.rollback()
    else:
        conn.commit()
    finally:
        conn.close()

if __name__ == "__main__":
    merge_tables()
