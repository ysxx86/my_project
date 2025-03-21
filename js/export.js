// @charset UTF-8
// 导出报告模块

document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化导出页面');
    // 初始化导出设置
    initExportSettings();
    
    // 注意：不再在这里绑定模板选择事件，因为template-upload.js会处理
    
    // 绑定全选学生复选框事件
    const selectAllStudents = document.getElementById('selectAllStudents');
    if (selectAllStudents) {
        selectAllStudents.addEventListener('change', function() {
            toggleSelectAllStudents(this.checked);
        });
    }
    
    // 绑定排序选项事件
    const sortOptions = document.querySelectorAll('input[name="sortOption"]');
    sortOptions.forEach(option => {
        option.addEventListener('change', function() {
            sortStudentList(this.id === 'sortByName' ? 'name' : 'id');
        });
    });
    
    // 绑定导出设置变更事件
    const exportSettingInputs = document.querySelectorAll('#schoolYear, #semester, #includeBasicInfo, #includeGrades, #includeComments, #includeAttendance, #includeAwards, #schoolName, #className, #teacherName');
    exportSettingInputs.forEach(input => {
        input.addEventListener('change', function() {
            updateExportSettings();
            updatePreview();
        });
    });
    
    // 绑定导出按钮事件
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        // 移除可能存在的旧事件处理程序
        const newExportBtn = exportBtn.cloneNode(true);
        if (exportBtn.parentNode) {
            exportBtn.parentNode.replaceChild(newExportBtn, exportBtn);
        }
        
        // 添加新的事件处理程序
        newExportBtn.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            console.log('触发导出报告');
            exportReports();
        });
    }
    
    // 绑定预览按钮事件
    const previewBtn = document.getElementById('previewBtn');
    if (previewBtn) {
        previewBtn.addEventListener('click', function() {
            showPreview();
        });
    }
    
    // 初始化学生列表
    initStudentList();
    
    // 初始化预览
    updatePreview();
    
    // 初始化模板上传处理
    // 注意：这个函数由template-upload.js实现，此处不需调用
    
    // 监听自定义模板选择事件
    document.addEventListener('template-selected', function(e) {
        if (e.detail && e.detail.templateId) {
            console.log('收到模板选择事件:', e.detail.templateId);
            updatePreview();
        }
    });
});

// 初始化导出设置
function initExportSettings() {
    // 获取本地存储的导出设置或使用默认值
    const settings = dataService.getExportSettings();
    
    // 通过fetch获取服务器上的评语管理配置，以获取当前学期信息
    fetch('/api/settings')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                const serverSettings = data.settings;
                
                // 如果服务器有学期信息，则更新本地设置
                if (serverSettings.schoolYear) {
                    document.getElementById('schoolYear').value = serverSettings.schoolYear;
                    settings.schoolYear = serverSettings.schoolYear;
                }
                
                // 根据服务器返回的学期信息设置下拉框
                if (serverSettings.semester) {
                    let semesterValue = '1';
                    if (serverSettings.semester === '第二学期' || serverSettings.semester === '下学期') {
                        semesterValue = '2';
                    }
                    document.getElementById('semester').value = semesterValue;
                    settings.semester = serverSettings.semester;
                }
                
                // 如果服务器有教师信息，则更新教师姓名
                if (serverSettings.teacherName) {
                    const teacherInput = document.getElementById('teacherName');
                    if (teacherInput) {
                        teacherInput.value = serverSettings.teacherName;
                        settings.teacherName = serverSettings.teacherName;
                    }
                }
                
                // 如果服务器有学校信息，则更新学校名称
                if (serverSettings.schoolName) {
                    settings.schoolName = serverSettings.schoolName;
                }
                
                // 保存更新后的设置
                dataService.saveExportSettings(settings);
                
                // 更新预览
                updatePreview();
            }
        })
        .catch(error => {
            console.error('获取服务器设置失败:', error);
            showNotification('获取学期信息失败，将使用默认设置', 'error');
        });
    
    // 填充表单
    document.getElementById('schoolYear').value = settings.schoolYear;
    document.getElementById('semester').value = settings.semester;
    document.getElementById('includeBasicInfo').checked = settings.includeBasicInfo;
    document.getElementById('includeGrades').checked = settings.includeGrades;
    document.getElementById('includeComments').checked = settings.includeComments;
    document.getElementById('fileNameFormat').value = settings.fileNameFormat;
    
    // 设置学校和班级信息
    if (document.getElementById('schoolName')) {
        document.getElementById('schoolName').value = settings.schoolName;
    }
    if (document.getElementById('className')) {
        document.getElementById('className').value = settings.className;
    }
    
    // 设置教师姓名
    if (document.getElementById('teacherName')) {
        document.getElementById('teacherName').value = settings.teacherName;
    }
    
    // 绑定设置变更事件
    document.getElementById('schoolYear').addEventListener('change', function() {
        settings.schoolYear = this.value;
        dataService.saveExportSettings(settings);
        updatePreview();
    });
    
    document.getElementById('semester').addEventListener('change', function() {
        // 根据选择设置学期文本
        settings.semester = this.value === '1' ? '第一学期' : '第二学期';
        dataService.saveExportSettings(settings);
        updatePreview();
    });
    
    document.getElementById('includeBasicInfo').addEventListener('change', function() {
        settings.includeBasicInfo = this.checked;
        dataService.saveExportSettings(settings);
        updatePreview();
    });
    
    document.getElementById('includeGrades').addEventListener('change', function() {
        settings.includeGrades = this.checked;
        dataService.saveExportSettings(settings);
        updatePreview();
    });
    
    document.getElementById('includeComments').addEventListener('change', function() {
        settings.includeComments = this.checked;
        dataService.saveExportSettings(settings);
        updatePreview();
    });
    
    document.getElementById('fileNameFormat').addEventListener('change', function() {
        settings.fileNameFormat = this.value;
        dataService.saveExportSettings(settings);
    });
    
    if (document.getElementById('teacherName')) {
        document.getElementById('teacherName').addEventListener('input', function() {
            settings.teacherName = this.value;
            dataService.saveExportSettings(settings);
            updatePreview();
        });
    }
    
    // 初始化预览
    updatePreview();
}

