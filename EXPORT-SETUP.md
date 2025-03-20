# 报告导出功能设置指南

为了使用班主任管理系统的报告导出功能，您需要进行一些设置。按照以下步骤操作，可以确保导出功能正常工作。

## 1. 安装必要的Python库

系统的报告导出功能依赖于几个Python库。打开命令行工具（如PowerShell、CMD或终端），执行以下命令：

```bash
pip install docxtpl python-docx
```

这将安装：
- `docxtpl`：用于根据Word模板替换变量生成报告
- `python-docx`：提供Word文档操作支持

### Windows系统常见问题及解决方法

如果在Windows系统上遇到以下错误：

```
Fatal error in launcher: Unable to create process using '...\python.exe'
```

请尝试以下方法解决：

1. 使用Python模块方式安装：
   ```
   python -m pip install docxtpl python-docx
   ```

2. 使用完整路径安装：
   ```
   C:\Users\用户名\ClassMaster\venv\Scripts\python.exe -m pip install docxtpl python-docx
   ```

3. 或者使用requirements.txt安装所有依赖：
   ```
   C:\Users\用户名\ClassMaster\venv\Scripts\python.exe -m pip install -r requirements.txt
   ```

## 2. 准备默认模板

系统需要一个默认的报告模板才能正常工作。请按照以下步骤准备：

1. 打开 `templates/docx/default_template.txt` 文件
2. 复制其中的内容到Microsoft Word或WPS
3. 调整格式和布局以满足您的需求
4. 保存为Word文档(.docx)格式
5. 将文件保存为 `templates/docx/default_template.docx`

或者，您也可以转换HTML模板：

1. 用浏览器打开 `templates/docx/examples/template_sample.html`
2. 全选内容并复制
3. 粘贴到Word文档中
4. 调整格式
5. 保存为 `templates/docx/default_template.docx`

## 3. 了解占位符

系统使用【】格式的占位符，例如【姓名】、【学号】等。请确保您的模板中使用了正确的占位符格式。

常用的占位符包括：
- 【学号】、【姓名】、【性别】、【班级】
- 【评语】
- 【语文】、【数学】、【英语】等成绩
- 【学校名称】、【教师姓名】、【日期】

完整的占位符列表可以在 `templates/docx/report_template_example.txt` 中找到。

## 4. 测试导出功能

设置完成后，请按照以下步骤测试导出功能：

1. 启动系统
2. 进入"导出报告"页面
3. 选择一个学生
4. 点击"导出报告"
5. 如果一切正常，将生成并下载一个Word文档

## 故障排除

如果遇到问题，请检查：

1. Python依赖是否正确安装（docxtpl、python-docx）
2. 默认模板是否存在于正确位置
3. 模板中的占位符格式是否正确（使用【】而不是{}）
4. 服务器日志中是否有错误信息

## 常见错误

### 1. 找不到模块
```
ModuleNotFoundError: No module named 'docxtpl'
```
解决方法：确保使用正确的Python环境安装了依赖库。

### 2. 模板文件不存在
```
模板文件不存在: templates/docx/default_template.docx
```
解决方法：按照上述步骤2创建默认模板文件。

### 3. 导出报告时出错
```
生成报告失败: [Errno 2] No such file or directory
```
解决方法：检查模板路径和文件是否正确。

如需更多帮助，请联系管理员。 