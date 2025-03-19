# -*- coding: utf-8 -*-
"""
修复班主任管理系统服务器重复路由问题并启动
"""
import os
import sys
import re
import logging

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('服务器修复工具')

def fix_duplicate_routes():
    """修复server.py文件中的重复路由定义"""
    server_path = 'server.py'
    
    try:
        # 读取server.py文件内容
        with open(server_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 查找重复的路由定义
        # 第一个download_template定义（保留这个）
        first_route = re.search(r'@app\.route\([\'"]/api/template[\'"].*?\)\s*?\n\s*?def download_template\(\).*?return jsonify\(.*?url_for\([\'"]download_student_template[\'"]\).*?\}\s*?\)', content, re.DOTALL)
        
        # 第二个download_template定义（需要重命名）
        second_route = re.search(r'@app\.route\([\'"]/api/template[\'"].*?\)\s*?\n\s*?def download_template\(\).*?template_path = os\.path\.join\(TEMPLATE_FOLDER, [\'"]student_template\.xlsx[\'"]\).*?\)', content, re.DOTALL)
        
        if first_route and second_route:
            # 创建一个新名称的函数
            new_second_route = second_route.group().replace('def download_template()', 'def download_student_template_file()')
            
            # 替换第二个重复的路由定义
            new_content = content.replace(second_route.group(), new_second_route)
            
            # 保存修改后的文件
            with open('fixed_server.py', 'w', encoding='utf-8') as f:
                f.write(new_content)
                
            logger.info("已成功修复服务器文件中的重复路由定义")
            return True
        else:
            logger.warning("未找到重复的路由定义，可能已修复或格式不匹配")
            # 创建副本以便继续执行
            with open('fixed_server.py', 'w', encoding='utf-8') as f:
                f.write(content)
            return True
            
    except Exception as e:
        logger.error(f"修复服务器文件时出错: {e}")
        return False

def start_fixed_server():
    """启动修复后的服务器"""
    try:
        # 设置环境变量
        os.environ["FLASK_APP"] = "fixed_server.py"
        os.environ["FLASK_DEBUG"] = "1"
        
        # 设置端口为8080
        port = 8080
        
        print(f"\n=============== 班主任管理系统服务器 - 已修复版本 ===============")
        print(f"服务器在端口 {port} 上启动...")
        print(f"请访问: http://localhost:{port}")
        print("按 Ctrl+C 可停止服务器\n")
        
        # 启动修复后的服务器
        os.system(f"python -c \"from fixed_server import app; app.run(host='0.0.0.0', port={port}, debug=True)\"")
        
        return True
    except Exception as e:
        logger.error(f"启动修复后的服务器时出错: {e}")
        return False

if __name__ == "__main__":
    # 修复服务器文件
    if fix_duplicate_routes():
        # 启动修复后的服务器
        start_fixed_server()
    else:
        print("修复服务器文件失败，无法启动服务器")
        sys.exit(1)