// 选择模板
function selectTemplate(templateCard) {
    // 移除其他模板的选中状态
    const templateCards = document.querySelectorAll('.template-card');
    templateCards.forEach(card => {
        card.classList.remove('selected');
    });
    
    // 设置当前模板为选中状态
    templateCard.classList.add('selected');
    
    // 更新导出设置
    const template = templateCard.dataset.template;
    dataService.updateExportSettings({ template });
    
    // 更新预览
    updatePreview();
}

// 初始化学生列表
function initStudentList() {
    const studentListContainer = document.querySelector('.student-list');
    if (!studentListContainer) return;
    
    // 显示加载状态
    studentListContainer.innerHTML = '<div class="text-center p-3">正在加载学生数据...</div>';
    
    // 从服务器获取学生数据
    fetch('/api/students')
        .then(response => {
            if (!response.ok) {
                throw new Error('服务器响应错误: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            // 检查数据结构
            const students = Array.isArray(data) ? data : 
                             (data.students && Array.isArray(data.students)) ? data.students : 
                             (data.status === 'ok' && data.data && Array.isArray(data.data)) ? data.data : null;
            
            if (!students || students.length === 0) {
                studentListContainer.innerHTML = '<div class="text-center p-3">暂无学生数据</div>';
                return;
            }
            
            // 保存学生数据到本地服务
            dataService.setStudents(students);
            
            // 清空容器
            studentListContainer.innerHTML = '';
    
    // 创建学生项
    students.forEach(student => {
                const studentItem = document.createElement('div');
                studentItem.className = 'student-item';
                // 设置数据属性用于排序
                studentItem.dataset.studentId = student.id;
                studentItem.dataset.studentName = student.name;
                
                studentItem.innerHTML = `
                    <input type="checkbox" class="form-check-input student-checkbox" data-id="${student.id}" checked>
            <div class="student-avatar">
                <i class='bx bx-user'></i>
            </div>
            <div>
                <div class="student-name">${student.name}</div>
                <div class="student-id">学号: ${student.id}</div>
            </div>
        `;
                studentListContainer.appendChild(studentItem);
                
                // 绑定复选框事件
                const checkbox = studentItem.querySelector('.student-checkbox');
                checkbox.addEventListener('change', updateSelectAllCheckbox);
            });
            
            // 应用初始排序 - 默认按学号排序
            sortStudentList('id');
            
            // 更新全选复选框状态
            updateSelectAllCheckbox();
        })
        .catch(error => {
            console.error('加载学生列表失败:', error);
            studentListContainer.innerHTML = `<div class="text-center p-3 text-danger">加载失败: ${error.message}</div>`;
            
            // 尝试使用本地缓存的学生数据
            const cachedStudents = dataService.getStudents();
            if (cachedStudents && cachedStudents.length > 0) {
                showNotification('使用本地缓存的学生数据显示', 'info');
                renderStudentList(cachedStudents, studentListContainer);
            }
        });
}

// 渲染学生列表
function renderStudentList(students, container) {
    if (!container) container = document.querySelector('.student-list');
    if (!container) return;
    
    // 清空容器
    container.innerHTML = '';
    
    // 创建学生项
    students.forEach(student => {
        const studentItem = document.createElement('div');
        studentItem.className = 'student-item';
        // 设置数据属性用于排序
        studentItem.dataset.studentId = student.id;
        studentItem.dataset.studentName = student.name;
        
        studentItem.innerHTML = `
            <input type="checkbox" class="form-check-input student-checkbox" data-id="${student.id}" checked>
            <div class="student-avatar">
                <i class='bx bx-user'></i>
            </div>
            <div>
                <div class="student-name">${student.name}</div>
                <div class="student-id">学号: ${student.id}</div>
            </div>
        `;
        container.appendChild(studentItem);
        
        // 绑定复选框事件
        const checkbox = studentItem.querySelector('.student-checkbox');
        checkbox.addEventListener('change', updateSelectAllCheckbox);
    });
    
    // 更新全选复选框状态
    updateSelectAllCheckbox();
}

// 切换全选学生
function toggleSelectAllStudents(checked) {
    const studentCheckboxes = document.querySelectorAll('.student-checkbox');
    studentCheckboxes.forEach(checkbox => {
        checkbox.checked = checked;
    });
}

// 更新全选复选框状态
function updateSelectAllCheckbox() {
    const studentCheckboxes = document.querySelectorAll('.student-checkbox');
    const selectAllCheckbox = document.getElementById('selectAllStudents');
    
    if (!selectAllCheckbox) return;
    
    const checkedCount = Array.from(studentCheckboxes).filter(checkbox => checkbox.checked).length;
    
    if (checkedCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCount === studentCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

// 排序学生列表
function sortStudentList(sortBy) {
    const studentList = document.querySelector('.student-list');
    if (!studentList) return;
    
    // 获取所有学生项
    const studentItems = Array.from(studentList.querySelectorAll('.student-item'));
    
    // 排序学生项
    studentItems.sort((a, b) => {
        if (sortBy === 'name') {
            return a.dataset.studentName.localeCompare(b.dataset.studentName, 'zh-CN');
        } else {
            return parseInt(a.dataset.studentId) - parseInt(b.dataset.studentId);
        }
    });
    
    // 重新添加到列表
    studentItems.forEach(item => {
        studentList.appendChild(item);
    });
}

// 更新导出设置
function updateExportSettings() {
    // 获取设置值
    const settings = {
        schoolYear: document.getElementById('schoolYear') ? document.getElementById('schoolYear').value : '',
        semester: document.getElementById('semester') ? document.getElementById('semester').value : '',
        includeBasicInfo: document.getElementById('includeBasicInfo') ? document.getElementById('includeBasicInfo').checked : true,
        includeGrades: document.getElementById('includeGrades') ? document.getElementById('includeGrades').checked : true,
        includeComments: document.getElementById('includeComments') ? document.getElementById('includeComments').checked : true,
        includeAttendance: document.getElementById('includeAttendance') ? document.getElementById('includeAttendance').checked : false,
        includeAwards: document.getElementById('includeAwards') ? document.getElementById('includeAwards').checked : false,
        schoolName: document.getElementById('schoolName') ? document.getElementById('schoolName').value : '',
        className: document.getElementById('className') ? document.getElementById('className').value : '',
        teacherName: document.getElementById('teacherName') ? document.getElementById('teacherName').value : '',
        exportDate: formatDate(new Date())
    };
    
    // 更新设置
    dataService.updateExportSettings(settings);
}

// 更新预览
function updatePreview() {
    const previewContainer = document.querySelector('.report-preview');
    if (!previewContainer) return;
    
    // 获取导出设置
    const settings = dataService.getExportSettings();
    
    // 获取学生数据、评语数据和成绩数据
    const students = dataService.getStudents();
    if (students.length === 0) {
        previewContainer.innerHTML = '<div class="text-center p-5">暂无学生数据</div>';
        return;
    }
    
    // 使用第一个学生作为预览
    const student = students[0];
    const comment = dataService.getCommentByStudentId(student.id);
    const grade = dataService.getGradeByStudentId(student.id);
    const subjects = dataService.getSubjects();
    
    // 创建预览内容
    let previewHTML = `
        <div class="report-header">
            <div class="report-title">${settings.schoolName}学生综合素质发展报告单</div>
            <div class="report-subtitle">${settings.schoolYear}学年 第${settings.semester}学期</div>
        </div>
        
        <div class="report-info">
            <div><strong>班级：</strong>${settings.className}</div>
            <div><strong>姓名：</strong>${student.name}</div>
            <div><strong>学号：</strong>${student.id}</div>
            <div><strong>日期：</strong>${settings.exportDate}</div>
        </div>
    `;
    
    // 基本信息部分
    if (settings.includeBasicInfo) {
        previewHTML += `
            <div class="report-section">
                <div class="report-section-title">基本信息</div>
                <div class="row">
                    <div class="col-md-6"><strong>性别：</strong>${student.gender}</div>
                    <div class="col-md-6"><strong>出生日期：</strong>${student.birthdate}</div>
                </div>
                <div class="row mt-2">
                    <div class="col-md-6"><strong>家长电话：</strong>${student.parentPhone}</div>
                    <div class="col-md-6"><strong>家庭住址：</strong>${student.address}</div>
                </div>
            </div>
        `;
    }
    
    // 成绩部分
    if (settings.includeGrades) {
        previewHTML += `
            <div class="report-section">
                <div class="report-section-title">学科成绩</div>
                <table class="report-table">
                    <thead>
                        <tr>
                            ${subjects.map(subject => `<th>${subject}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            ${subjects.map(subject => `<td>${grade && grade.grades[subject] ? grade.grades[subject] : '-'}</td>`).join('')}
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // 评语部分
    if (settings.includeComments) {
        previewHTML += `
            <div class="report-section">
                <div class="report-section-title">综合评语</div>
                <p>${comment ? comment.content : '暂无评语'}</p>
            </div>
        `;
    }
    
    // 考勤部分（示例）
    if (settings.includeAttendance) {
        previewHTML += `
            <div class="report-section">
                <div class="report-section-title">考勤情况</div>
                <div class="row">
                    <div class="col-md-4"><strong>应到天数：</strong>90天</div>
                    <div class="col-md-4"><strong>实到天数：</strong>88天</div>
                    <div class="col-md-4"><strong>出勤率：</strong>97.8%</div>
                </div>
                <div class="row mt-2">
                    <div class="col-md-4"><strong>请假：</strong>2天</div>
                    <div class="col-md-4"><strong>迟到：</strong>1次</div>
                    <div class="col-md-4"><strong>早退：</strong>0次</div>
                </div>
            </div>
        `;
    }
    
    // 奖励部分（示例）
    if (settings.includeAwards) {
        previewHTML += `
            <div class="report-section">
                <div class="report-section-title">获奖情况</div>
                <ul>
                    <li>三好学生</li>
                    <li>数学竞赛三等奖</li>
                </ul>
            </div>
        `;
    }
    
    // 签名部分
    previewHTML += `
        <div class="report-section mt-5">
            <div class="row">
                <div class="col-md-6 text-center">
                    <div><strong>班主任签名：</strong>_______________</div>
                </div>
                <div class="col-md-6 text-center">
                    <div><strong>家长签名：</strong>_______________</div>
                </div>
            </div>
        </div>
    `;
    
    // 更新预览容器
    previewContainer.innerHTML = previewHTML;
}

// 显示预览
function showPreview() {
    // 更新预览
    updatePreview();
    
    // 显示预览模态框
    const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
    previewModal.show();
}

// 获取选中的学生
function getSelectedStudents() {
    const selectedIds = [];
    const studentCheckboxes = document.querySelectorAll('.student-checkbox');
    studentCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const studentId = checkbox.dataset.id;
            if (studentId) {
                selectedIds.push(studentId);
            }
        }
    });
    
    return selectedIds; // 直接返回ID列表，而不是学生对象列表
}

// 添加模板文件处理功能
let templateContent = null;
let templateFile = null;

// 初始化时添加模板上传处理
function initTemplateUpload() {
    const templateUpload = document.getElementById('templateUpload');
    if (templateUpload) {
        templateUpload.addEventListener('change', handleTemplateUpload);
    }

    // 处理自定义模板上传按钮点击
    const uploadTemplateBtn = document.getElementById('uploadTemplateBtn');
    if (uploadTemplateBtn) {
        uploadTemplateBtn.addEventListener('click', function() {
            if (templateUpload) {
                templateUpload.click();
            }
        });
    }
}

// 处理模板文件上传
async function handleTemplateUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.name.toLowerCase().endsWith('.docx')) {
        templateFile = file;
        // 显示已上传的模板文件名
        const templateNameElement = document.getElementById('templateName');
        if (templateNameElement) {
            templateNameElement.textContent = file.name;
        }
        
        // 更新自定义模板卡片状态
        const customTemplateCard = document.querySelector('.template-card[data-template="custom"]');
        if (customTemplateCard) {
            customTemplateCard.classList.remove('disabled');
            selectTemplate(customTemplateCard);
        }
        
        showNotification('模板上传成功！', 'success');
    } else {
        showNotification('请上传.docx格式的文件', 'error');
    }
}

