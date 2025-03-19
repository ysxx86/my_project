#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
u4e3au6240u6709JavaScriptu6587u4ef6u6dfbu52a0UTF-8u7f16u7801u58f0u660e
"""

import os
import codecs

def add_encoding_declaration(file_path):
    try:
        with codecs.open(file_path, 'r', 'utf-8') as file:
            content = file.read()
        
        # u68c0u67e5u6587u4ef6u662fu5426u5df2u7ecfu6709u7f16u7801u58f0u660e
        if '// @charset UTF-8' not in content:
            with codecs.open(file_path, 'w', 'utf-8') as file:
                file.write('// @charset UTF-8\n' + content)
            print(f"u5df2u6dfbu52a0u7f16u7801u58f0u660e: {file_path}")
    except Exception as e:
        print(f"u5904u7406u6587u4ef6 {file_path} u65f6u53d1u751fu9519u8bef: {e}")

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.js'):
                file_path = os.path.join(root, file)
                add_encoding_declaration(file_path)

def main():
    current_directory = os.getcwd()
    print(f"u5904u7406u76eeu5f55: {current_directory}")
    process_directory(current_directory)
    print("u6240u6709JavaScriptu6587u4ef6u5904u7406u5b8cu6bd5")

if __name__ == "__main__":
    main()
