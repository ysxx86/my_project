// @charset UTF-8
// 导出报告模块

document.addEventListener('DOMContentLoaded', function() {
    // 初始化导出设置
    initExportSettings();
    
    // 绑定模板选择事件
    const templateCards = document.querySelectorAll('.template-card');
    templateCards.forEach(card => {
        card.addEventListener('click', function() {
            selectTemplate(this);
        });
    });
    
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
        exportBtn.addEventListener('click', function() {
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
});

// 初始化导出设置
function initExportSettings() {
    // 获取导出设置
    const settings = dataService.getExportSettings();
    
    // 设置模板
    const templateCards = document.querySelectorAll('.template-card');
    templateCards.forEach(card => {
        if (card.dataset.template === settings.template) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    
    // 设置学期信息
    if (document.getElementById('schoolYear')) {
        document.getElementById('schoolYear').value = settings.schoolYear;
    }
    if (document.getElementById('semester')) {
        document.getElementById('semester').value = settings.semester;
    }
    
    // 设置包含内容
    if (document.getElementById('includeBasicInfo')) {
        document.getElementById('includeBasicInfo').checked = settings.includeBasicInfo;
    }
    if (document.getElementById('includeGrades')) {
        document.getElementById('includeGrades').checked = settings.includeGrades;
    }
    if (document.getElementById('includeComments')) {
        document.getElementById('includeComments').checked = settings.includeComments;
    }
    if (document.getElementById('includeAttendance')) {
        document.getElementById('includeAttendance').checked = settings.includeAttendance;
    }
    if (document.getElementById('includeAwards')) {
        document.getElementById('includeAwards').checked = settings.includeAwards;
    }
    
    // 设置学校和班级信息
    if (document.getElementById('schoolName')) {
        document.getElementById('schoolName').value = settings.schoolName;
    }
    if (document.getElementById('className')) {
        document.getElementById('className').value = settings.className;
    }
    if (document.getElementById('teacherName')) {
        document.getElementById('teacherName').value = settings.teacherName;
    }
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
    const studentList = document.querySelector('.student-list');
    if (!studentList) return;
    
    // 获取学生数据
    const students = dataService.getStudents();
    
    // 清空现有内容
    studentList.innerHTML = '';
    
    // 创建学生项
    students.forEach(student => {
        const item = document.createElement('div');
        item.className = 'student-item';
        item.dataset.studentId = student.id;
        item.dataset.studentName = student.name;
        
        item.innerHTML = `
            <input type="checkbox" class="form-check-input student-checkbox" checked>
            <div class="student-avatar">
                <i class='bx bx-user'></i>
            </div>
            <div>
                <div class="student-name">${student.name}</div>
                <div class="student-id">学号: ${student.id}</div>
            </div>
        `;
        
        studentList.appendChild(item);
    });
    
    // 绑定学生复选框事件
    const studentCheckboxes = document.querySelectorAll('.student-checkbox');
    studentCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateSelectAllCheckbox();
        });
    });
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
            const studentItem = checkbox.closest('.student-item');
            if (studentItem && studentItem.dataset.studentId) {
                selectedIds.push(studentItem.dataset.studentId);
            }
        }
    });
    
    // 获取学生数据
    return dataService.getStudents().filter(student => selectedIds.includes(student.id));
}

// 导出报告
async function exportReports() {
    try {
        // 获取选中的学生
        const selectedStudents = getSelectedStudents();
        if (selectedStudents.length === 0) {
            showNotification('请至少选择一名学生', 'error');
            return;
        }
        
        // 获取导出设置
        const settings = dataService.getExportSettings();
        
        // 获取文件名格式
        const fileNameFormat = document.querySelector('input[name="fileNameFormat"]:checked').value;
        
        // 显示导出进度模态框
        const exportProgressModal = new bootstrap.Modal(document.getElementById('exportProgressModal'));
        document.getElementById('totalCount').textContent = selectedStudents.length;
        document.getElementById('currentCount').textContent = '0';
        document.getElementById('progressBar').style.width = '0%';
        exportProgressModal.show();
        
        // 获取docx组件
        const docx = await window.docxModule.getDocxComponents();
        
        // 逐个导出学生报告
        for (let i = 0; i < selectedStudents.length; i++) {
            const student = selectedStudents[i];
            const comment = dataService.getCommentByStudentId(student.id);
            const grade = dataService.getGradeByStudentId(student.id);
            const subjects = dataService.getSubjects();
            
            // 更新进度
            document.getElementById('currentCount').textContent = (i + 1).toString();
            document.getElementById('progressBar').style.width = `${((i + 1) / selectedStudents.length) * 100}%`;
            document.getElementById('currentStudentName').textContent = student.name;
            
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
            
            // 生成文件名
            let fileName = '';
            switch (fileNameFormat) {
                case 'id_name':
                    fileName = `${student.id}_${student.name}`;
                    break;
                case 'name_id':
                    fileName = `${student.name}_${student.id}`;
                    break;
                case 'id':
                    fileName = student.id;
                    break;
                case 'name':
                    fileName = student.name;
                    break;
                default:
                    fileName = `${student.id}_${student.name}`;
            }
            
            // 导出文档
            const blob = await docx.Packer.toBlob(doc);
            
            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        
        // 关闭导出进度模态框
        exportProgressModal.hide();
        
        // 显示导出完成提示
        showNotification(`成功导出 ${selectedStudents.length} 份报告！`);
        
        // 显示导出完成模态框
        const exportCompleteModal = new bootstrap.Modal(document.getElementById('exportCompleteModal'));
        document.getElementById('exportedCount').textContent = selectedStudents.length;
        exportCompleteModal.show();
    } catch (error) {
        console.error('导出报告时发生错误:', error);
        showNotification('导出报告时发生错误，请稍后重试', 'error');
    }
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