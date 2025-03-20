// @charset UTF-8
// 数据存储模块

// 用户数据
let users = localStorage.getItem('users') ? JSON.parse(localStorage.getItem('users')) : [
    { username: 'admin', password: 'admin123', teacherName: '管理员', teacherClass: '六年级一班' }
];

// 学生数据
let students = localStorage.getItem('students') ? JSON.parse(localStorage.getItem('students')) : [
    { 
        id: '20230001', 
        name: '张三', 
        gender: '男', 
        class: '六年级一班',
        height: '165',
        weight: '52',
        chestCircumference: '80',
        vitalCapacity: '2800',
        dentalCaries: '无',
        visionLeft: '5.0',
        visionRight: '5.0',
        physicalTestStatus: '优秀'
    },
    { 
        id: '20230002', 
        name: '李四', 
        gender: '女', 
        class: '六年级一班',
        height: '160',
        weight: '48',
        chestCircumference: '78',
        vitalCapacity: '2600',
        dentalCaries: '无',
        visionLeft: '4.9',
        visionRight: '5.0',
        physicalTestStatus: '良好'
    },
    { 
        id: '20230003', 
        name: '王五', 
        gender: '男', 
        class: '六年级一班',
        height: '168',
        weight: '55',
        chestCircumference: '82',
        vitalCapacity: '2900',
        dentalCaries: '有',
        visionLeft: '4.6',
        visionRight: '4.7',
        physicalTestStatus: '良好'
    }
];

// 评语数据
let comments = localStorage.getItem('comments') ? JSON.parse(localStorage.getItem('comments')) : [
    {
        studentId: '20230001',
        content: '该生尊敬师长，团结同学，乐于助人，诚实守信。学习态度端正，能按时完成作业。积极参加体育锻炼，身体素质良好。',
        updateDate: '2023-06-15'
    },
    {
        studentId: '20230002',
        content: '该生热爱学习，明确学习目的，上课认真，按时完成作业。掌握学习方法，积极思考，养成良好的学习习惯。热爱集体，主动与同作合作，交流，分享。',
        updateDate: '2023-06-15'
    },
    {
        studentId: '20230003',
        content: '该生性格内向，但学习刻苦，特别是数学学科表现优异。希望能够多参与集体活动，增强社交能力。',
        updateDate: '2023-06-15'
    }
];

// 学科列表
let subjects = localStorage.getItem('subjects') ? JSON.parse(localStorage.getItem('subjects')) : [
    'daof', 'yuwen', 'shuxue', 'yingyu', 'laodong', 'tiyu', 'yinyue', 'meishu', 'kexue', 'zonghe', 'xinxi', 'shufa'
];

// 成绩数据
let grades = localStorage.getItem('grades') ? JSON.parse(localStorage.getItem('grades')) : [
    {
        studentId: '20230001',
        grades: {
            'daof': 'A',
            'yuwen': 'A',
            'shuxue': 'A',
            'yingyu': 'B',
            'laodong': 'A',
            'tiyu': 'A',
            'yinyue': 'B',
            'meishu': 'B',
            'kexue': 'A',
            'zonghe': 'A',
            'xinxi': 'A',
            'shufa': 'B'
        },
        updateDate: '2023-06-20'
    },
    {
        studentId: '20230002',
        grades: {
            'daof': 'A',
            'yuwen': 'A',
            'shuxue': 'B',
            'yingyu': 'A',
            'laodong': 'A',
            'tiyu': 'B',
            'yinyue': 'A',
            'meishu': 'A',
            'kexue': 'B',
            'zonghe': 'A',
            'xinxi': 'B',
            'shufa': 'A'
        },
        updateDate: '2023-06-20'
    },
    {
        studentId: '20230003',
        grades: {
            'daof': 'B',
            'yuwen': 'B',
            'shuxue': 'A',
            'yingyu': 'C',
            'laodong': 'B',
            'tiyu': 'C',
            'yinyue': 'B',
            'meishu': 'B',
            'kexue': 'A',
            'zonghe': 'B',
            'xinxi': 'A',
            'shufa': 'C'
        },
        updateDate: '2023-06-20'
    }
];

// 导出设置
let exportSettings = localStorage.getItem('exportSettings') ? JSON.parse(localStorage.getItem('exportSettings')) : {
    template: 'template1',
    schoolYear: '2023-2024',
    semester: '1',
    includeBasicInfo: true,
    includeGrades: true,
    includeComments: true,
    includeAttendance: false,
    includeAwards: false,
    schoolName: '泉州东海湾实验学校',
    className: '六年级一班',
    teacherName: '李老师',
    exportDate: formatDate(new Date())
};

