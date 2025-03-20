# -*- coding: utf-8 -*-
import sqlite3
import os
import pandas as pd
from datetime import datetime
import traceback

class GradesManager:
    def __init__(self, db_path="students.db"):
        self.db_path = db_path
        self._ensure_table_exists()
    
    def _ensure_table_exists(self):
        """确保学生表存在并包含必要的成绩字段"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 检查学生表结构
        cursor.execute("PRAGMA table_info(students)")
        columns = cursor.fetchall()
        column_names = [column[1] for column in columns]
        
        # 需要的成绩字段
        grade_fields = [
            'daof', 'yuwen', 'shuxue', 'yingyu', 'laodong', 
            'tiyu', 'yinyue', 'meishu', 'kexue', 'zonghe', 
            'xinxi', 'shufa'
        ]
        
        # 添加缺失的字段
        for field in grade_fields:
            if field not in column_names:
                cursor.execute(f"ALTER TABLE students ADD COLUMN {field} TEXT DEFAULT ''")
        
        # 确保存在学期字段
        if 'semester' not in column_names:
            cursor.execute("ALTER TABLE students ADD COLUMN semester TEXT DEFAULT '上学期'")
        
        conn.commit()
        conn.close()
    
    def get_all_grades(self, semester="上学期"):
        """获取所有学生的成绩"""
        print(f"获取所有学生成绩，学期: {semester}")
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # 直接从students表获取全部数据，不对学期做过滤
            cursor.execute('''
                SELECT 
                    id AS student_id, 
                    name AS student_name, 
                    class, 
                    daof, yuwen, shuxue, yingyu, laodong, 
                    tiyu, yinyue, meishu, kexue, zonghe, 
                    xinxi, shufa
                FROM students
                ORDER BY class, CAST(id AS INTEGER)
            ''')
            
            # 获取列名
            column_names = [description[0] for description in cursor.description]
            
            # 获取数据
            all_students = [dict(zip(column_names, row)) for row in cursor.fetchall()]
            
            # 为每个学生记录添加学期字段
            for student in all_students:
                student['semester'] = semester
            
            print(f"找到 {len(all_students)} 个学生记录")
            return all_students
            
        except Exception as e:
            print(f"获取所有学生成绩时出错: {e}")
            print(traceback.format_exc())
            return []
        finally:
            conn.close()
    
    def get_student_grade(self, student_id, semester="上学期"):
        """获取单个学生的成绩记录"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 查询学生信息和成绩
        cursor.execute('''
            SELECT id, name, class, 
                   daof, yuwen, shuxue, yingyu, laodong, 
                   tiyu, yinyue, meishu, kexue, zonghe, 
                   xinxi, shufa, 
                   COALESCE(semester, ?) AS semester
            FROM students 
            WHERE id = ? AND (semester = ? OR semester IS NULL OR semester = '')
        ''', (semester, student_id, semester))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            # 构造字典
            return {
                'student_id': row[0],
                'student_name': row[1],
                'class': row[2],
                'daof': row[3] or '',
                'yuwen': row[4] or '',
                'shuxue': row[5] or '',
                'yingyu': row[6] or '',
                'laodong': row[7] or '',
                'tiyu': row[8] or '',
                'yinyue': row[9] or '',
                'meishu': row[10] or '',
                'kexue': row[11] or '',
                'zonghe': row[12] or '',
                'xinxi': row[13] or '',
                'shufa': row[14] or '',
                'semester': row[15]
            }
        else:
            # 查找学生基本信息
            cursor.execute('SELECT id, name, class FROM students WHERE id = ?', (student_id,))
            student = cursor.fetchone()
            
            if student:
                return {
                    'student_id': student[0],
                    'student_name': student[1],
                    'class': student[2],
                    'semester': semester,
                    'daof': '',
                    'yuwen': '',
                    'shuxue': '',
                    'yingyu': '',
                    'laodong': '',
                    'tiyu': '',
                    'yinyue': '',
                    'meishu': '',
                    'kexue': '',
                    'zonghe': '',
                    'xinxi': '',
                    'shufa': ''
                }
            return None  # 学生不存在
    
    def save_grade(self, student_id, grade_data, semester="上学期"):
        """保存单个学生的成绩记录"""
        print(f"准备保存学生 {student_id} 的成绩，学期: {semester}")
        print(f"成绩数据: {grade_data}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        try:
            # 检查学生是否存在
            cursor.execute("SELECT id FROM students WHERE id = ?", (student_id,))
            if not cursor.fetchone():
                print(f"学生ID {student_id} 不存在")
                return False
                
            # 生成更新字句
            set_clauses = []
            values = []
            
            for field in ['daof', 'yuwen', 'shuxue', 'yingyu', 'laodong', 
                        'tiyu', 'yinyue', 'meishu', 'kexue', 'zonghe', 
                        'xinxi', 'shufa']:
                if field in grade_data:
                    value = grade_data.get(field, '')
                    
                    # 验证成绩值是否符合「优、良、及格、待及格」四级制
                    if value and value not in ['优', '良', '及格', '待及格', '差', '']:
                        print(f"警告: {student_id} 的 {field} 成绩 '{value}' 不符合要求，已自动清空")
                        value = ''  # 清空不符合要求的值
                        
                    set_clauses.append(f"{field} = ?")
                    values.append(value)
            
            # 添加更新时间
            set_clauses.append("updated_at = ?")
            values.append(now)
            
            # 添加条件参数
            values.append(student_id)
            
            # 执行更新
            if set_clauses:
                query = f'''
                UPDATE students SET {', '.join(set_clauses)}
                WHERE id = ?
                '''
                print(f"执行SQL: {query}")
                print(f"参数: {values}")
                cursor.execute(query, values)
                
                print(f"更新了 {cursor.rowcount} 条记录")
                conn.commit()
                print(f"成功保存学生 {student_id} 的成绩")
                return True
            else:
                print("没有提供任何成绩数据")
                return False
            
        except Exception as e:
            print(f"保存成绩时出错: {e}")
            print(traceback.format_exc())
            conn.rollback()
            return False
        finally:
            conn.close()
    
    def delete_grade(self, student_id, semester="上学期"):
        """清空学生的成绩记录"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # 清空成绩字段
            cursor.execute('''
            UPDATE students SET
                daof = '',
                yuwen = '',
                shuxue = '',
                yingyu = '',
                laodong = '',
                tiyu = '',
                yinyue = '',
                meishu = '',
                kexue = '',
                zonghe = '',
                xinxi = '',
                shufa = '',
                semester = ?
            WHERE id = ? AND (semester = ? OR semester IS NULL OR semester = '')
            ''', (semester, student_id, semester))
            
            conn.commit()
            return True
        except Exception as e:
            print(f"删除成绩时出错: {e}")
            conn.rollback()
            return False
        finally:
            conn.close()
    
    def import_grades_from_excel(self, file_path, semester="上学期"):
        """从Excel文件导入成绩"""
        try:
            # 检查文件路径
            if not file_path or not os.path.exists(file_path):
                print(f"文件路径无效或文件不存在: {file_path}")
                return False, f"文件路径无效或文件不存在: {file_path}"
                
            print(f"准备导入成绩文件: {file_path}, 文件大小: {os.path.getsize(file_path)} 字节")
            
            # 读取Excel文件
            df = pd.read_excel(file_path)
            print(f"成功读取Excel文件，包含 {len(df)} 行数据")
            
            # 确保有必要的列
            required_columns = ['学号']
            for col in required_columns:
                if col not in df.columns:
                    return False, f"Excel文件缺少必要的列: {col}"
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 获取列名映射
            column_mapping = self._get_column_mapping()
            
            # 允许的成绩值
            allowed_grades = ['优', '良', '及格', '待及格', '差', '']
            
            # 转换Excel数据
            success_count = 0
            fail_count = 0
            
            for _, row in df.iterrows():
                try:
                    student_id = str(row['学号']).strip()
                    
                    # 检查学生是否存在
                    cursor.execute("SELECT id FROM students WHERE id = ?", (student_id,))
                    if not cursor.fetchone():
                        print(f"学生ID不存在: {student_id}")
                        fail_count += 1
                        continue
                    
                    # 生成更新字句
                    set_clauses = ["semester = ?"]
                    values = [semester]
                    
                    for excel_col, db_col in column_mapping.items():
                        if excel_col in df.columns and excel_col != '学号':
                            value = str(row[excel_col]) if pd.notna(row[excel_col]) else ''
                            
                            # 验证成绩值是否在允许的范围内
                            if value and excel_col != '学号' and value not in allowed_grades:
                                print(f"警告: {student_id} 的 {excel_col} 成绩 '{value}' 不符合要求，应为：{', '.join(allowed_grades[:-1])}，已自动清空")
                                value = ''  # 不符合要求的成绩将被清空
                                
                            set_clauses.append(f"{db_col} = ?")
                            values.append(value)
                    
                    # 添加条件参数
                    values.append(student_id)
                    
                    # 执行更新
                    if len(set_clauses) > 1:  # 确保至少有一个成绩字段要更新
                        query = f'''
                        UPDATE students SET {', '.join(set_clauses)}
                        WHERE id = ?
                        '''
                        cursor.execute(query, values)
                        
                        if cursor.rowcount > 0:
                            success_count += 1
                        else:
                            fail_count += 1
                except Exception as e:
                    print(f"导入学生 {student_id} 的成绩时出错: {e}")
                    fail_count += 1
            
            conn.commit()
            conn.close()
            
            print(f"导入完成: 成功 {success_count} 条, 失败 {fail_count} 条")
            
            # 删除临时文件
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    print(f"已删除临时文件: {file_path}")
            except Exception as e:
                print(f"删除临时文件失败: {e}")
            
            return True, f"成功导入 {success_count} 条成绩记录，失败 {fail_count} 条。"
        
        except Exception as e:
            print(f"导入成绩时出错: {e}")
            print(traceback.format_exc())  # 打印完整的错误堆栈
            return False, f"导入成绩时出错: {str(e)}"
    
    def preview_grades_from_excel(self, file_path, semester="上学期"):
        """从Excel文件预览成绩导入，不实际导入数据库"""
        try:
            # 检查文件路径
            if not file_path or not os.path.exists(file_path):
                print(f"文件路径无效或文件不存在: {file_path}")
                return {
                    'status': 'error',
                    'message': f"文件路径无效或文件不存在: {file_path}"
                }
                
            print(f"准备预览成绩文件: {file_path}, 文件大小: {os.path.getsize(file_path)} 字节")
            
            # 读取Excel文件
            df = pd.read_excel(file_path)
            print(f"成功读取Excel文件，包含 {len(df)} 行数据")
            
            # 确保有必要的列
            required_columns = ['学号']
            for col in required_columns:
                if col not in df.columns:
                    return {
                        'status': 'error',
                        'message': f"Excel文件缺少必要的列: {col}"
                    }
            
            # 获取列名映射
            column_mapping = self._get_column_mapping()
            
            # 允许的成绩值
            allowed_grades = ['优', '良', '及格', '待及格', '差', '']
            
            # 从数据库获取学生信息
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('SELECT id, name, class FROM students')
            students_dict = {row[0]: {'name': row[1], 'class': row[2]} for row in cursor.fetchall()}
            conn.close()
            
            # 转换Excel数据为预览数据
            preview_data = []
            valid_count = 0
            invalid_count = 0
            warnings = []
            
            for i, row in df.iterrows():
                try:
                    student_id = str(row['学号']).strip()
                    
                    # 检查学生是否存在
                    if student_id not in students_dict:
                        warnings.append(f"警告: 学号 {student_id} 不在系统中")
                        invalid_count += 1
                        continue
                    
                    # 创建学生成绩记录
                    student_grade = {
                        'student_id': student_id,
                        'student_name': students_dict[student_id]['name'],
                        'class': students_dict[student_id]['class'],
                        'semester': semester
                    }
                    
                    # 添加各科目成绩
                    for excel_col, db_col in column_mapping.items():
                        if excel_col in df.columns and excel_col != '学号':
                            value = str(row[excel_col]) if pd.notna(row[excel_col]) else ''
                            
                            # 验证成绩值是否在允许的范围内
                            if value and excel_col != '学号' and value not in allowed_grades:
                                warnings.append(f"警告: 学号 {student_id} 的 {excel_col} 成绩 '{value}' 不符合要求，应为：{', '.join(allowed_grades[:-1])}")
                                value = ''  # 在预览中标记为空
                            
                            student_grade[db_col] = value
                    
                    preview_data.append(student_grade)
                    valid_count += 1
                except Exception as e:
                    warnings.append(f"处理学号 {student_id} 的成绩时出错: {str(e)}")
                    invalid_count += 1
            
            # 生成HTML预览
            html_preview = self._generate_grades_preview_html(preview_data, warnings)
            
            return {
                'status': 'ok',
                'message': f'成功解析 {valid_count} 条成绩记录，{invalid_count} 条无效记录',
                'grades': preview_data,
                'html_preview': html_preview,
                'warnings': warnings,
                'file_path': file_path
            }
            
        except Exception as e:
            print(f"预览成绩时出错: {e}")
            print(traceback.format_exc())
            return {
                'status': 'error',
                'message': f"预览成绩时出错: {str(e)}"
            }
    
    def _generate_grades_preview_html(self, grades_data, warnings=None):
        """生成成绩预览的HTML表格"""
        print("生成成绩预览HTML表格")
        
        # 定义科目名称字典
        subject_names = self.get_subject_names()
        
        html = """
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>学号</th>
                        <th>姓名</th>
                        <th>班级</th>
                        <th>道法</th>
                        <th>语文</th>
                        <th>数学</th>
                        <th>英语</th>
                        <th>劳动</th>
                        <th>体育</th>
                        <th>音乐</th>
                        <th>美术</th>
                        <th>科学</th>
                        <th>综合</th>
                        <th>信息</th>
                        <th>书法</th>
                    </tr>
                </thead>
                <tbody>
        """
        
        # 添加成绩数据行
        for grade in grades_data:
            html += f"""
                <tr>
                    <td>{grade.get('student_id', '-')}</td>
                    <td>{grade.get('student_name', '-')}</td>
                    <td>{grade.get('class', '-')}</td>
                    <td>{grade.get('daof', '-')}</td>
                    <td>{grade.get('yuwen', '-')}</td>
                    <td>{grade.get('shuxue', '-')}</td>
                    <td>{grade.get('yingyu', '-')}</td>
                    <td>{grade.get('laodong', '-')}</td>
                    <td>{grade.get('tiyu', '-')}</td>
                    <td>{grade.get('yinyue', '-')}</td>
                    <td>{grade.get('meishu', '-')}</td>
                    <td>{grade.get('kexue', '-')}</td>
                    <td>{grade.get('zonghe', '-')}</td>
                    <td>{grade.get('xinxi', '-')}</td>
                    <td>{grade.get('shufa', '-')}</td>
                </tr>
            """
        
        html += """
                </tbody>
            </table>
        </div>
        """
        
        # 添加警告信息（如果有）
        if warnings and len(warnings) > 0:
            html += """
            <div class="alert alert-warning mt-3">
                <h5><i class='bx bx-error'></i> 警告信息：</h5>
                <ul>
            """
            
            for warning in warnings:
                html += f"<li>{warning}</li>"
                
            html += """
                </ul>
            </div>
            """
        
        # 添加数据统计
        html += f"""
        <div class="alert alert-info mt-3">
            <i class='bx bx-info-circle'></i> 共发现 {len(grades_data)} 条有效成绩数据，点击"确认导入"按钮完成导入。
        </div>
        """
        
        return html
    
    def _get_column_mapping(self):
        """获取成绩Excel列名到数据库字段的映射"""
        return {
            '学号': 'student_id',
            '道法': 'daof',
            '语文': 'yuwen',
            '数学': 'shuxue',
            '英语': 'yingyu',
            '劳动': 'laodong',
            '体育': 'tiyu',
            '音乐': 'yinyue',
            '美术': 'meishu',
            '科学': 'kexue',
            '综合': 'zonghe',
            '信息': 'xinxi',
            '书法': 'shufa'
        }
    
    def get_subject_names(self):
        """获取所有科目名称"""
        return {
            'daof': '道法',
            'yuwen': '语文',
            'shuxue': '数学',
            'yingyu': '英语',
            'laodong': '劳动',
            'tiyu': '体育',
            'yinyue': '音乐',
            'meishu': '美术',
            'kexue': '科学',
            'zonghe': '综合',
            'xinxi': '信息',
            'shufa': '书法'
        }
        
    def create_empty_template(self, output_path=None):
        """创建空白的成绩导入模板"""
        from openpyxl import Workbook
        from openpyxl.styles import Alignment, Font, PatternFill, Border, Side
        from openpyxl.utils import get_column_letter
        
        # 获取所有学生
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT id, name, class FROM students
        ORDER BY class, CAST(id AS INTEGER)
        ''')
        
        students = []
        for row in cursor.fetchall():
            students.append({
                'id': row[0],
                'name': row[1],
                'class': row[2]
            })
        
        conn.close()
        
        # 创建Excel文件
        wb = Workbook()
        ws = wb.active
        ws.title = "成绩导入模板"
        
        # 设置列标题
        columns = [
            {'header': '学号', 'key': 'student_id', 'width': 15},
            {'header': '姓名', 'key': 'student_name', 'width': 15},
            {'header': '班级', 'key': 'class', 'width': 15},
            {'header': '道法', 'key': 'daof', 'width': 10},
            {'header': '语文', 'key': 'yuwen', 'width': 10},
            {'header': '数学', 'key': 'shuxue', 'width': 10},
            {'header': '英语', 'key': 'yingyu', 'width': 10},
            {'header': '劳动', 'key': 'laodong', 'width': 10},
            {'header': '体育', 'key': 'tiyu', 'width': 10},
            {'header': '音乐', 'key': 'yinyue', 'width': 10},
            {'header': '美术', 'key': 'meishu', 'width': 10},
            {'header': '科学', 'key': 'kexue', 'width': 10},
            {'header': '综合', 'key': 'zonghe', 'width': 10},
            {'header': '信息', 'key': 'xinxi', 'width': 10},
            {'header': '书法', 'key': 'shufa', 'width': 10},
        ]
        
        # 设置标题行
        for col_idx, column in enumerate(columns, start=1):
            cell = ws.cell(row=1, column=col_idx, value=column['header'])
            cell.font = Font(bold=True)
            cell.alignment = Alignment(horizontal='center', vertical='center')
            ws.column_dimensions[get_column_letter(col_idx)].width = column['width']
        
        # 添加学生信息
        for row_idx, student in enumerate(students, start=2):
            ws.cell(row=row_idx, column=1, value=student['id'])
            ws.cell(row=row_idx, column=2, value=student['name'])
            ws.cell(row=row_idx, column=3, value=student['class'])
        
        # 添加说明文字
        notes_row = len(students) + 3
        ws.cell(row=notes_row, column=1, value="说明事项：")
        ws.cell(row=notes_row+1, column=1, value="1. 成绩可填写：优、良、及格、待及格，请勿使用其他评分方式")
        ws.cell(row=notes_row+2, column=1, value="2. 请勿修改学号、姓名和班级")
        ws.cell(row=notes_row+3, column=1, value="3. 导入时只需填写有变更的成绩")
        
        # 合并说明文字的单元格
        for i in range(4):
            ws.merge_cells(start_row=notes_row+i, start_column=1, end_row=notes_row+i, end_column=6)
        
        # 确定保存路径
        if not output_path:
            # 使用默认路径
            template_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'templates')
            os.makedirs(template_dir, exist_ok=True)
            output_path = os.path.join(template_dir, 'grades_import_template.xlsx')
        
        try:
            # 保存文件
            wb.save(output_path)
            print(f"成绩导入模板已保存到: {output_path}")
            return output_path
        except Exception as e:
            print(f"保存成绩导入模板时出错: {e}")
            print(traceback.format_exc())
            
            # 尝试保存到备用位置
            backup_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'grades_template.xlsx')
            try:
                wb.save(backup_path)
                print(f"成绩导入模板已保存到备用位置: {backup_path}")
                return backup_path
            except Exception as e2:
                print(f"保存到备用位置也失败: {e2}")
                return None
