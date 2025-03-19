#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
将所有项目文件转换为UTF-8编码
"""

import os
import sys
import codecs

def convert_file_to_utf8(file_path):
    """
    将文件转换为UTF-8编码
    """
    try:
        # 尝试以不同编码读取文件
        for encoding in ['utf-8', 'gbk', 'gb2312', 'utf-16', 'utf-16-le', 'utf-16-be', 'ascii']:
            try:
                with codecs.open(file_path, 'r', encoding=encoding) as file:
                    content = file.read()
                # 如果成功读取，则以UTF-8编码写回
                with codecs.open(file_path, 'w', encoding='utf-8') as file:
                    file.write(content)
                print(f"成功转换 {file_path} 为UTF-8编码")
                break
            except UnicodeDecodeError:
                continue
            except Exception as e:
                print(f"尝试以 {encoding} 读取 {file_path} 时发生错误: {e}")
                continue
    except Exception as e:
        print(f"处理文件 {file_path} 时发生错误: {e}")

def process_directory(directory):
    """
    处理目录中的所有.py, .js和.html文件
    """
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.py', '.js', '.html')):
                file_path = os.path.join(root, file)
                convert_file_to_utf8(file_path)

def main():
    # 获取当前目录
    current_directory = os.getcwd()
    print(f"正在处理目录: {current_directory}")
    process_directory(current_directory)
    print("所有文件处理完毕")

if __name__ == "__main__":
    main()
