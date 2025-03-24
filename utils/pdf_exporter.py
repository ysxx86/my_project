#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
PDF导出模块：专门负责生成学生评语的PDF文件
更加精简和稳健的实现 - 修复评语对齐问题、添加首行缩进、自适应评语高度
"""

import os
import logging
import sqlite3
import traceback
import time
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

# 确保导出目录存在
if not os.path.exists(EXPORTS_FOLDER):
    try:
os.makedirs(EXPORTS_FOLDER, exist_ok=True)
        logger.info(f"创建导出目录: {EXPORTS_FOLDER}")
    except Exception as e:
        logger.error(f"创建导出目录失败: {str(e)}")

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
    start_time = time.time()
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
            
        # 尝试创建测试文件验证写入权限
        test_file = os.path.join(EXPORTS_FOLDER, "test_write.txt")
        try:
            with open(test_file, 'w') as f:
                f.write("测试写入权限")
            if os.path.exists(test_file):
                os.remove(test_file)
            logger.info("导出目录写入权限测试成功")
        except Exception as e:
            logger.error(f"导出目录写入权限测试失败: {str(e)}")
            return {'status': 'error', 'message': f'导出目录没有写入权限: {str(e)}'}
            
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
    try:
    font_name = register_fonts()
    logger.info(f"使用字体: {font_name}")
    except Exception as e:
        logger.error(f"注册字体时出错: {str(e)}")
        return {'status': 'error', 'message': f'注册字体时出错: {str(e)}'}
    
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
        
        # 如果学生数量过多，考虑分批处理
        total_students = len(students)
        if total_students > 100:
            logger.warning(f"学生数量较多 ({total_students})，PDF生成可能需要较长时间")
        
        logger.info(f"成功获取 {total_students} 名学生数据")
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
        
        # 创建横向A4文档 - 与打印预览保持一致
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
        
        # 定义标题样式
        title_style = ParagraphStyle(
            'Title', 
            parent=styles['Normal'], 
            fontName=font_name, 
            fontSize=14, 
            alignment=0,  # 左对齐
            spaceAfter=2*mm,
            fontWeight='bold'
        )
        
        # 定义班级标题样式
        class_style = ParagraphStyle(
            'Class', 
            parent=styles['Normal'], 
            fontName=font_name, 
            fontSize=12, 
            alignment=0,  # 左对齐
            spaceBefore=1*mm,
            spaceAfter=2*mm
        )
        
        # 定义页码样式
        page_number_style = ParagraphStyle(
            'PageNumber',
            parent=styles['Normal'], 
            fontName=font_name, 
            fontSize=9,
            alignment=1,  # 居中
            textColor=colors.gray
        )
        
        # 创建文档内容
        story = []
        
        # 处理每个班级
        for class_name, class_students in students_by_class.items():
            # 创建标题和班级信息放在同一行
            title_elements = [
                [Paragraph("学生评语表", title_style), 
                 Paragraph(f"班级：{class_name}", class_style)]
            ]
            title_table = Table(title_elements, colWidths=[100*mm, 150*mm])
            title_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('ALIGN', (0, 0), (0, 0), 'LEFT'),
                ('ALIGN', (1, 0), (1, 0), 'LEFT'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]))
            story.append(title_table)
            story.append(Spacer(1, 5*mm))
            
            # 每页显示6个学生卡片（3列2行）
            cards_per_page = 6
            
            # 按每页6个学生分组
            for page_start in range(0, len(class_students), cards_per_page):
                page_students = class_students[page_start:page_start + cards_per_page]
                
                # 创建本页的学生卡片表格
                student_cards = []
                
                # 每行3个学生卡片，计算每行的最大评语高度
                for row_start in range(0, len(page_students), 3):
                    row_students = page_students[row_start:row_start + 3]
                    
                    # 预先计算所有评语，找出最大高度
                    row_comments = []
                    max_height = 0
                    
                    for student in row_students:
                    raw_comments = student.get('comments', '')
                        comments = str(raw_comments).replace('<', ' ').replace('>', ' ') if raw_comments else '暂无评语'
                        
                        # 创建评语段落以测量高度
                        comment_style = ParagraphStyle(
                            'Comment',
                            parent=styles['Normal'],
                            fontName=font_name,
                            fontSize=11,
                            alignment=0,
                            firstLineIndent=22,  # 设置首行缩进2个字符
                            spaceBefore=2*mm,
                            spaceAfter=2*mm,
                            leading=14,  # 行间距
                            wordWrap='CJK',  # 优化中文换行
                            allowWidows=0,  # 防止孤行
                            allowOrphans=0  # 防止孤行
                        )
                        
                        # 评语的有效宽度应考虑到表格内边距
                        effective_width = 70*mm  # 考虑到左右内边距
                        p = Paragraph(comments, comment_style)
                        w, h = p.wrap(effective_width, 500*mm)  # 给予充足高度以测量实际需要的高度
                        if h > max_height:
                            max_height = h
                        
                        row_comments.append((comments, p, h))
                    
                    # 设置最小高度，确保短评语也有足够空间
                    if max_height < 30*mm:
                        max_height = 30*mm
                    
                    # 为长评语增加额外空间，确保内容不会被截断
                    max_height += 10*mm
                    
                    # 现在用计算好的高度创建卡片
                    row_cards = []
                    
                    for i, student in enumerate(row_students):
                        if i < len(row_comments):
                            # 处理学生数据
                            student_id = str(student.get('id', '未知ID'))
                            student_name = str(student.get('name', '未知姓名'))
                            student_gender = str(student.get('gender', '未知'))
                            comments = row_comments[i][0]
                            
                            # 创建学生卡片内容
                            student_info = f"{student_name} ({student_gender}) - 学号: {student_id}"
                            
                            # 学生信息样式
                            student_info_style = ParagraphStyle(
                                'StudentInfo',
                                parent=styles['Normal'],
                                fontName=font_name,
                                fontSize=12,
                                alignment=0,
                                fontWeight='bold',
                                spaceAfter=3*mm
                            )
                            
                            # 创建卡片内容元素，仅包含学生信息和评语
                            card_elements = [
                                [Paragraph(student_info, student_info_style)],
                                [Paragraph(comments, comment_style)]
                            ]
                            
                            # 创建学生卡片表格，使用计算好的高度
                            card_style = TableStyle([
                                ('BOX', (0, 0), (-1, -1), 1, colors.black),
                                ('VALIGN', (0, 0), (0, 0), 'TOP'),  # 信息顶部对齐
                                ('VALIGN', (0, 1), (0, 1), 'TOP'),  # 评语顶部对齐
                                ('LEFTPADDING', (0, 0), (-1, -1), 5*mm),
                                ('RIGHTPADDING', (0, 0), (-1, -1), 5*mm),
                                ('TOPPADDING', (0, 0), (-1, -1), 5*mm),
                                ('BOTTOMPADDING', (0, 0), (-1, -1), 5*mm),
                                # 添加线框颜色
                                ('LINEAFTER', (0, 0), (-1, -1), 1, colors.black),
                                ('LINEBEFORE', (0, 0), (-1, -1), 1, colors.black),
                                ('LINEABOVE', (0, 0), (-1, -1), 1, colors.black),
                                ('LINEBELOW', (0, 0), (-1, -1), 1, colors.black),
                            ])
                            
                            # 使用自适应高度，确保所有卡片高度一致
                            # 移除底部时间行，只保留标题和评语两行
                            card_table = Table(card_elements, 
                                              colWidths=[80*mm],
                                              rowHeights=[10*mm, max_height],  # 只有两行：标题和评语
                                              hAlign='CENTER',  # 水平居中对齐
                                              splitByRow=1)  # 确保按行分割但不拆分行内容
                            card_table.setStyle(card_style)
                            row_cards.append(card_table)
                    
                    # 补齐行中不足的卡片（使用空白）
                    while len(row_cards) < 3:
                        # 创建一个空的卡片，保持与其他卡片相同大小
                        empty_card = Table([[""], [""]], 
                                          colWidths=[80*mm],
                                          rowHeights=[10*mm, max_height],  # 只有两行
                                          hAlign='CENTER')  # 水平居中对齐
                        empty_card.setStyle(TableStyle([
                            ('BOX', (0, 0), (-1, -1), 1, colors.white),  # 白色边框，实际上不可见
                        ]))
                        row_cards.append(empty_card)
                    
                    student_cards.append(row_cards)
                
                # 创建学生卡片网格
                grid_style = TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),  # 顶部对齐
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),  # 居中对齐表格
                    # 减少内边距，使卡片更紧凑
                    ('LEFTPADDING', (0, 0), (-1, -1), 1.5*mm),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 1.5*mm),
                    ('TOPPADDING', (0, 0), (-1, -1), 1.5*mm),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 1.5*mm),
                ])
                
                # 使用固定宽度确保所有卡片对齐
                student_grid = Table(student_cards, 
                                    colWidths=[85*mm, 85*mm, 85*mm],
                                    repeatRows=0)  # 首行不重复
                student_grid.setStyle(grid_style)
                story.append(student_grid)
                
                # 每页结束后添加分页符（除非是最后一页）
                if page_start + cards_per_page < len(class_students):
                    story.append(PageBreak())
            
            # 每个班级结束后添加分页符（除非是最后一个班级）
            if class_name != list(students_by_class.keys())[-1]:
                story.append(PageBreak())
        
        # 添加页码
        def add_page_number(canvas, doc):
            canvas.saveState()
            # 绘制页码
            page_num = canvas.getPageNumber()
            text = f"第 {page_num} 页"
            canvas.setFont(font_name, 9)
            canvas.setFillColor(colors.gray)
            canvas.drawCentredString(doc.width/2 + doc.leftMargin, doc.bottomMargin - 5*mm, text)
            canvas.restoreState()
            
        # 构建PDF文档
        doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
        
        # 检查文件是否成功生成
        if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
            logger.info(f"PDF文件成功生成: {file_path}")
            
            # 定时检查生成进度
            current_time = time.time()
            if current_time - start_time > 30:  # 如果已经运行超过30秒
                logger.warning(f"PDF生成时间较长: {current_time - start_time:.2f}秒")
            
            # 生成URL
            server_url = "http://127.0.0.1:8080"  # 默认本地地址
            download_url = f"/download/exports/{filename}"
            
            # 返回结果
            elapsed_time = time.time() - start_time
            logger.info(f"PDF导出完成，用时: {elapsed_time:.2f}秒")
            return {
                'status': 'ok',
                'file_path': file_path,
                'download_url': download_url,
                'filename': filename
            }
        else:
            return {'status': 'error', 'message': 'PDF文件生成失败，文件不存在或为空'}
    except Exception as e:
        logger.error(f"生成PDF文件时出错: {str(e)}")
        logger.error(traceback.format_exc())
        return {'status': 'error', 'message': f'生成PDF文件时出错: {str(e)}'} 