// 导出报告
async function exportReports() {
    try {
        // 显示加载状态
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.disabled = true;
            exportBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> 导出中...';
        }
        
        // 安全获取DOM元素值的辅助函数
        const getElementValue = (id, defaultValue = '') => {
            const element = document.getElementById(id);
            return element ? element.value || defaultValue : defaultValue;
        };
        
        // 安全获取复选框状态的辅助函数
        const getCheckboxState = (id, defaultValue = false) => {
            const element = document.getElementById(id);
            return element ? element.checked : defaultValue;
        };
        
        // 获取所选学生ID列表
        const selectedStudentIds = getSelectedStudents();
        console.log('选中的学生IDs:', selectedStudentIds);
        if (selectedStudentIds.length === 0) {
            showNotification('请至少选择一个学生进行导出', 'warning');
            resetExportButton();
            return;
        }
        
        // 获取所选模板
        const template = document.querySelector('.template-card.selected');
        if (!template) {
            showNotification('请选择一个报告模板', 'warning');
            resetExportButton();
            return;
        }
        
        const templateId = template.dataset.templateId;
        console.log('选中的模板ID:', templateId);
        if (!templateId) {
            showNotification('无效的模板', 'error');
            resetExportButton();
            return;
        }
                
        // 收集导出设置
        const settings = {
            schoolYear: getElementValue('schoolYear', '2023-2024'),
            semester: getElementValue('semester', '第二学期'),
            fileNameFormat: getElementValue('fileNameFormat', 'id_name'),
            startDate: getElementValue('startDate', ''),
            schoolName: getElementValue('schoolName', ''),
            className: getElementValue('className', ''),
            teacherName: getElementValue('teacherName', '')
        };
        console.log('导出设置:', settings);
        
        // 准备请求数据 - 确保studentIds是ID字符串列表
        const requestData = {
            studentIds: selectedStudentIds, // 直接使用ID列表
            templateId: templateId,
            settings: settings
        };
        console.log('发送请求数据:', requestData);
        
        // 显示进度模态窗口
        const progressModal = new bootstrap.Modal(document.getElementById('progressModal'));
        progressModal.show();
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
            
            // 更新进度
        updateProgress(10, '正在准备导出...');
        
        try {
            // 发送请求到服务器
            updateProgress(30, '正在生成报告...');
            console.log('正在向服务器发送请求...');
            const response = await fetch('/api/export-reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, application/zip' // 接受JSON或ZIP文件
                },
                body: JSON.stringify(requestData)
            });
            
            // 更新进度
            updateProgress(60, '正在处理响应...');
            console.log('服务器响应状态:', response.status);
            console.log('服务器响应类型:', response.headers.get('Content-Type'));
            
            // 检查响应是否成功
            if (!response.ok) {
                // 尝试读取错误信息
                let errorMessage = '服务器返回错误状态: ' + response.status;
                try {
                    const errorData = await response.text();
                    errorMessage = errorData || errorMessage;
                } catch (e) {
                    console.error('读取错误响应失败:', e);
                }
                
                throw new Error(errorMessage);
            }
            
            // 检查是否是直接文件下载
            const contentType = response.headers.get('Content-Type');
            if (contentType && contentType.includes('application/zip')) {
                console.log('检测到ZIP文件响应，直接下载');
                updateProgress(80, '准备下载文件...');
                
                // 下载文件
                const blob = await response.blob();
                updateProgress(90, '正在下载文件...');
                const url = window.URL.createObjectURL(blob);
                let filename = 'student_reports.zip';
                
                // 尝试从Content-Disposition获取文件名
                const contentDisposition = response.headers.get('Content-Disposition');
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename=([^;]+)/);
                    if (filenameMatch && filenameMatch[1]) {
                        filename = filenameMatch[1].replace(/["']/g, '');
                    }
                }
                
                // 创建下载链接
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                
                // 等待一秒后释放URL对象
                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                    a.remove();
                }, 1000);
                
                updateProgress(100, '导出完成!');
                
                // 延迟一秒后关闭进度条，让用户看到100%完成状态
                setTimeout(() => {
                    if (progressModal) {
                        progressModal.hide();
                    }
                    showNotification('报告导出成功', 'success');
                }, 1000);
                
                resetExportButton();
                return;
            }
            
            // 如果不是文件下载，尝试解析JSON响应
            try {
                updateProgress(80, '处理服务器响应...');
                
                // 先检查响应内容是否为空
                const clonedResponse = response.clone(); // 克隆响应以便多次读取
                const responseText = await clonedResponse.text();
                
                // 如果响应为空但响应状态码是200，可能是成功的二进制文件下载
                if ((!responseText || responseText.trim() === '') && response.ok) {
                    console.log('服务器返回了空响应但状态码为200，可能是文件已经成功下载');
                    updateProgress(100, '导出完成!');
                    
                    // 延迟关闭进度条
                    setTimeout(() => {
                        if (progressModal) {
                            progressModal.hide();
                        }
                        showNotification('报告导出成功', 'success');
                    }, 1000);
                    
                    resetExportButton();
                    return;
                } else if (!responseText || responseText.trim() === '') {
                    // 真正的空响应错误
                    throw new Error('服务器返回了空响应');
                }
                
                // 尝试解析JSON
                let result;
                try {
                    result = JSON.parse(responseText);
                } catch (jsonError) {
                    // 如果无法解析为JSON但响应状态码是200，可能是文件已经成功下载
                    if (response.ok) {
                        console.log('JSON解析错误，但状态码为200，可能是文件已经成功下载');
                        updateProgress(100, '导出完成!');
                        
                        setTimeout(() => {
                            if (progressModal) {
                                progressModal.hide();
                            }
                            showNotification('报告导出成功', 'success');
                        }, 1000);
                        
                        resetExportButton();
                        return;
                    }
                    
                    console.error('JSON解析错误:', jsonError, '响应内容:', responseText);
                    throw new Error('解析服务器响应失败: ' + jsonError.message);
                }
                
                console.log('服务器JSON响应:', result);
                
                if (result.status === 'error') {
                    throw new Error(result.message || '导出报告失败');
                }
                
                if (result.status === 'ok' && result.filename) {
                    // 从服务器下载生成的文件
                    updateProgress(90, '正在下载文件...');
                    console.log('正在下载文件:', result.filename);
                    const downloadUrl = `/download/exports/${result.filename}`;
                    
                    // 创建下载链接并触发下载
                    const a = document.createElement('a');
                    a.href = downloadUrl;
                    a.download = result.filename; 
                    a.target = '_blank'; // 在新标签页中打开
                    document.body.appendChild(a);
                    a.click();
                    
                    // 等待一段时间后再移除元素
                    setTimeout(() => {
                        a.remove();
                    }, 1000);
                    
                    updateProgress(100, '导出完成!');
                    
                    // 延迟一秒后关闭进度条，让用户看到100%完成状态
                    setTimeout(() => {
                        if (progressModal) {
                            progressModal.hide();
                        }
                        showNotification(result.message || '报告导出成功', 'success');
                    }, 1000);
                } else {
                    throw new Error('服务器未返回有效的下载信息');
                }
            } catch (jsonError) {
                console.error('处理JSON响应时出错:', jsonError);
                updateProgress(100, '导出失败: ' + jsonError.message, 'error');
                
                // 延迟一秒后关闭进度条，让用户看到错误状态
                setTimeout(() => {
                    if (progressModal) {
                        progressModal.hide();
                    }
                }, 1500);
                
                throw new Error('导出处理失败: ' + jsonError.message);
            }
        } catch (fetchError) {
            console.error('请求或处理响应时出错:', fetchError);
            updateProgress(100, '导出失败: ' + fetchError.message, 'error');
                
            // 延迟一秒后关闭进度条，让用户看到错误状态
            setTimeout(() => {
                if (progressModal) {
                    progressModal.hide();
                }
            }, 1500);
            
            throw new Error('导出报告失败: ' + fetchError.message);
        }
        
        resetExportButton();
    } catch (error) {
        console.error('导出报告过程中出错:', error);
        showNotification(`导出报告失败: ${error.message || '未知错误'}`, 'error');
        resetExportButton();
    }
}

