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
const dataService = {
    // 用户相关
    getUsers: function() {
        return users;
    },
    addUser: function(user) {
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
        return true;
    },
    validateUser: function(username, password) {
        return users.find(u => u.username === username && u.password === password);
    },
    
    // 学生相关
    getStudents: function() {
        return students;
    },
    getStudentById: function(id) {
        return students.find(s => s.id === id);
    },
    addStudent: function(student) {
        students.push(student);
        localStorage.setItem('students', JSON.stringify(students));
        return true;
    },
    updateStudent: function(student) {
        const index = students.findIndex(s => s.id === student.id);
        if (index !== -1) {
            students[index] = student;
            localStorage.setItem('students', JSON.stringify(students));
            return true;
        }
        return false;
    },
    deleteStudent: function(id) {
        const index = students.findIndex(s => s.id === id);
        if (index !== -1) {
            students.splice(index, 1);
            localStorage.setItem('students', JSON.stringify(students));
            
            // 同时删除该学生的评语和成绩
            this.deleteComment(id);
            this.deleteGrade(id);
            return true;
        }
        return false;
    },
    importStudents: function(newStudents) {
        // 合并学生数据，以学号为唯一标识
        newStudents.forEach(newStudent => {
            const index = students.findIndex(s => s.id === newStudent.id);
            if (index !== -1) {
                students[index] = newStudent; // 更新已存在的学生
            } else {
                students.push(newStudent); // 添加新学生
            }
        });
        localStorage.setItem('students', JSON.stringify(students));
        return true;
    },
    
    // 评语相关
    getComments: function() {
        return comments;
    },
    getCommentByStudentId: function(studentId) {
        return comments.find(c => c.studentId === studentId);
    },
    addComment: function(comment) {
        comments.push(comment);
        localStorage.setItem('comments', JSON.stringify(comments));
        return true;
    },
    updateComment: function(comment) {
        const index = comments.findIndex(c => c.studentId === comment.studentId);
        if (index !== -1) {
            comments[index] = comment;
            localStorage.setItem('comments', JSON.stringify(comments));
            return true;
        } else {
            return this.addComment(comment);
        }
    },
    deleteComment: function(studentId) {
        const index = comments.findIndex(c => c.studentId === studentId);
        if (index !== -1) {
            comments.splice(index, 1);
            localStorage.setItem('comments', JSON.stringify(comments));
            return true;
        }
        return false;
    },
    
    // 学科相关
    getSubjects: function() {
        return subjects;
    },
    addSubject: function(subject) {
        if (!subjects.includes(subject)) {
            subjects.push(subject);
            localStorage.setItem('subjects', JSON.stringify(subjects));
            return true;
        }
        return false;
    },
    removeSubject: function(subject) {
        const index = subjects.indexOf(subject);
        if (index > -1) {
            subjects.splice(index, 1);
            localStorage.setItem('subjects', JSON.stringify(subjects));
            return true;
        }
        return false;
    },
    
    // 成绩相关
    getGrades: function() {
        return grades;
    },
    getGradeByStudentId: function(studentId) {
        return grades.find(g => g.studentId === studentId);
    },
    updateStudentSubjectGrade: function(studentId, subject, value) {
        // 查找学生成绩记录
        let studentGrade = grades.find(g => g.studentId === studentId);
        
        // 如果不存在，创建新记录
        if (!studentGrade) {
            studentGrade = {
                studentId,
                grades: {},
                updateDate: formatDate(new Date())
            };
            grades.push(studentGrade);
        }
        
        // 更新成绩
        studentGrade.grades[subject] = value;
        studentGrade.updateDate = formatDate(new Date());
        
        // 保存到本地存储
        localStorage.setItem('grades', JSON.stringify(grades));
        return true;
    },
    deleteGrade: function(studentId) {
        const index = grades.findIndex(g => g.studentId === studentId);
        if (index !== -1) {
            grades.splice(index, 1);
            localStorage.setItem('grades', JSON.stringify(grades));
            return true;
        }
        return false;
    },
    
    // 导出设置相关
    getExportSettings: function() {
        return exportSettings;
    },
    updateExportSettings: function(settings) {
        // 合并设置
        exportSettings = { ...exportSettings, ...settings };
        localStorage.setItem('exportSettings', JSON.stringify(exportSettings));
        return true;
    }
};