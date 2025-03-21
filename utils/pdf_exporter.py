#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
PDF导出模块：专门负责生成学生评语的PDF文件
更加精简和稳健的实现
"""

import os
import logging
import sqlite3
import traceback
from datetime import datetime

# 配置日志
logger = logging.getLogger(__name__)

# 导入PDF生成相关库
try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.units import mm
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, PageBreak
    REPORTLAB_AVAILABLE = True
    logger.info("PDF导出模块: ReportLab库已成功导入")
except ImportError:
    REPORTLAB_AVAILABLE = False
    logger.error("PDF导出模块: 无法导入ReportLab库，PDF生成功能将不可用")

# 数据库连接和导出目录配置
DATABASE = 'students.db'
EXPORTS_FOLDER = 'exports'
os.makedirs(EXPORTS_FOLDER, exist_ok=True)

# 字体目录
FONTS_FOLDER = 'utils/fonts'
os.makedirs(FONTS_FOLDER, exist_ok=True)

# 获取数据库连接
def get_db_connection():
    """获取SQLite数据库连接"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# 注册中文字体
def register_fonts():
    """注册中文字体，确保PDF可以正确显示中文"""
    if not REPORTLAB_AVAILABLE:
        logger.error("ReportLab库不可用，无法注册字体")
        return False
    
    # 检查字体目录
    if not os.path.exists(FONTS_FOLDER):
        try:
            os.makedirs(FONTS_FOLDER, exist_ok=True)
            logger.info(f"创建字体目录: {FONTS_FOLDER}")
        except Exception as e:
            logger.error(f"创建字体目录失败: {str(e)}")
    
    # 尝试注册常见中文字体 - 优先使用macOS系统字体
    font_files = [
        # macOS系统字体
        ('/System/Library/Fonts/PingFang.ttc', 'PingFang'),
        ('/System/Library/Fonts/STHeiti Light.ttc', 'STHeiti'),
        ('/System/Library/Fonts/STHeiti Medium.ttc', 'STHeiti-Medium'),
        ('/System/Library/Fonts/Hiragino Sans GB.ttc', 'Hiragino'),
        ('/Library/Fonts/Microsoft/SimSun.ttf', 'SimSun'),
        ('/Library/Fonts/Arial Unicode.ttf', 'Arial-Unicode'),
        # 项目字体目录
        (f'{FONTS_FOLDER}/SimSun.ttf', 'SimSun'),
        (f'{FONTS_FOLDER}/SourceHanSerifCN-Regular.otf', 'SourceHan'),
        # Windows系统字体
        ('C:/Windows/Fonts/simsun.ttc', 'SimSun-Win'),
        ('C:/Windows/Fonts/simhei.ttf', 'SimHei-Win')
    ]
    
    # 尝试所有可能的字体，直到成功注册一个
    for font_path, font_name in font_files:
        try:
            if os.path.exists(font_path):
                logger.info(f"找到字体文件: {font_path}")
                pdfmetrics.registerFont(TTFont(font_name, font_path))
                logger.info(f"成功注册中文字体: {font_path} 作为 {font_name}")
                return font_name
            else:
                logger.info(f"字体文件不存在: {font_path}")
        except Exception as e:
            logger.warning(f"注册字体 {font_path} 失败: {str(e)}")
            logger.warning(traceback.format_exc())
    
    # 如果无法找到中文字体，尝试使用默认字体
    logger.warning("无法注册中文字体，将使用默认字体")
    return 'Helvetica'

