# 班主任管理系统

这是一个用于班主任日常工作管理的系统，包括学生信息管理、评语管理、成绩管理和报告导出等功能。
后面所有的开发工作都是基于原始UI界面原型不变的情况进行开发，而不是随意改变UI界面。
所有的编码都按照中文的编码进行编写，避免出现乱码现象。
## 功能特点

- **学生管理**：添加、编辑、删除学生信息，支持Excel批量导入
- **评语管理**：为每个学生添加和编辑评语
- **成绩管理**：记录和管理学生各科目成绩
- **报告导出**：将学生信息、评语和成绩导出为Word文档

## 系统要求

- **前端**：现代浏览器（Chrome、Firefox、Edge等）
- **后端**：Python 3.6+
- **依赖**：Flask、pandas、openpyxl等（详见requirements.txt）

## 更新说明

系统已经进行整合和简化，主要变更如下：

1. 将多个服务器版本合并为一个统一的版本
2. 添加了导入学生前清空数据库的功能（避免保留其他班级学生）
3. 简化了启动方式，只需双击`start.bat`即可启动系统

## 快速启动

双击`start.bat`即可启动班主任管理系统服务器。

## 系统功能

- 学生信息导入（Excel）：导入时会先清空所有学生数据，再导入新数据
- 学生信息管理
- 成绩录入与统计
- 评语生成与管理
- 数据导出

## 使用说明

### 学生导入功能

1. 在学生管理页面，点击"导入学生名单"按钮
2. 点击"下载模板"获取Excel导入模板
3. 按照模板格式填写学生信息
4. 点击"选择文件"或将文件拖拽到指定区域上传
5. 系统会自动解析Excel文件并显示预览
6. 确认无误后，点击"确认导入"完成导入

### 注意事项

- Excel文件必须包含以下列：学号、姓名、性别、出生日期、家长电话、家庭住址、备注
- 导入时会自动检查学号是否重复，重复的学号将更新现有学生信息
- 系统默认提供一个管理员账号：用户名 admin，密码 admin123
- 后端服务器默认运行在8080端口，如需更改，请修改server.py和前端JS文件中的端口配置

### 解决图标字体加载问题

如果您看到"Slow network is detected"警告消息，这是因为Boxicons图标字体从CDN加载较慢。解决方法：

1. 在`fonts`目录下载boxicons.woff2字体文件（参考fonts/README.txt说明）
2. 系统已配置使用本地字体文件，确保文件放置正确即可
3. 如果问题仍然存在，请检查您的网络连接或使用Chrome开发工具禁用这类警告

## 技术架构

- **前端**：HTML、CSS、JavaScript、Bootstrap 5
- **后端**：Python、Flask
- **数据存储**：浏览器localStorage（前端）、临时文件（后端）
- **文档生成**：docx.js

## 开发者信息

本系统由班主任管理系统开发团队开发，用于提高班主任工作效率和管理质量。 
Deepseek API接口文档
首次调用 API
DeepSeek API 使用与 OpenAI 兼容的 API 格式，通过修改配置，您可以使用 OpenAI SDK 来访问 DeepSeek API，或使用与 OpenAI API 兼容的软件。

PARAM	VALUE
base_url *       	https://api.deepseek.com
api_key	apply for an API key
* 出于与 OpenAI 兼容考虑，您也可以将 base_url 设置为 https://api.deepseek.com/v1 来使用，但注意，此处 v1 与模型版本无关。

* deepseek-chat 模型已全面升级为 DeepSeek-V3，接口不变。 通过指定 model='deepseek-chat' 即可调用 DeepSeek-V3。

* deepseek-reasoner 是 DeepSeek 最新推出的推理模型 DeepSeek-R1。通过指定 model='deepseek-reasoner'，即可调用 DeepSeek-R1。

调用对话 API
在创建 API key 之后，你可以使用以下样例脚本的来访问 DeepSeek API。样例为非流式输出，您可以将 stream 设置为 true 来使用流式输出。

curl
python
nodejs
# Please install OpenAI SDK first: `pip3 install openai`

from openai import OpenAI

client = OpenAI(api_key="<DeepSeek API Key>", base_url="https://api.deepseek.com")

response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": "Hello"},
    ],
    stream=False
)

print(response.choices[0].message.content)