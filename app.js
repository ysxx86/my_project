// @charset UTF-8
// 班主任管理系统 - 主应用文件

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// API路由
const apiRouter = require('./routes/api');

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname)));

// API路由
app.use('/api', apiRouter);

// 页面路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/students', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'students.html'));
});

app.get('/grades', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'grades.html'));
});

app.get('/export', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'export.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'settings.html'));
});

// 确保数据目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 确保备份目录存在
const backupDir = path.join(dataDir, 'backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器已启动，访问 http://localhost:${PORT}`);
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
    console.error('未捕获的异常:', err);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
}); 