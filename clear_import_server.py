# -*- coding: utf-8 -*-
"""
班主任管理系统服务器 - 清空导入版本
此版本在导入学生时会先清空数据库中的所有学生记录
"""
import os
import sys
import importlib.util
import importlib.machinery
import logging

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/clear_import_server.log", encoding="utf-8", mode="a"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("清空导入服务器")

# 确保日志目录存在
if not os.path.exists("logs"):
    os.makedirs("logs")

def run_server():
    """直接导入server模块的app对象，修改确认导入函数"""
    # 设置环境变量
    os.environ["FLASK_APP"] = "server.py"
    os.environ["FLASK_DEBUG"] = "1"
    
    try:
        # 动态加载server模块
        from server import app, get_db_connection
        import datetime
        import traceback
        from flask import jsonify, request
        
        # 重新定义confirm_import函数，添加清空数据库功能
        @app.route('/api/confirm-import', methods=['POST'])
        def confirm_import():
            data = request.json
            
            # 增加详细日志记录，帮助诊断问题
            logger.info("接收到的导入确认请求数据: %s", data)
            
            if not data or 'students' not in data:
                return jsonify({'error': '无效的请求数据'}), 400
            
            students = data['students']
            
            if not students or len(students) == 0:
                return jsonify({'error': '没有学生数据可导入'}), 400
            
            # 记录第一条学生数据的结构，帮助诊断
            if students and len(students) > 0:
                logger.info("第一条学生数据样例: %s", students[0])
                logger.info("学生数据字段: %s", list(students[0].keys()))
                
                # 详细记录第一条学生的数值字段
                first_student = students[0]
                for field in ['height', 'weight', 'chest_circumference', 'vital_capacity', 'vision_left', 'vision_right']:
                    if field in first_student:
                        value = first_student[field]
                        logger.info(f"数值字段 {field}: {value}, 类型: {type(value).__name__}")
            
            # 检查数据库表结构
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # 获取表结构
            cursor.execute("PRAGMA table_info(students)")
            db_columns = [row[1] for row in cursor.fetchall()]
            logger.info("数据库表字段: %s", db_columns)
            
            # =====================================================
            # 新增功能：清空学生表中的所有记录
            # =====================================================
            try:
                logger.info("导入前清空学生表中的所有记录")
                cursor.execute('DELETE FROM students')
                logger.info(f"已清空学生表，准备导入 {len(students)} 名新学生")
            except Exception as clear_error:
                logger.error(f"清空学生表时出错: {str(clear_error)}")
                return jsonify({
                    'status': 'error',
                    'message': f'清空数据库时出错: {str(clear_error)}'
                }), 500
            # =====================================================
            
            # 字段名映射表，用于处理代码和数据库字段名不一致的情况
            field_mappings = {
                'chest_circumference': 'chest_circumference',  # 可能的映射
                'chestCircumference': 'chest_circumference',   # 前端JS中可能使用的驼峰命名
                'vital_capacity': 'vital_capacity',
                'vitalCapacity': 'vital_capacity',
                'dental_caries': 'dental_caries',
                'dentalCaries': 'dental_caries',
                'vision_left': 'vision_left',
                'visionLeft': 'vision_left',
                'vision_right': 'vision_right',
                'visionRight': 'vision_right',
                'physical_test_status': 'physical_test_status',
                'physicalTestStatus': 'physical_test_status'
            }
            
            now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            success_count = 0
            error_count = 0
            updated_count = 0
            inserted_count = 0
            error_details = []
            
            try:
                for i, student in enumerate(students):
                    try:
                        # 打印学生数据以便调试
                        logger.info(f"准备导入的学生数据({i+1}/{len(students)}): {student}")
                        
                        # 添加数据验证
                        if 'id' not in student or not student['id']:
                            raise ValueError(f"学生ID缺失或无效: {student}")
                        if 'name' not in student or not student['name']:
                            raise ValueError(f"学生姓名缺失或无效: {student}")
                        if 'gender' not in student:
                            raise ValueError(f"学生性别缺失: {student}")
                        
                        # 准备SQL参数，确保使用正确的字段名
                        params = {
                            'id': student['id'],
                            'name': student['name'],
                            'gender': student['gender'],
                            'class': student.get('class', ''),
                            'created_at': now,
                            'updated_at': now
                        }
                        
                        # 数值字段的特殊处理
                        numeric_fields = [
                            'height', 'weight', 'chest_circumference', 
                            'vital_capacity', 'vision_left', 'vision_right'
                        ]
                        
                        for field in numeric_fields:
                            # 获取字段值，对null、空字符串、null字符串等进行处理
                            raw_value = student.get(field)
                            if raw_value is None or raw_value == '' or raw_value == 'null' or raw_value == 'undefined':
                                params[field] = None
                            else:
                                # 尝试转换为浮点数
                                try:
                                    # 如果是字符串，处理可能的特殊格式
                                    if isinstance(raw_value, str):
                                        # 替换逗号为点号(小数点)
                                        raw_value = raw_value.replace(',', '.')
                                    
                                    # 转换为浮点数
                                    value = float(raw_value)
                                    # 特别处理0值
                                    params[field] = 0.0 if value == 0 else value
                                    
                                    logger.info(f"字段 {field} 原始值: {raw_value} ({type(raw_value).__name__}) -> 转换值: {params[field]} ({type(params[field]).__name__})")
                                except (ValueError, TypeError) as e:
                                    params[field] = None
                                    logger.warning(f"无法转换字段 {field} 的值 {raw_value}: {str(e)}")
                        
                        # 处理文本字段
                        if 'dental_caries' in student:
                            params['dental_caries'] = student['dental_caries']
                        if 'physical_test_status' in student:
                            params['physical_test_status'] = student['physical_test_status']
                        
                        # 处理特殊字段，确保使用正确的数据库字段名 (处理可能的命名不一致)
                        for field in student:
                            if field in field_mappings and field_mappings[field] in db_columns:
                                db_field = field_mappings[field]
                                params[db_field] = student[field]
                        
                        # 打印最终的SQL参数
                        logger.info(f"最终SQL参数: {params}")
                        
                        # 不再检查是否存在，因为已经清空了学生表
                        # 构建插入SQL - 包含所有字段
                        insert_fields = []
                        insert_values = []
                        insert_placeholders = []
                        
                        # 遍历所有数据库列
                        for field in db_columns:
                            insert_fields.append(field)
                            
                            # 如果字段在导入数据参数中，使用新值
                            # 否则设置为NULL或空字符串（根据字段类型）
                            if field in params:
                                value = params[field]
                            else:
                                # 为文本字段设空字符串，数值字段设NULL
                                is_text_field = field in ['name', 'gender', 'class', 'dental_caries', 
                                                         'physical_test_status', 'comments', 'created_at', 'updated_at']
                                value = '' if is_text_field else None
                                
                                # 特殊处理评语字段，确保为空
                                if field == 'comments':
                                    value = ''
                            
                            insert_values.append(value)
                            insert_placeholders.append('?')
                        
                        # 执行插入
                        insert_sql = f"INSERT INTO students ({', '.join(insert_fields)}) VALUES ({', '.join(insert_placeholders)})"
                        logger.info(f"插入SQL: {insert_sql}")
                        logger.info(f"插入参数: {insert_values}")
                        cursor.execute(insert_sql, insert_values)
                        inserted_count += 1
                        
                        success_count += 1
                    except Exception as student_error:
                        # 单个学生导入错误不应该影响整体事务
                        error_count += 1
                        error_msg = f"导入学生 {student.get('id', '未知ID')} 时出错: {str(student_error)}"
                        logger.error(error_msg)
                        error_details.append(error_msg)
                        # 继续处理下一个学生，而不是中断整个批次
                
                # 如果至少有一个学生成功导入，提交事务
                if success_count > 0:
                    conn.commit()
                    logger.info(f"成功导入 {success_count} 名学生，新增 {inserted_count} 名")
                else:
                    conn.rollback()
                    logger.warning("没有学生成功导入，回滚事务")
            except Exception as e:
                conn.rollback()
                error_count += 1
                error_msg = f"导入学生数据时出错: {str(e)}"
                logger.error(error_msg)
                logger.error(traceback.format_exc())
                error_details.append(error_msg)
                return jsonify({
                    'status': 'error',
                    'message': error_msg,
                    'error_details': error_details
                }), 500
            finally:
                conn.close()
            
            # 如果有错误但也有成功，返回部分成功的响应
            status = 'ok' if error_count == 0 else 'partial'
            return jsonify({
                'status': status,
                'message': f'成功导入{success_count}名学生（新增{inserted_count}名）' +
                          (f'，{error_count}名学生导入失败' if error_count > 0 else ''),
                'success_count': success_count,
                'error_count': error_count,
                'updated_count': 0,  # 都是新增，没有更新
                'inserted_count': inserted_count,
                'error_details': error_details if error_count > 0 else []
            })
        
        # 设置端口号
        port = 8080
        
        # 启动服务器
        print(f"\n=============== 班主任管理系统服务器 - 清空导入版本 ===============")
        print(f"此版本在导入学生时会先清空数据库中的所有学生记录")
        print(f"服务器在端口 {port} 上启动...")
        print(f"请访问: http://localhost:{port}")
        print("按 Ctrl+C 可停止服务器\n")
        
        # 运行服务器
        app.run(host='0.0.0.0', port=port, debug=True)
        
        return True
    except Exception as e:
        logger.error(f"启动服务器时出错: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    run_server()