// 更新进度条和文本
function updateProgress(percent, message, type = 'normal') {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
        progressBar.setAttribute('aria-valuenow', percent);
        
        // 根据类型设置进度条颜色
        progressBar.className = 'progress-bar';
        if (type === 'error') {
            progressBar.classList.add('bg-danger');
        } else if (percent === 100) {
            progressBar.classList.add('bg-success');
        } else {
            progressBar.classList.add('bg-primary', 'progress-bar-striped', 'progress-bar-animated');
        }
    }
    
    if (progressText) {
        progressText.innerHTML = `${message} <span class="badge bg-secondary">${percent}%</span>`;
    }
}

// 重置导出按钮
function resetExportButton() {
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.innerHTML = '<i class="bx bx-export"></i> 开始导出';
    }
}

// 从自定义模板生成文档
async function generateFromTemplate(templateFile, student, comment, grade, subjects, settings) {
    try {
        // 确保PizZip和Docxtemplater已加载
        await loadDocxTemplaterLibraries();
        
        // 读取模板文件
        const reader = new FileReader();
        const fileContent = await new Promise((resolve, reject) => {
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsArrayBuffer(templateFile);
        });
        
        console.log('模板文件读取成功，大小:', fileContent.byteLength, '字节');
        
        // 准备数据
        const data = prepareTemplateData(student, comment, grade, subjects, settings);
        console.log('已准备模板数据:', Object.keys(data).length, '个字段');
        
        // 使用PizZip加载文档
        const zip = new PizZip(fileContent);
        
        // 创建Docxtemplater实例
        const doc = new Docxtemplater();
        doc.loadZip(zip);
        
        // 设置数据
        doc.setData(data);
        
        // 渲染文档
        doc.render();
        console.log('文档渲染完成');
        
        // 获取生成的文档
        const out = doc.getZip().generate({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        
        return out;
    } catch (error) {
        console.error('从模板生成文档时出错:', error);
        throw error;
    }
}

// 动态加载PizZip和Docxtemplater库
async function loadDocxTemplaterLibraries() {
    try {
        // 首先尝试使用页面中已加载的库
        if (window.PizZip && window.Docxtemplater) {
            console.log('文档模板库已加载，直接使用');
            return; // 如果已加载，直接返回
        }
        
        console.log('开始加载文档模板库...');
        
        // 加载PizZip库（优先使用CDN）
        if (!window.PizZip) {
            console.log('加载PizZip库...');
            await new Promise((resolve, reject) => {
                const pizzipScript = document.createElement('script');
                // 直接使用CDN
                pizzipScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pizzip/3.1.4/pizzip.min.js';
                pizzipScript.onload = () => {
                    console.log('PizZip库加载成功');
                    resolve();
                };
                pizzipScript.onerror = (err) => {
                    console.error('从CDN加载PizZip库失败', err);
                    reject(new Error('无法加载PizZip库'));
                };
                document.head.appendChild(pizzipScript);
            });
        }
        
        // 加载Docxtemplater库（优先使用CDN）
        if (!window.Docxtemplater) {
            console.log('加载Docxtemplater库...');
            await new Promise((resolve, reject) => {
                const docxtemplaterScript = document.createElement('script');
                // 直接使用CDN
                docxtemplaterScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/docxtemplater/3.37.11/docxtemplater.js';
                docxtemplaterScript.onload = () => {
                    console.log('Docxtemplater库加载成功');
                    resolve();
                };
                docxtemplaterScript.onerror = (err) => {
                    console.error('从CDN加载Docxtemplater库失败', err);
                    reject(new Error('无法加载Docxtemplater库'));
                };
                document.head.appendChild(docxtemplaterScript);
            });
        }
        
        console.log('文档模板库加载完成');
        
        // 确认库已成功加载
        if (!window.PizZip || !window.Docxtemplater) {
            throw new Error('库加载后仍无法访问，可能出现异常');
        }
    } catch (error) {
        console.error('加载文档模板库时出错:', error);
        showNotification('加载文档模板处理库失败，请稍后重试', 'error');
        throw new Error('无法加载文档模板处理库: ' + error.message);
    }
}

// 修改prepareTemplateData函数，确保不再处理这些字段
function prepareTemplateData(student, comment, grade, subjects, settings) {
    // 获取学期文本
    const semesterText = settings.semester === '1' ? '第一学期' : '第二学期';
    
    // 准备基本数据 - 只包含students表中实际存在的字段
    const data = {
        "【姓名】": student.name || '',
        "【性别】": student.gender || '',
        "【班级】": student.class || settings.className || '',
        "【身高】": student.height || '',
        "【体重】": student.weight || '',
        "【肺活量】": student.vitalCapacity || '',
        "【视力左】": student.visionLeft || '',
        "【视力右】": student.visionRight || '',
        "【体测情况】": student.physicalTestStatus || '',
        "【胸围】": student.chestCircumference || '',
        "【龋齿】": student.dentalCaries || '',
        
        // 评语
        "【评语】": comment && comment.content ? comment.content : '',
        
        // 学期信息
        "【学年】": settings.schoolYear || '',
        "【学期】": semesterText || '',
        "【开学时间】": settings.startDate || ''
    };
    
    // 添加成绩数据
    if (grade) {
        subjects.forEach(subject => {
            const zhSubject = SUBJECT_MAPPING[subject] || subject;
            data[`【${zhSubject}】`] = grade[subject] || '';
        });
    }
    
    return data;
}

// 使用docx.js库生成默认文档
async function generateDefaultDocument(student, comment, grade, subjects, settings) {
    // 获取docx组件
    const docx = await window.docxModule.getDocxComponents();
            
            // 创建文档
            const doc = new docx.Document({
                sections: [{
                    properties: {},
                    children: [
                        new docx.Paragraph({
                            text: `${settings.schoolName}学生综合素质发展报告单`,
                            heading: docx.HeadingLevel.HEADING_1,
                            alignment: docx.AlignmentType.CENTER,
                        }),
                        new docx.Paragraph({
                            text: `${settings.schoolYear}学年 第${settings.semester}学期`,
                            alignment: docx.AlignmentType.CENTER,
                        }),
                        new docx.Paragraph({
                            text: "",
                        }),
                        new docx.Table({
                            width: {
                                size: 100,
                                type: docx.WidthType.PERCENTAGE,
                            },
                            rows: [
                                new docx.TableRow({
                                    children: [
                                        new docx.TableCell({
                                            children: [new docx.Paragraph("班级")],
                                            width: {
                                                size: 15,
                                                type: docx.WidthType.PERCENTAGE,
                                            },
                                        }),
                                        new docx.TableCell({
                                            children: [new docx.Paragraph(settings.className)],
                                            width: {
                                                size: 35,
                                                type: docx.WidthType.PERCENTAGE,
                                            },
                                        }),
                                        new docx.TableCell({
                                            children: [new docx.Paragraph("姓名")],
                                            width: {
                                                size: 15,
                                                type: docx.WidthType.PERCENTAGE,
                                            },
                                        }),
                                        new docx.TableCell({
                                            children: [new docx.Paragraph(student.name)],
                                            width: {
                                                size: 35,
                                                type: docx.WidthType.PERCENTAGE,
                                            },
                                        }),
                                    ],
                                }),
                                new docx.TableRow({
                                    children: [
                                        new docx.TableCell({
                                            children: [new docx.Paragraph("学号")],
                                        }),
                                        new docx.TableCell({
                                            children: [new docx.Paragraph(student.id)],
                                        }),
                                        new docx.TableCell({
                                            children: [new docx.Paragraph("日期")],
                                        }),
                                        new docx.TableCell({
                                            children: [new docx.Paragraph(settings.exportDate)],
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new docx.Paragraph({
                            text: "",
                        }),
                    ]
                }]
            });
            
            // 添加基本信息部分
            if (settings.includeBasicInfo) {
                doc.addSection({
                    children: [
                        new docx.Paragraph({
                            text: "基本信息",
                            heading: docx.HeadingLevel.HEADING_2,
                        }),
                        new docx.Table({
                            width: {
                                size: 100,
                                type: docx.WidthType.PERCENTAGE,
                            },
                            rows: [
                                new docx.TableRow({
                                    children: [
                                        new docx.TableCell({
                                            children: [new docx.Paragraph("性别")],
                                            width: {
                                                size: 15,
                                                type: docx.WidthType.PERCENTAGE,
                                            },
                                        }),
                                        new docx.TableCell({
                                            children: [new docx.Paragraph(student.gender)],
                                            width: {
                                                size: 35,
                                                type: docx.WidthType.PERCENTAGE,
                                            },
                                        }),
                                        new docx.TableCell({
                                            children: [new docx.Paragraph("出生日期")],
                                            width: {
                                                size: 15,
                                                type: docx.WidthType.PERCENTAGE,
                                            },
                                        }),
                                        new docx.TableCell({
                                            children: [new docx.Paragraph(student.birthdate)],
                                            width: {
                                                size: 35,
                                                type: docx.WidthType.PERCENTAGE,
                                            },
                                        }),
                                    ],
                                }),
                                new docx.TableRow({
                                    children: [
                                        new docx.TableCell({
                                            children: [new docx.Paragraph("家长电话")],
                                        }),
                                        new docx.TableCell({
                                            children: [new docx.Paragraph(student.parentPhone)],
                                        }),
                                        new docx.TableCell({
                                            children: [new docx.Paragraph("家庭住址")],
                                        }),
                                        new docx.TableCell({
                                            children: [new docx.Paragraph(student.address)],
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new docx.Paragraph({
                            text: "",
                        }),
                    ]
                });
            }
            
    // 添加评语部分
    if (settings.includeComment && comment) {
        doc.addSection({
            children: [
                new docx.Paragraph({
                    text: "评语",
                    heading: docx.HeadingLevel.HEADING_2,
                }),
                new docx.Paragraph({
                    text: comment.content || "暂无评语",
                }),
                new docx.Paragraph({
                    text: "",
                }),
            ]
        });
    }

    // 添加成绩部分
    if (settings.includeGrades && grade && subjects && subjects.length > 0) {
        const tableRows = [
            new docx.TableRow({
                children: [
                    new docx.TableCell({
                        children: [new docx.Paragraph("科目")],
                        width: {
                            size: 25,
                            type: docx.WidthType.PERCENTAGE,
                        },
                    }),
                    new docx.TableCell({
                        children: [new docx.Paragraph("分数")],
                        width: {
                            size: 25,
                            type: docx.WidthType.PERCENTAGE,
                        },
                    }),
                    new docx.TableCell({
                        children: [new docx.Paragraph("科目")],
                        width: {
                            size: 25,
                            type: docx.WidthType.PERCENTAGE,
                        },
                    }),
                    new docx.TableCell({
                        children: [new docx.Paragraph("分数")],
                        width: {
                            size: 25,
                            type: docx.WidthType.PERCENTAGE,
                        },
                    }),
                ],
            })
        ];

        // 将科目分成两两一组，每行显示两个科目的成绩
        for (let i = 0; i < subjects.length; i += 2) {
            const rowCells = [];
            
            // 添加第一个科目
            const subject1 = subjects[i];
            rowCells.push(
                new docx.TableCell({
                    children: [new docx.Paragraph(subject1.name)],
                }),
                new docx.TableCell({
                    children: [new docx.Paragraph(grade[subject1.id]?.score?.toString() || "-")],
                })
            );
            
            // 如果有第二个科目，也添加
            if (i + 1 < subjects.length) {
                const subject2 = subjects[i + 1];
                rowCells.push(
                    new docx.TableCell({
                        children: [new docx.Paragraph(subject2.name)],
                    }),
                    new docx.TableCell({
                        children: [new docx.Paragraph(grade[subject2.id]?.score?.toString() || "-")],
                    })
                );
            } else {
                // 如果没有第二个科目，添加空单元格
                rowCells.push(
                    new docx.TableCell({
                        children: [new docx.Paragraph("")],
                    }),
                    new docx.TableCell({
                        children: [new docx.Paragraph("")],
                    })
                );
            }
            
            tableRows.push(new docx.TableRow({ children: rowCells }));
        }
        
        // 添加总分、平均分、排名行
        tableRows.push(
            new docx.TableRow({
                children: [
                    new docx.TableCell({
                        children: [new docx.Paragraph("总分")],
                    }),
                    new docx.TableCell({
                        children: [new docx.Paragraph(grade.total?.toString() || "-")],
                    }),
                    new docx.TableCell({
                        children: [new docx.Paragraph("平均分")],
                    }),
                    new docx.TableCell({
                        children: [new docx.Paragraph(grade.average?.toString() || "-")],
                    }),
                ],
            }),
            new docx.TableRow({
                children: [
                    new docx.TableCell({
                        children: [new docx.Paragraph("班级排名")],
                    }),
                    new docx.TableCell({
                        children: [new docx.Paragraph(grade.rank?.toString() || "-")],
                    }),
                    new docx.TableCell({
                        children: [new docx.Paragraph("")],
                    }),
                    new docx.TableCell({
                        children: [new docx.Paragraph("")],
                    }),
                ],
            })
        );

        doc.addSection({
            children: [
                new docx.Paragraph({
                    text: "成绩",
                    heading: docx.HeadingLevel.HEADING_2,
                }),
                new docx.Table({
                    width: {
                        size: 100,
                        type: docx.WidthType.PERCENTAGE,
                    },
                    rows: tableRows
                }),
                new docx.Paragraph({
                    text: "",
                }),
            ]
        });
    }

    // 添加教师信息部分
    doc.addSection({
        children: [
            new docx.Paragraph({
                text: "",
            }),
            new docx.Paragraph({
                text: "",
            }),
            new docx.Paragraph({
                text: `班主任：${settings.teacherName}`,
                alignment: docx.AlignmentType.RIGHT,
            }),
            new docx.Paragraph({
                text: formatDate(new Date()),
                alignment: docx.AlignmentType.RIGHT,
            }),
        ]
    });
    
    // 导出文档
    return await docx.Packer.toBlob(doc);
}

// 显示通知提示
function showNotification(message, type = 'success') {
    const toast = document.getElementById('notificationToast');
    if (!toast) return;
    
    const toastBody = toast.querySelector('.toast-body');
    toastBody.textContent = message;
    
    // 设置通知类型
    toast.classList.remove('bg-success', 'bg-danger', 'bg-info', 'text-white');
    const icon = toast.querySelector('.toast-header i');
    icon.classList.remove('bx-info-circle', 'bx-check-circle', 'bx-error-circle');
    
    switch(type) {
        case 'error':
            toast.classList.add('bg-danger', 'text-white');
            icon.classList.add('bx-error-circle');
            break;
        case 'info':
            toast.classList.add('bg-info', 'text-white');
            icon.classList.add('bx-info-circle');
            break;
        default:
            toast.classList.add('bg-success', 'text-white');
            icon.classList.add('bx-check-circle');
    }
    
    // 显示通知
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// 格式化日期
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}