// 日期格式化函数
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 数据操作函数
const dataService = (function() {
    // 默认导出设置
    const DEFAULT_EXPORT_SETTINGS = {
        schoolYear: '2024-2025',
        semester: '第二学期',
        includeBasicInfo: true,
        includeGrades: true,
        includeComments: true,
        fileNameFormat: 'id_name',
        schoolName: '示范小学',
        className: '三年级二班',
        teacherName: '张老师',
        exportDate: formatDate(new Date())
    };
    
    // 本地存储键名
    const STORAGE_KEYS = {
        EXPORT_SETTINGS: 'export_settings',
        STUDENTS: 'students',
        COMMENTS: 'comments',
        GRADES: 'grades',
        SUBJECTS: 'subjects'
    };
    
    // 获取导出设置
    function getExportSettings() {
        try {
            const settingsJson = localStorage.getItem(STORAGE_KEYS.EXPORT_SETTINGS);
            if (settingsJson) {
                const settings = JSON.parse(settingsJson);
                return { ...DEFAULT_EXPORT_SETTINGS, ...settings };
            }
        } catch (error) {
            console.error('获取导出设置失败:', error);
        }
        return { ...DEFAULT_EXPORT_SETTINGS };
    }
    
    // 保存导出设置
    function saveExportSettings(settings) {
        try {
            const mergedSettings = { ...DEFAULT_EXPORT_SETTINGS, ...settings };
            localStorage.setItem(STORAGE_KEYS.EXPORT_SETTINGS, JSON.stringify(mergedSettings));
            return true;
        } catch (error) {
            console.error('保存导出设置失败:', error);
            return false;
        }
    }
    
    // 更新导出设置
    function updateExportSettings(newSettings) {
        const currentSettings = getExportSettings();
        const mergedSettings = { ...currentSettings, ...newSettings };
        return saveExportSettings(mergedSettings);
    }
    
    // 获取学生数据
    function getStudents() {
        try {
            const studentsJson = localStorage.getItem(STORAGE_KEYS.STUDENTS);
            if (studentsJson) {
                return JSON.parse(studentsJson);
            }
        } catch (error) {
            console.error('获取学生数据失败:', error);
        }
        return [];
    }
    
    // 设置学生数据
    function setStudents(students) {
        try {
            localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
            return true;
        } catch (error) {
            console.error('保存学生数据失败:', error);
            return false;
        }
    }
    
    // 获取单个学生信息
    function getStudentById(studentId) {
        const students = getStudents();
        return students.find(student => student.id === studentId) || null;
    }
    
    // 获取评语数据
    function getComments() {
        try {
            const commentsJson = localStorage.getItem(STORAGE_KEYS.COMMENTS);
            if (commentsJson) {
                return JSON.parse(commentsJson);
            }
        } catch (error) {
            console.error('获取评语数据失败:', error);
        }
        return [];
    }
    
    // 根据学生ID获取评语
    function getCommentByStudentId(studentId) {
        const comments = getComments();
        return comments.find(comment => comment.studentId === studentId) || null;
    }
    
    // 获取成绩数据
    function getGrades() {
        try {
            const gradesJson = localStorage.getItem(STORAGE_KEYS.GRADES);
            if (gradesJson) {
                return JSON.parse(gradesJson);
            }
        } catch (error) {
            console.error('获取成绩数据失败:', error);
        }
        return [];
    }
    
    // 根据学生ID获取成绩
    function getGradeByStudentId(studentId) {
        const grades = getGrades();
        return grades.find(grade => grade.studentId === studentId) || null;
    }
    
    // 获取科目列表
    function getSubjects() {
        try {
            const subjectsJson = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
            if (subjectsJson) {
                return JSON.parse(subjectsJson);
            }
        } catch (error) {
            console.error('获取科目列表失败:', error);
        }
        return [
            { id: 'yuwen', name: '语文' },
            { id: 'shuxue', name: '数学' },
            { id: 'yingyu', name: '英语' },
            { id: 'daof', name: '道法' },
            { id: 'kexue', name: '科学' },
            { id: 'tiyu', name: '体育' },
            { id: 'yinyue', name: '音乐' },
            { id: 'meishu', name: '美术' },
            { id: 'laodong', name: '劳动' },
            { id: 'xinxi', name: '信息' },
            { id: 'zonghe', name: '综合' },
            { id: 'shufa', name: '书法' }
        ];
    }
    
    // 从服务器获取数据
    async function fetchFromServer(endpoint) {
        try {
            const response = await fetch(`/api/${endpoint}`);
            if (!response.ok) {
                console.warn(`服务器返回错误: ${response.status}，未能获取${endpoint}数据`);
                return { status: 'error', message: `服务器返回错误: ${response.status}` };
            }
            return await response.json();
        } catch (error) {
            console.error(`从服务器获取${endpoint}失败:`, error);
            return { status: 'error', message: error.message };
        }
    }
    
    // 从服务器同步数据
    async function syncDataFromServer() {
        try {
            // 获取学生数据
            const studentsData = await fetchFromServer('students');
            if (studentsData && (studentsData.status === 'ok')) {
                const students = Array.isArray(studentsData.data) ? studentsData.data : 
                                 (Array.isArray(studentsData.students) ? studentsData.students : []);
                if (students.length > 0) {
                    setStudents(students);
                    
                    // 直接从学生数据中提取评语
                    const comments = students
                        .filter(student => student.comments)
                        .map(student => ({
                            studentId: student.id,
                            studentName: student.name,
                            content: student.comments || ''
                        }));
                    
                    if (comments.length > 0) {
                        localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
                        console.log('已从学生数据中提取评语，共', comments.length, '条');
                    }
                }
            }
            
            // 获取成绩数据 - 修改为以静默方式处理错误
            try {
                const gradesData = await fetchFromServer('grades');
                if (gradesData && (gradesData.status === 'ok')) {
                    const grades = Array.isArray(gradesData.data) ? gradesData.data : 
                                   (Array.isArray(gradesData.grades) ? gradesData.grades : []);
                    if (grades.length > 0) {
                        localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
                    }
                }
            } catch (gradeError) {
                console.warn('获取成绩数据失败，将使用本地数据:', gradeError);
            }
            
            return true;
        } catch (error) {
            console.warn('同步服务器数据失败，将使用本地数据:', error);
            return false;
        }
    }
    
    // 尝试立即同步数据
    syncDataFromServer().catch(error => {
        console.warn('初始化数据同步失败，将使用本地数据:', error);
    });
    
    // 暴露公共接口
    return {
        getExportSettings,
        saveExportSettings,
        updateExportSettings,
        getStudents,
        setStudents,
        getStudentById,
        getComments,
        getCommentByStudentId,
        getGrades,
        getGradeByStudentId,
        getSubjects,
        syncDataFromServer
    };
})();