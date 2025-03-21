#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
PDF导出测试脚本 - 用于直接测试PDF导出功能
"""

import os
import sys
import logging
import traceback

# 配置日志
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("pdf_test")

# 导入PDF导出函数
try:
    from utils.pdf_exporter import export_comments_to_pdf, REPORTLAB_AVAILABLE
    logger.info(f"导入PDF导出模块成功，ReportLab库可用: {REPORTLAB_AVAILABLE}")
except ImportError as e:
    logger.error(f"导入PDF导出模块失败: {str(e)}")
    REPORTLAB_AVAILABLE = False

def test_pdf_export():
    """测试PDF导出功能"""
    logger.info("开始测试PDF导出功能")
    
    # 检查ReportLab是否可用
    if not REPORTLAB_AVAILABLE:
        logger.error("ReportLab库不可用，无法测试PDF导出")
        return False
    
    # 测试所有班级的学生
    class_name = None
    logger.info(f"测试导出所有学生的评语")
    
    try:
        # 调用导出函数
        result = export_comments_to_pdf(class_name)
        logger.info(f"导出结果: {result}")
        
        # 检查结果
        if result and result.get('status') == 'ok':
            file_path = result.get('file_path')
            logger.info(f"PDF导出成功: {file_path}")
            
            # 检查文件是否存在
            if os.path.exists(file_path):
                file_size = os.path.getsize(file_path)
                logger.info(f"导出文件大小: {file_size} 字节")
                return True
            else:
                logger.error(f"导出文件不存在: {file_path}")
                return False
        else:
            logger.error(f"PDF导出失败: {result.get('message')}")
            return False
    except Exception as e:
        logger.error(f"测试PDF导出时出错: {str(e)}")
        logger.error(traceback.format_exc())
        return False

# 直接运行时执行测试
if __name__ == "__main__":
    success = test_pdf_export()
    logger.info(f"测试结果: {'成功' if success else '失败'}")
    sys.exit(0 if success else 1) 