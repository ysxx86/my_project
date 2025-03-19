#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
为所有JavaScript文件添加UTF-8编码声明
"""

import os
import codecs

def add_encoding_declaration(file_path):
    try:
        with codecs.open(file_path, 'r', 'utf-8') as file:
            content = file.read()
        
        # 检查文件是否已经有编码声明
        if '// @charset UTF-8' not in content:
            with codecs.open(file_path, 'w', 'utf-8') as file:
                file.write('// @charset UTF-8\n' + content)
            print(f"已添加编码声明: {file_path}")
    except Exception as e:
        print(f"处理文件 {file_path} 时发生错误: {e}")

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.js'):
                file_path = os.path.join(root, file)
                add_encoding_declaration(file_path)

def main():
    current_directory = os.getcwd()
    print(f"处理目录: {current_directory}")
    process_directory(current_directory)
    print("所有JavaScript文件处理完毕")

if __name__ == "__main__":
    main()
