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
        return False
    
    # 尝试注册常见中文字体
    font_files = [
        (f'{FONTS_FOLDER}/SimSun.ttf', 'SimSun'),
        (f'{FONTS_FOLDER}/SourceHanSerifCN-Regular.otf', 'SimSun'),
        ('C:/Windows/Fonts/simsun.ttc', 'SimSun'),
        ('C:/Windows/Fonts/simhei.ttf', 'SimHei'),
        ('/System/Library/Fonts/PingFang.ttc', 'PingFang'),
        ('/Library/Fonts/Microsoft/SimSun.ttf', 'SimSun'),
        ('/Library/Fonts/Microsoft/SimHei.ttf', 'SimHei')
    ]
    
    # 尝试所有可能的字体，直到成功注册一个
    for font_path, font_name in font_files:
        try:
            if os.path.exists(font_path):
                pdfmetrics.registerFont(TTFont(font_name, font_path))
                logger.info(f"成功注册中文字体: {font_path}")
                return font_name
        except Exception as e:
            logger.warning(f"注册字体 {font_path} 失败: {e}")
    
    # 如果所有尝试都失败，使用默认字体
    logger.warning("无法注册中文字体，将使用默认字体")
    return 'Helvetica'

# 核心导出函数
def export_comments_to_pdf(class_name=None, output_file=None):
    """
    将学生评语导出为PDF文件
    
    参数:
    - class_name: 班级名称（可选，仅导出指定班级）
    - output_file: 输出文件名（可选，如未指定则自动生成）
    
    返回:
    - 包含状态和文件路径的字典
    """
    # 检查PDF生成库是否可用
    if not REPORTLAB_AVAILABLE:
        return {
            'status': 'error', 
            'message': 'PDF生成库(ReportLab)未安装，无法生成PDF文件。请安装库: pip install reportlab'
        }
    
    # 确保导出目录存在且可写
    try:
        if not os.path.exists(EXPORTS_FOLDER):
            os.makedirs(EXPORTS_FOLDER, exist_ok=True)
            
        if not os.access(EXPORTS_FOLDER, os.W_OK):
            return {'status': 'error', 'message': f'导出目录 {EXPORTS_FOLDER} 不可写，请检查权限'}
    except Exception as e:
        return {'status': 'error', 'message': f'创建导出目录时出错: {str(e)}'}
    
    # 生成导出文件名
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    if not output_file:
        filename = f"学生评语_{timestamp}.pdf"
    else:
        filename = output_file
    
    file_path = os.path.join(EXPORTS_FOLDER, filename)
    
    # 注册字体
    font_name = register_fonts()
    
    # 获取学生数据
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 查询语句
        if class_name:
            cursor.execute('SELECT id, name, gender, class, comments, updated_at FROM students WHERE class = ? ORDER BY CAST(id AS INTEGER)', (class_name,))
        else:
            cursor.execute('SELECT id, name, gender, class, comments, updated_at FROM students ORDER BY class, CAST(id AS INTEGER)')
        
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
        return {'status': 'error', 'message': f'查询学生数据时出错: {str(e)}'}
    
    # 生成PDF文件
    try:
        # 转换学生数据为字典列表并按班级分组
        students_by_class = {}
        for s in students:
            # 提取班级名称，确保有值
            class_name = s['class'] if s['class'] else '未分班'
            
            # 如果班级不存在则创建列表
            if class_name not in students_by_class:
                students_by_class[class_name] = []
            
            # 添加学生到对应班级
            students_by_class[class_name].append(dict(s))
        
        # 创建PDF文档
        doc = SimpleDocTemplate(
            file_path,
            pagesize=landscape(A4),
            rightMargin=10*mm,
            leftMargin=10*mm,
            topMargin=10*mm,
            bottomMargin=10*mm
        )
        
        # 创建样式
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('Title', parent=styles['Title'], fontName=font_name, fontSize=16, alignment=1)
        header_style = ParagraphStyle('Header', parent=styles['Heading2'], fontName=font_name, fontSize=14, alignment=0)
        normal_style = ParagraphStyle(
            'Normal', 
            parent=styles['Normal'], 
            fontName=font_name, 
            fontSize=10, 
            leading=12,
            alignment=0,
            firstLineIndent=0,
            leftIndent=0
        )
        
        # 构建文档内容
        story = []
        current_page = 1
        cards_per_page = 6  # 每页6个学生，3列2行排列
        
        # 添加标题
        story.append(Paragraph("学生评语表", title_style))
        
        # 遍历每个班级
        for class_name, class_students in students_by_class.items():
            # 添加班级标题
            story.append(Paragraph(class_name, header_style))
            
            # 每6个学生一页处理
            for page_index, page_start in enumerate(range(0, len(class_students), cards_per_page)):
                # 获取当前页的学生
                page_students = class_students[page_start:page_start + cards_per_page]
                
                # 创建学生卡片表格数据
                data = []
                row = []
                
                # 处理每个学生
                for i, student in enumerate(page_students):
                    # 安全获取学生信息
                    name = student.get('name', '未知')
                    gender = student.get('gender', '')
                    student_id = student.get('id', '')
                    comments = student.get('comments', '') or '暂无评语'
                    updated_at = student.get('updated_at', '') or '未更新'
                    
                    # 构建cell内容
                    info = f"<b>{name}</b> ({gender}) - 学号: {student_id}"
                    comments_formatted = comments.replace('<', '&lt;').replace('>', '&gt;').replace('\n', '<br/>')
                    content = f"""
                    <para leftIndent="0" firstLineIndent="0">{info}</para>
                    <para leftIndent="0" firstLineIndent="0"><br/></para>
                    <para leftIndent="0" firstLineIndent="0">{comments_formatted}</para>
                    <para leftIndent="0" firstLineIndent="0"><br/></para>
                    <para leftIndent="0" firstLineIndent="0" align="right"><font size="8">更新时间: {updated_at}</font></para>
                    """
                    
                    # 添加到行
                    row.append(Paragraph(content, normal_style))
                    
                    # 每3个学生一行，或者是最后一个学生
                    if (i + 1) % 3 == 0 or i == len(page_students) - 1:
                        # 补齐空单元格
                        while len(row) < 3:
                            row.append('')
                        data.append(row)
                        row = []
                
                # 创建表格
                if data:
                    col_widths = [doc.width/3.0 - 5*mm] * 3
                    table = Table(data, colWidths=col_widths)
                    
                    # 表格样式
                    table.setStyle(TableStyle([
                        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
                        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.black),
                        ('LEFTPADDING', (0, 0), (-1, -1), 5),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                        ('TOPPADDING', (0, 0), (-1, -1), 5),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                    ]))
                    
                    story.append(table)
                    
                    # 添加页码
                    story.append(Paragraph(
                        f"第 {current_page} 页", 
                        ParagraphStyle('PageNumber', fontName=font_name, fontSize=9, alignment=1)
                    ))
                    
                    # 增加页码计数
                    current_page += 1
                    
                    # 如果不是最后一页，添加分页符
                    if page_index < (len(class_students) - 1) // cards_per_page:
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