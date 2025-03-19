#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
将Unicode编码的注释转换为直接的中文字符
"""

import os
import re
import sys
import codecs

def process_file(file_path):
    try:
        # 读取文件内容
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # 找到所有 \u 开头的Unicode编码
        def replace_unicode(match):
            try:
                # 将\u编码转换为中文字符
                return bytes(match.group(0), 'ascii').decode('unicode_escape')
            except:
                return match.group(0)
        
        # 替换Unicode编码
        new_content = re.sub(r'\\u[0-9a-fA-F]{4}', replace_unicode, content)
        
        # 如果内容有变化，写回文件
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f"已修复: {file_path}")
    except Exception as e:
        print(f"处理文件 {file_path} 时发生错误: {e}")

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.py', '.js', '.html')):
                file_path = os.path.join(root, file)
                process_file(file_path)

def main():
    current_directory = os.getcwd()
    print(f"处理目录: {current_directory}")
    process_directory(current_directory)
    print("所有文件处理完毕")

if __name__ == "__main__":
    main()
