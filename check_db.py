# -*- coding: utf-8 -*-
import sqlite3
import os

# 打印当前目录
print("Current directory:", os.getcwd())

# 列出目录中的文件
print("\nFiles in directory:")
for file in os.listdir('.'):
    print(file)

# 检查数据库文件是否存在
if os.path.exists('students.db'):
    # 连接到数据库
    conn = sqlite3.connect('students.db')
    cursor = conn.cursor()
    
    # 获取所有表
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    print("\nTables in database:")
    for table in tables:
        print(table[0])
        
        # 获取表结构
        print(f"\nSchema for {table[0]}:")
        cursor.execute(f"PRAGMA table_info({table[0]})")
        columns = cursor.fetchall()
        for column in columns:
            print(f"   {column[1]} ({column[2]})")
    
    conn.close()
else:
    print("\nDatabase file 'students.db' not found!")
