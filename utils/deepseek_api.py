# -*- coding: utf-8 -*-
import os
import json
import requests
import logging
from typing import Dict, Any, Optional

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DeepSeekAPI:
    """DeepSeek API封装类，用于调用DeepSeek AI大模型生成学生评语"""

    # API端点
    API_URL = "https://api.deepseek.com/v1/chat/completions"
    
    def __init__(self, api_key: Optional[str] = None):
        """初始化DeepSeek API客户端
        
        Args:
            api_key: DeepSeek API密钥，如果不提供则从环境变量获取
        """
        self.api_key = api_key or os.environ.get("DEEPSEEK_API_KEY")
        if not self.api_key:
            logger.warning("未设置DeepSeek API密钥，请设置环境变量DEEPSEEK_API_KEY或直接提供api_key参数")
    
    def test_connection(self) -> Dict[str, Any]:
        """测试API连接是否正常
        
        Returns:
            包含测试结果的字典，格式为 {"status": "success|error", "message": "..."}
        """
        if not self.api_key:
            return {
                "status": "error",
                "message": "未设置API密钥，无法测试连接"
            }
            
        # 构建请求头
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        # 构建一个简单的请求体
        payload = {
            "model": "deepseek-chat",
            "messages": [
                {"role": "system", "content": "你是一个简单的API测试助手。"},
                {"role": "user", "content": "返回'连接测试成功'这几个字，不要返回其他内容。"}
            ],
            "temperature": 0.1,
            "max_tokens": 10
        }
        
        try:
            # 发送请求
            logger.info("正在测试DeepSeek API连接...")
            response = requests.post(self.API_URL, headers=headers, json=payload, timeout=10)
            response.raise_for_status()  # 检查HTTP错误
            
            # 解析响应
            result = response.json()
            
            # 检查响应是否包含预期字段
            if "choices" in result and len(result["choices"]) > 0:
                logger.info("DeepSeek API连接测试成功")
                return {
                    "status": "success",
                    "message": "API连接正常"
                }
            else:
                logger.warning(f"API响应格式异常: {result}")
                return {
                    "status": "error",
                    "message": "API响应格式异常，但连接成功"
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"API连接测试失败: {str(e)}")
            return {
                "status": "error",
                "message": f"API连接失败: {str(e)}"
            }
        except json.JSONDecodeError:
            logger.error("API返回的不是有效的JSON格式")
            return {
                "status": "error",
                "message": "API返回格式错误"
            }
        except Exception as e:
            logger.error(f"API连接测试时发生未知错误: {str(e)}")
            return {
                "status": "error",
                "message": f"API连接测试失败: {str(e)}"
            }
    
    def generate_comment(self, 
                        student_info: Dict[str, Any], 
                        style: str = "鼓励性的", 
                        tone: str = "正式的", 
                        max_length: int = 200) -> Dict[str, Any]:
        """生成学生评语
        
        Args:
            student_info: 学生信息，包含姓名、性别、特点、爱好等
            style: 评语风格，如"鼓励性的"、"严肃的"、"中肯的"等
            tone: 评语语气，如"正式的"、"亲切的"、"严厉的"等
            max_length: 评语最大字数
            
        Returns:
            包含生成评语的字典，格式为 {"status": "ok|error", "comment": "...", "message": "..."}
        """
        if not self.api_key:
            return {
                "status": "error", 
                "message": "未设置DeepSeek API密钥，无法调用API",
                "comment": ""
            }

        # 构建请求头
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        # 构建提示语
        gender = "他" if student_info.get("gender") == "男" else "她"
        
        prompt = f"""
你是一名经验丰富的班主任，请为以下学生生成一段不超过{max_length}字的评语。
评语应该是{style}和{tone}的。

学生信息:
- 姓名: {student_info.get('name', '学生')}
- 性别: {student_info.get('gender', '未知')}
- 个性特点: {student_info.get('personality', '未提供')}
- 学习表现: {student_info.get('study_performance', '未提供')}
- 课外活动/爱好: {student_info.get('hobbies', '未提供')}
- 需要改进的方面: {student_info.get('improvement', '未提供')}

请根据以上信息，生成一段全面、具体且有针对性的评语，突出{gender}的优点，同时也提出建设性的改进建议。
评语的长度必须控制在{max_length}字以内，请确保评语内容积极向上且有指导意义。
不要在回复中写除了评语之外的任何内容。
"""

        # 构建请求体
        payload = {
            "model": "deepseek-chat",
            "messages": [
                {"role": "system", "content": "你是一名专业的班主任，善于为学生撰写个性化、有启发性的评语。"},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": max_length * 2  # 确保有足够的token来生成评语
        }
        
        try:
            # 发送请求
            logger.info(f"正在为学生 {student_info.get('name')} 生成评语...")
            response = requests.post(self.API_URL, headers=headers, json=payload)
            response.raise_for_status()  # 检查HTTP错误
            
            # 解析响应
            result = response.json()
            
            # 提取生成的评语
            if "choices" in result and len(result["choices"]) > 0:
                comment = result["choices"][0]["message"]["content"].strip()
                # 确保评语不超过最大长度
                if len(comment) > max_length:
                    comment = comment[:max_length]
                
                return {
                    "status": "ok",
                    "comment": comment,
                    "message": "评语生成成功"
                }
            else:
                logger.error(f"API返回错误: {result}")
                return {
                    "status": "error",
                    "message": f"评语生成失败: API返回格式异常",
                    "comment": ""
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"API请求错误: {str(e)}")
            return {
                "status": "error",
                "message": f"评语生成失败: {str(e)}",
                "comment": ""
            }
        except json.JSONDecodeError:
            logger.error("API返回的不是有效的JSON格式")
            return {
                "status": "error",
                "message": "评语生成失败: API返回格式错误",
                "comment": ""
            }
        except Exception as e:
            logger.error(f"生成评语时发生未知错误: {str(e)}")
            return {
                "status": "error",
                "message": f"评语生成失败: {str(e)}",
                "comment": ""
            } 