# 核心导出函数
def export_comments_to_pdf(class_name=None, output_file=None, school_name=None, school_year=None):
    """
    将学生评语导出为PDF文件
    
    参数:
    - class_name: 班级名称（可选，仅导出指定班级）
    - output_file: 输出文件名（可选，如未指定则自动生成）
    - school_name: 学校名称（可选，显示在标题中）
    - school_year: 学年（可选，显示在标题中）
    
    返回:
    - 包含状态和文件路径的字典
    """
    logger.info(f"开始导出评语PDF，班级: {class_name}, 学校: {school_name}, 学年: {school_year}")
    
    # 检查PDF生成库是否可用
    if not REPORTLAB_AVAILABLE:
        logger.error("PDF生成库(ReportLab)未安装")
        return {
            'status': 'error', 
            'message': 'PDF生成库(ReportLab)未安装，无法生成PDF文件。请安装库: pip install reportlab'
        }
    
    # 确保导出目录存在且可写
    try:
        if not os.path.exists(EXPORTS_FOLDER):
            os.makedirs(EXPORTS_FOLDER, exist_ok=True)
            logger.info(f"创建导出目录: {EXPORTS_FOLDER}")
            
        if not os.access(EXPORTS_FOLDER, os.W_OK):
            logger.error(f"导出目录不可写: {EXPORTS_FOLDER}")
            return {'status': 'error', 'message': f'导出目录 {EXPORTS_FOLDER} 不可写，请检查权限'}
    except Exception as e:
        logger.error(f"创建导出目录时出错: {str(e)}")
        logger.error(traceback.format_exc())
        return {'status': 'error', 'message': f'创建导出目录时出错: {str(e)}'}
    
    # 生成导出文件名
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    if not output_file:
        filename = f"学生评语_{timestamp}.pdf"
    else:
        filename = output_file
    
    file_path = os.path.join(EXPORTS_FOLDER, filename)
    logger.info(f"导出文件路径: {file_path}")
    
    # 注册字体
    font_name = register_fonts()
    logger.info(f"使用字体: {font_name}")
    
    # 获取学生数据
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 查询语句
        if class_name:
            query = 'SELECT id, name, gender, class, comments, updated_at FROM students WHERE class = ? ORDER BY CAST(id AS INTEGER)'
            logger.info(f"执行查询: {query} 参数: {class_name}")
            cursor.execute(query, (class_name,))
        else:
            query = 'SELECT id, name, gender, class, comments, updated_at FROM students ORDER BY class, CAST(id AS INTEGER)'
            logger.info(f"执行查询: {query}")
            cursor.execute(query)
        
        # 获取数据
        students = cursor.fetchall()
        conn.close()
        
        # 检查是否有数据
        if not students or len(students) == 0:
            logger.warning("没有找到学生数据，无法生成PDF")
            return {'status': 'error', 'message': '没有找到学生数据，无法生成PDF文件'}
        
        logger.info(f"成功获取 {len(students)} 名学生数据")
    except Exception as e:
        logger.error(f"查询学生数据时出错: {str(e)}")
        logger.error(traceback.format_exc())
        return {'status': 'error', 'message': f'查询学生数据时出错: {str(e)}'}
    
    # 生成PDF文件
    try:
        # 分析学生数据
        students_by_class = {}
        for s in students:
            class_name = s['class'] if s['class'] else '未分班'
            if class_name not in students_by_class:
                students_by_class[class_name] = []
            students_by_class[class_name].append(dict(s))
        
        # 创建简单的PDF文档 - 使用纵向A4纸张
        doc = SimpleDocTemplate(
            file_path,
            pagesize=A4,
            rightMargin=20*mm,
            leftMargin=20*mm,
            topMargin=20*mm,
            bottomMargin=20*mm
        )
        
        # 创建样式
        styles = getSampleStyleSheet()
        
        # 定义标题样式
        title_style = ParagraphStyle(
            'Title', 
            parent=styles['Title'], 
            fontName=font_name, 
            fontSize=18, 
            alignment=1,  # 居中
            spaceAfter=10*mm
        )
        
        # 定义班级标题样式
        class_style = ParagraphStyle(
            'Class', 
            parent=styles['Heading1'], 
            fontName=font_name, 
            fontSize=16, 
            alignment=0,  # 左对齐
            spaceAfter=5*mm
        )
        
        # 定义学生名称样式
        student_style = ParagraphStyle(
            'Student', 
            parent=styles['Heading2'], 
            fontName=font_name, 
            fontSize=14, 
            alignment=0,  # 左对齐
            spaceAfter=2*mm
        )
        
        # 定义评语样式
        comment_style = ParagraphStyle(
            'Comment', 
            parent=styles['Normal'], 
            fontName=font_name, 
            fontSize=12, 
            alignment=0,  # 左对齐
            firstLineIndent=5*mm,
            spaceBefore=2*mm,
            spaceAfter=5*mm
        )
        
        # 定义时间样式
        time_style = ParagraphStyle(
            'Time', 
            parent=styles['Normal'], 
            fontName=font_name, 
            fontSize=10, 
            alignment=0,  # 左对齐
            leftIndent=10*mm,
            textColor=colors.gray
        )
        
        # 创建文档内容
        story = []
        
        # 添加文档标题
        title = f"学生评语汇总 - {school_name} {school_year}" if school_name and school_year else "学生评语汇总"
        story.append(Paragraph(title, title_style))
        
        # 处理每个班级
        for class_name, class_students in students_by_class.items():
            # 添加班级标题
            story.append(Paragraph(f"班级：{class_name}", class_style))
            
            # 处理每个学生
            for student in class_students:
                try:
                    # 安全获取学生数据
                    name = str(student.get('name', '')) if student.get('name') is not None else '未知学生'
                    gender = str(student.get('gender', '')) if student.get('gender') is not None else ''
                    student_id = str(student.get('id', '')) if student.get('id') is not None else ''
                    updated_at = str(student.get('updated_at', '')) if student.get('updated_at') is not None else '未更新'
                    
                    # 处理评语，移除所有可能导致问题的字符
                    raw_comments = student.get('comments', '')
                    if raw_comments is None or raw_comments == '':
                        comments = '暂无评语'
                    else:
                        comments = str(raw_comments).replace('<', ' ').replace('>', ' ')
                    
                    # 添加学生信息
                    student_info = f"{name} ({gender}) - 学号: {student_id}"
                    story.append(Paragraph(student_info, student_style))
                    
                    # 添加评语
                    story.append(Paragraph(comments, comment_style))
                    
                    # 添加更新时间
                    story.append(Paragraph(f"更新时间: {updated_at}", time_style))
                    
                    # 添加分隔空间
                    story.append(Spacer(1, 5*mm))
                    
                except Exception as e:
                    logger.error(f"处理学生 {student.get('name')} 数据时出错: {str(e)}")
                    # 添加错误信息
                    error_style = ParagraphStyle('Error', parent=styles['Normal'], fontName=font_name, textColor=colors.red)
                    story.append(Paragraph(f"处理该学生数据时出错: {str(e)}", error_style))
                    story.append(Spacer(1, 5*mm))
            
            # 在每个班级后添加分页符（除了最后一个班级）
            if class_name != list(students_by_class.keys())[-1]:
                story.append(PageBreak())
        
        # 构建PDF
        doc.build(story)
        
        # 检查文件是否成功生成
        if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
            logger.info(f"PDF文件成功生成: {file_path}")
            return {
                'status': 'ok',
                'message': '评语导出成功',
                'file_path': file_path,
                'download_url': f'/download/exports/{filename}'
            }
        else:
            return {'status': 'error', 'message': 'PDF文件生成失败，文件不存在或为空'}
    except Exception as e:
        logger.error(f"生成PDF时出错: {str(e)}")
        logger.error(traceback.format_exc())
        return {'status': 'error', 'message': f'生成PDF时出错: {str(e)}'} 