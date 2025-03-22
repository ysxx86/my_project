# ClassMaster - 班主任管理系统

一个用于管理班级学生信息、成绩和评语的简单系统。

## 功能特点

- 学生信息管理
- 成绩记录与统计
- 学生评语管理
- 综合素质报告单导出
- 数据备份与恢复

## 技术栈

- 前端：HTML, CSS, JavaScript, Bootstrap 5
- 后端：Node.js, Express
- 数据库：SQLite

## 安装步骤

1. 确保已安装 Node.js (v14.0.0 或更高版本)

2. 克隆仓库
   ```
   git clone https://github.com/yourusername/classmaster.git
   cd classmaster
   ```

3. 安装依赖
   ```
   npm install
   ```

4. 启动服务器
   ```
   npm start
   ```

5. 在浏览器中访问 `http://localhost:3000`

## 开发模式

使用以下命令启动开发模式（自动重启服务器）:

```
npm run dev
```

## 数据库

系统使用SQLite数据库存储所有数据，数据文件位于 `data/classmaster.db`。系统会自动创建所需的数据表。

## 备份与恢复

系统提供数据备份和恢复功能，备份文件存储在 `data/backups` 目录中。

## 许可

MIT许可证