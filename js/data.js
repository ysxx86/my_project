// @charset UTF-8
// 数据存储模块 - SQLite实现

// API基础URL配置
const API_BASE_URL = window.location.origin; // 使用当前域名作为API基础URL

// 学科列表常量
const SUBJECTS = [
    'daof', 'yuwen', 'shuxue', 'yingyu', 'laodong', 'tiyu', 'yinyue', 'meishu', 'kexue', 'zonghe', 'xinxi', 'shufa'
];

// 初始化数据库
async function initDatabase() {
    return new Promise((resolve, reject) => {
        console.log("尝试初始化数据库，使用本地数据模式...");
        // 由于SQLite访问存在问题，这里切换到本地存储模式
        try {
            // 确保基本数据结构存在
            if (!localStorage.getItem('students')) {
                localStorage.setItem('students', JSON.stringify([]));
            }
            if (!localStorage.getItem('comments')) {
                localStorage.setItem('comments', JSON.stringify([]));
            }
            if (!localStorage.getItem('grades')) {
                localStorage.setItem('grades', JSON.stringify([]));
            }
            console.log('本地存储模式初始化成功');
            resolve(true);
        } catch (error) {
            console.error('本地存储初始化失败:', error);
            reject(error);
        }
    });
}

// 数据操作函数
const dataService = (function() {
    // 默认导出设置
    const DEFAULT_EXPORT_SETTINGS = {
        schoolYear: '2024-2025',
        semester: '2',
        semesterText: '第二学期',
        startDate: formatDate(new Date(new Date().getFullYear(), 2, 1)), // 3月1日
        includeBasicInfo: true,
        includeGrades: true,
        includeComments: true,
        fileNameFormat: 'id_name',
        schoolName: '泉州东海湾实验学校',
        className: '六年级一班',
        teacherName: '肖老师',
        exportDate: formatDate(new Date()),
        templateId: '泉州东海湾实验学校综合素质发展报告单',
        templateName: '泉州东海湾实验学校综合素质发展报告单',
        useDefaultTemplate: false
    };
    
    // 日期格式化函数
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // 获取导出设置
    async function getExportSettings() {
        try {
            // 从本地存储获取设置
            const settingsJson = localStorage.getItem('exportSettings');
            if (settingsJson) {
                const settings = JSON.parse(settingsJson);
                return { ...DEFAULT_EXPORT_SETTINGS, ...settings };
            }
            return { ...DEFAULT_EXPORT_SETTINGS };
        } catch (error) {
            console.error('获取导出设置失败:', error);
            return { ...DEFAULT_EXPORT_SETTINGS };
        }
    }
    
    // 保存导出设置
    async function saveExportSettings(settings) {
        try {
            const mergedSettings = { ...DEFAULT_EXPORT_SETTINGS, ...settings };
            localStorage.setItem('exportSettings', JSON.stringify(mergedSettings));
            return true;
        } catch (error) {
            console.error('保存导出设置失败:', error);
            return false;
        }
    }
    
    // 更新导出设置
    async function updateExportSettings(newSettings) {
        const currentSettings = await getExportSettings();
        return saveExportSettings({ ...currentSettings, ...newSettings });
    }
    
    // 获取学生列表
    async function getStudents() {
        try {
            const studentsJson = localStorage.getItem('students');
            if (studentsJson) {
                return JSON.parse(studentsJson);
            }
            return [];
        } catch (error) {
            console.error('获取学生列表失败:', error);
            return [];
        }
    }
    
    // 设置（保存/更新）学生列表
    async function setStudents(studentList) {
        try {
            localStorage.setItem('students', JSON.stringify(studentList));
            return true;
        } catch (error) {
            console.error('保存学生列表失败:', error);
            return false;
        }
    }
    
    // 通过ID获取学生
    async function getStudentById(studentId) {
        try {
            const students = await getStudents();
            return students.find(student => student.id === studentId) || null;
        } catch (error) {
            console.error(`获取学生(ID:${studentId})失败:`, error);
            return null;
        }
    }
    
    // 获取学生评语
    async function getComments() {
        try {
            const commentsJson = localStorage.getItem('comments');
            if (commentsJson) {
                return JSON.parse(commentsJson);
            }
            return [];
        } catch (error) {
            console.error('获取评语列表失败:', error);
            return [];
        }
    }
    
    // 通过学生ID获取评语
    async function getCommentByStudentId(studentId) {
        try {
            const comments = await getComments();
            return comments.find(comment => comment.studentId === studentId) || null;
        } catch (error) {
            console.error(`获取学生(ID:${studentId})评语失败:`, error);
            return null;
        }
    }
    
    // 保存评语
    async function saveComment(comment) {
        try {
            const comments = await getComments();
            const index = comments.findIndex(c => c.studentId === comment.studentId);
            
            if (index !== -1) {
                // 更新现有评语
                comments[index] = comment;
            } else {
                // 添加新评语
                comments.push(comment);
            }
            
            localStorage.setItem('comments', JSON.stringify(comments));
            return true;
        } catch (error) {
            console.error('保存评语失败:', error);
            return false;
        }
    }
    
    // 获取成绩列表
    async function getGrades() {
        try {
            const gradesJson = localStorage.getItem('grades');
            if (gradesJson) {
                return JSON.parse(gradesJson);
            }
            return [];
        } catch (error) {
            console.error('获取成绩列表失败:', error);
            return [];
        }
    }
    
    // 通过学生ID获取成绩
    async function getGradeByStudentId(studentId) {
        try {
            const grades = await getGrades();
            return grades.find(grade => grade.studentId === studentId) || null;
        } catch (error) {
            console.error(`获取学生(ID:${studentId})成绩失败:`, error);
            return null;
        }
    }
    
    // 保存成绩
    async function saveGrade(grade) {
        try {
            const grades = await getGrades();
            const index = grades.findIndex(g => g.studentId === grade.studentId);
            
            if (index !== -1) {
                // 更新现有成绩
                grades[index] = grade;
            } else {
                // 添加新成绩
                grades.push(grade);
            }
            
            localStorage.setItem('grades', JSON.stringify(grades));
            return true;
        } catch (error) {
            console.error('保存成绩失败:', error);
            return false;
        }
    }
    
    // 获取学科列表
    function getSubjects() {
        return SUBJECTS;
    }
    
    // 公开API
    return {
        getExportSettings,
        saveExportSettings,
        updateExportSettings,
        getStudents,
        setStudents,
        getStudentById,
        getComments,
        getCommentByStudentId,
        saveComment,
        getGrades,
        getGradeByStudentId,
        saveGrade,
        getSubjects
    };
})();

// 初始化
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 初始化数据库
        await initDatabase();
        console.log('数据库初始化完成');
    } catch (error) {
        console.error('数据库初始化失败:', error);
        alert('数据库连接失败，系统已切换到本地存储模式!');
    }
});

// 兼容旧版API，防止其他JS文件调用时出错
function getStudentById(studentId) {
    return dataService.getStudentById(studentId);
}

function getCommentByStudentId(studentId) {
    return dataService.getCommentByStudentId(studentId);
}

function getGradeByStudentId(studentId) {
    return dataService.getGradeByStudentId(studentId);
}

function getSubjects() {
    return dataService.getSubjects();
}

// 导出dataService以便其他模块使用
window.dataService = dataService;