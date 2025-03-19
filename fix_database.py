# -*- coding: utf-8 -*-
import sqlite3
import os

def fix_grades_table():
    """修复成绩表，确保没有student_name字段"""
    db_path = 'students.db'
    
    if not os.path.exists(db_path):
        print(f"数据库文件 {db_path} 不存在!")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 检查表中是否有student_name列
        cursor.execute("PRAGMA table_info(grades)")
        columns = cursor.fetchall()
        column_names = [column[1] for column in columns]
        
        if 'student_name' in column_names:
            print("检测到旧的grades表结构，需要更新...")
            
            # 创建一个新的没有student_name字段的表
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS grades_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                daof TEXT,
                yuwen TEXT,
                shuxue TEXT,
                yingyu TEXT,
                laodong TEXT,
                tiyu TEXT,
                yinyue TEXT,
                meishu TEXT,
                kexue TEXT,
                zonghe TEXT,
                xinxi TEXT,
                shufa TEXT,
                semester TEXT NOT NULL,
                created_at TEXT,
                updated_at TEXT,
                UNIQUE(student_id, semester),
                FOREIGN KEY(student_id) REFERENCES students(id)
            )
            ''')
            
            # 从旧表复制数据到新表
            cursor.execute('''
            INSERT INTO grades_new (
                id, student_id, daof, yuwen, shuxue, yingyu, laodong, 
                tiyu, yinyue, meishu, kexue, zonghe, xinxi, shufa, 
                semester, created_at, updated_at
            )
            SELECT 
                id, student_id, daof, yuwen, shuxue, yingyu, laodong, 
                tiyu, yinyue, meishu, kexue, zonghe, xinxi, shufa, 
                semester, created_at, updated_at
            FROM grades
            ''')
            
            # 删除旧表
            cursor.execute("DROP TABLE grades")
            
            # 重命名新表
            cursor.execute("ALTER TABLE grades_new RENAME TO grades")
            
            print("grades表结构更新完成")
        else:
            print("grades表结构已经是最新的，不需要更新")
        
    except Exception as e:
        print(f"更新表结构时出错: {e}")
        conn.rollback()
    else:
        conn.commit()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_grades_table()
