# -*- coding: utf-8 -*-
import json
import logging
import traceback
from typing import Dict, Any, Optional
from .deepseek_api import DeepSeekAPI

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CommentGenerator:
    """评语生成器类，负责处理评语生成的所有相关逻辑"""
    
    def __init__(self, api_key: Optional[str] = None):
        """初始化评语生成器
        
        Args:
            api_key: DeepSeek API密钥
        """
        self.deepseek_api = DeepSeekAPI(api_key)
    
    def generate_comment(self, 
                        student_info: Dict[str, Any],
                        style: str = "鼓励性的",
                        tone: str = "正式的",
                        max_length: int = 200) -> Dict[str, Any]:
        """生成学生评语
        
        Args:
            student_info: 学生信息字典，包含：
                - name: 学生姓名
                - gender: 性别
                - personality: 个性特点
                - study_performance: 学习表现
                - hobbies: 课外活动/爱好
                - improvement: 需要改进的方面
            style: 评语风格
            tone: 评语语气
            max_length: 评语最大字数
            
        Returns:
            Dict[str, Any]: 包含生成结果的字典
                {
                    "status": "ok" | "error",
                    "comment": "生成的评语内容",
                    "message": "状态信息"
                }
        """
        try:
            logger.info(f"开始为学生 {student_info.get('name')} 生成评语")
            logger.info(f"生成参数: style={style}, tone={tone}, max_length={max_length}")
            
            # 调用DeepSeek API生成评语
            result = self.deepseek_api.generate_comment(
                student_info=student_info,
                style=style,
                tone=tone,
                max_length=max_length
            )
            
            # 检查API返回结果
            if result["status"] == "ok" and result["comment"]:
                logger.info(f"成功生成评语，长度: {len(result['comment'])} 字符")
                return {
                    "status": "ok",
                    "comment": result["comment"],
                    "message": "评语生成成功"
                }
            else:
                logger.error(f"API返回错误: {result}")
                return {
                    "status": "error",
                    "comment": "",
                    "message": result.get("message", "评语生成失败")
                }
                
        except Exception as e:
            logger.error(f"生成评语时发生错误: {str(e)}")
            logger.error(f"错误堆栈: {traceback.format_exc()}")
            return {
                "status": "error",
                "comment": "",
                "message": f"评语生成失败: {str(e)}"
            }
    
    def format_student_info(self, student_data: Dict[str, Any]) -> Dict[str, Any]:
        """格式化学生信息，确保所有必要字段都存在
        
        Args:
            student_data: 原始学生数据
            
        Returns:
            Dict[str, Any]: 格式化后的学生信息
        """
        return {
            "name": student_data.get("name", "学生"),
            "gender": student_data.get("gender", "未知"),
            "personality": student_data.get("personality", "未提供"),
            "study_performance": student_data.get("study_performance", "未提供"),
            "hobbies": student_data.get("hobbies", "未提供"),
            "improvement": student_data.get("improvement", "未提供")
        }
    
    def validate_request(self, request_data: Dict[str, Any]) -> tuple[bool, str]:
        """验证请求数据的有效性
        
        Args:
            request_data: 请求数据字典
            
        Returns:
            tuple[bool, str]: (是否有效, 错误信息)
        """
        # 检查必要字段
        required_fields = ["student_id"]
        for field in required_fields:
            if field not in request_data:
                return False, f"缺少必要字段: {field}"
        
        # 验证数值字段
        if "max_length" in request_data:
            try:
                max_length = int(request_data["max_length"])
                if not (50 <= max_length <= 500):
                    return False, "最大字数必须在50-500之间"
            except ValueError:
                return False, "最大字数必须是有效的数字"
        
        return True, "" 