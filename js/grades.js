// 成绩管理模块

let currentSemester = ''; // 当前选择的学期
// 使用data.js中已定义的subjects变量 - 确保data.js已在页面中引入
const subjectNames = {
    'daof': '道法',
    'yuwen': '语文',
    'shuxue': '数学',
    'yingyu': '英语',
    'laodong': '劳动',
    'tiyu': '体育',
    'yinyue': '音乐',
    'meishu': '美术',
    'kexue': '科学',
    'zonghe': '综合',
    'xinxi': '信息',
    'shufa': '书法'
};

document.addEventListener('DOMContentLoaded', function() {
    // 初始化学期选择和数据
    setupSemesterSelect();
    
    // 绑定搜索事件
    const searchInput = document.getElementById('searchStudent');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterGrades(this.value);
        });
    }
    
    // 绑定导出成绩按钮事件
    const exportGradesBtn = document.getElementById('exportGradesBtn');
    if (exportGradesBtn) {
        exportGradesBtn.addEventListener('click', function() {
            exportGrades();
        });
    }
    
    // 绑定"一键优"按钮事件
    const setAllExcellentBtn = document.getElementById('setAllExcellentBtn');
    if (setAllExcellentBtn) {
        setAllExcellentBtn.addEventListener('click', function() {
            setAllGradesExcellent();
        });
    }
    
    // 绑定清空所有成绩按钮事件
    const clearAllGradesBtn = document.getElementById('clearAllGradesBtn');
    if (clearAllGradesBtn) {
        clearAllGradesBtn.addEventListener('click', function() {
            clearAllGrades();
        });
    }
    
    // 初始化成绩导入功能
    initGradesImport();
    
    // 绑定成绩选择框变化事件 - 使用事件委托
    document.addEventListener('change', function(e) {
        if (e.target && e.target.classList.contains('grade-select')) {
            updateGrade(e.target);
        }
    });
});

// 设置学期选择器
function setupSemesterSelect() {
    const semesterSelect = document.getElementById('semesterSelect');
    const importSemesterSelect = document.getElementById('importSemester');
    
    // 自动计算当前学期
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 月份从0开始，需要+1
    
    let academicYear, semester;
    
    // 3-8月为下学期（春季），9-2月为上学期（秋季）
    if (currentMonth >= 3 && currentMonth <= 8) {
        // 春季 - 下学期
        academicYear = `${currentYear-1}-${currentYear}`;
        semester = `下学期`;
    } else {
        // 秋季 - 上学期（包括9-12月和1-2月）
        if (currentMonth >= 9) {
            // 当年秋季
            academicYear = `${currentYear}-${currentYear+1}`;
        } else {
            // 次年初（1-2月）
            academicYear = `${currentYear-1}-${currentYear}`;
        }
        semester = `上学期`;
    }
    
    // 设置当前学期
    currentSemester = `${academicYear}学年${semester}`;
    
    if (semesterSelect) {
        // 设置学期显示文本
        semesterSelect.textContent = currentSemester;
    }
    
    if (importSemesterSelect) {
        // 设置导入模态框中的学期文本
        importSemesterSelect.value = currentSemester;
    }

    // 加载初始数据
    loadGrades();
}

// 加载成绩数据
function loadGrades() {
    const gradesTable = document.querySelector('.grades-table table tbody');
    if (!gradesTable) return;
    
    // 显示加载状态
    gradesTable.innerHTML = `
        <tr>
            <td colspan="14" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
                <p class="mt-2">正在加载学生成绩数据...</p>
            </td>
        </tr>
    `;
    
    // 从API获取数据
    console.log('正在加载学期成绩:', currentSemester);
    fetch(`/api/grades?semester=${encodeURIComponent(currentSemester)}`)
        .then(response => response.json())
        .then(data => {
            console.log('成绩API返回数据:', data);
            if (data.status === 'ok') {
                console.log('成功获取成绩数据, 学生数量:', data.grades ? data.grades.length : 0);
                renderGradesTable(data.grades || []);
            } else {
                showNotification(data.message || '加载成绩失败', 'error');
                gradesTable.innerHTML = `
                    <tr>
                        <td colspan="13" class="text-center py-5">
                            <div class="empty-state">
                                <i class='bx bx-error-circle'></i>
                                <h3>加载失败</h3>
                                <p>${data.message || '无法加载成绩数据'}</p>
                            </div>
                        </td>
                    </tr>
                `;
            }
        })
        .catch(error => {
            console.error('获取成绩数据时出错:', error);
            gradesTable.innerHTML = `
                <tr>
                    <td colspan="14" class="text-center py-5">
                        <div class="empty-state">
                            <i class='bx bx-error-circle'></i>
                            <h3>加载失败</h3>
                            <p>获取成绩数据时发生错误</p>
                        </div>
                    </td>
                </tr>
            `;
        });
}

// 渲染成绩表格
function renderGradesTable(grades) {
    console.log('渲染成绩表格, 数据:', grades);
    const gradesTable = document.querySelector('.grades-table table tbody');
    if (!gradesTable) {
        console.error('找不到成绩表格元素');
        return;
    }
    
    // 检查是否有数据
    if (!grades || grades.length === 0) {
        console.log('没有成绩数据可显示');
        gradesTable.innerHTML = `
            <tr>
                <td colspan="14" class="text-center py-5">
                    <div class="empty-state">
                        <i class='bx bx-file-blank'></i>
                        <h3>暂无成绩数据</h3>
                        <p>当前学期尚未录入任何学生成绩</p>
                        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#importGradesModal">
                            <i class='bx bx-import'></i> 导入成绩
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // 按班级和学号排序
    console.log('开始排序学生数据');
    grades.sort((a, b) => {
        if (a.class !== b.class) {
            return a.class.localeCompare(b.class);
        }
        return parseInt(a.student_id) - parseInt(b.student_id);
    });
    
    // 清空表格
    gradesTable.innerHTML = '';
    console.log('表格已清空，准备添加学生行');
    
    // 添加学生行
    let currentClass = null;
    
    console.log(`开始遍历 ${grades.length} 个学生记录`);
    grades.forEach((grade, index) => {
        console.log(`处理第${index+1}个学生: ${grade.student_name}, 班级: ${grade.class}`);
        
        // 不显示班级标题，因为所有学生都是同一个班级
        
        // 直接处理学生行
        console.log(`开始创建学生行: ${grade.student_name}`);
        
        // 创建学生成绩行
        const row = document.createElement('tr');
        row.setAttribute('data-student-id', grade.student_id);
        row.setAttribute('data-student-name', grade.student_name);
        row.setAttribute('data-student-class', grade.class || '');
        
        // 学号单元格
        const idCell = document.createElement('td');
        idCell.textContent = grade.student_id;
        row.appendChild(idCell);
        
        // 姓名单元格
        const nameCell = document.createElement('td');
        nameCell.textContent = grade.student_name;
        row.appendChild(nameCell);
        
        // 各科成绩单元格
        subjects.forEach(subject => {
            const cell = document.createElement('td');
            // 检查成绩是否存在，不存在则显示为空
            const gradeValue = grade[subject] !== undefined ? grade[subject] : '';
            
            // 创建成绩下拉选择器
            const select = document.createElement('select');
            select.className = 'form-select form-select-sm grade-select';
            select.setAttribute('data-student-id', grade.student_id);
            select.setAttribute('data-subject', subject);
            
            // 添加选项（支持优、良、及格、待及格四个等级）
            ['', '优', '良', '及格', '待及格'].forEach(option => {
                const optionEl = document.createElement('option');
                optionEl.value = option;
                optionEl.textContent = option || '无';
                if (option === gradeValue) {
                    optionEl.selected = true;
                }
                select.appendChild(optionEl);
            });
            
            // 设置样式 - 为不同等级设置不同的颜色
            if (gradeValue === '优') {
                select.classList.add('grade-a');
            } else if (gradeValue === '良') {
                select.classList.add('grade-b');
            } else if (gradeValue === '及格') {
                select.classList.add('grade-c');
            } else if (gradeValue === '待及格') {
                select.classList.add('grade-d');
            }
            
            cell.appendChild(select);
            row.appendChild(cell);
        });
        
        gradesTable.appendChild(row);
    });
}

// 过滤成绩表格
function filterGrades(keyword) {
    if (!keyword) {
        // 如果没有关键字，显示所有行
        document.querySelectorAll('.grades-table table tbody tr').forEach(row => {
            row.style.display = '';
        });
        return;
    }
    
    keyword = keyword.toLowerCase();
    
    // 过滤学生行和班级行
    let lastVisibleClass = null;
    const classRows = {};
    const studentRows = [];
    
    // 收集所有班级行和学生行
    document.querySelectorAll('.grades-table table tbody tr').forEach(row => {
        if (row.classList.contains('table-light')) {
            // 班级行
            const className = row.textContent.trim();
            classRows[className] = row;
            row.style.display = 'none'; // 默认隐藏所有班级行
        } else if (row.hasAttribute('data-student-id')) {
            // 学生行
            studentRows.push(row);
            
            const studentId = row.getAttribute('data-student-id');
            const studentName = row.querySelector('td:nth-child(2)').textContent;
            
            // 检查是否匹配搜索关键字
            if (studentId.toLowerCase().includes(keyword) || 
                studentName.toLowerCase().includes(keyword)) {
                row.style.display = '';
                
                // 找到这个学生所属的班级行
                const className = row.previousElementSibling.textContent.trim();
                if (classRows[className]) {
                    classRows[className].style.display = '';
                }
            } else {
                row.style.display = 'none';
            }
        } else {
            // 其他行（如空状态行）
            row.style.display = keyword ? 'none' : '';
        }
    });
}

// 更新学生成绩
function updateGrade(selectElement) {
    const studentId = selectElement.getAttribute('data-student-id');
    const subject = selectElement.getAttribute('data-subject');
    const value = selectElement.value;
    
    // 显示保存中状态
    const originalBg = selectElement.style.backgroundColor;
    selectElement.style.backgroundColor = '#e6f7ff'; // 浅蓝色表示正在保存
    
    // 更新样式
    selectElement.className = 'form-select form-select-sm grade-select';
    if (value === '优') {
        selectElement.classList.add('grade-a');
    } else if (value === '良') {
        selectElement.classList.add('grade-b');
    } else if (value === '差') {
        selectElement.classList.add('grade-c');
    }
    
    // 准备要发送的数据
    const gradeData = {
        semester: currentSemester
    };
    gradeData[subject] = value;
    
    console.log(`保存学生 ${studentId} 的 ${subject} 成绩: ${value}`);
    
    // 发送到服务器
    fetch(`/api/grades/${studentId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(gradeData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'ok') {
            showNotification(`成功保存 ${studentId} 的 ${subjectNames[subject] || subject} 成绩`, 'success');
            selectElement.style.backgroundColor = '#d4edda'; // 绿色表示保存成功
            setTimeout(() => {
                selectElement.style.backgroundColor = originalBg;
            }, 1000);
        } else {
            selectElement.style.backgroundColor = '#f8d7da'; // 红色表示保存失败
            showNotification(data.message || '保存成绩失败', 'error');
            setTimeout(() => {
                selectElement.style.backgroundColor = originalBg;
            }, 1000);
        }
    })
    .catch(error => {
        console.error('保存成绩时出错:', error);
        selectElement.style.backgroundColor = '#f8d7da'; // 红色表示保存失败
        showNotification('保存成绩时发生错误', 'error');
        setTimeout(() => {
            selectElement.style.backgroundColor = originalBg;
        }, 1000);
    });
}

// 导入成绩
function importGrades() {
    // 获取文件路径
    const filePath = document.getElementById('importFilePath').value;
    if (!filePath) {
        showNotification('无效的文件路径，请重新上传文件', 'error');
        return;
    }
    
    const semesterInput = document.getElementById('importSemester');
    if (!semesterInput || !semesterInput.value) {
        showNotification('请选择学期', 'warning');
        return;
    }
    
    const semester = semesterInput.value;
    
    // 显示确认导入按钮加载状态
    const importBtn = document.getElementById('confirmImportGrades');
    importBtn.disabled = true;
    const originalBtnText = importBtn.innerHTML;
    importBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 导入中...`;
    
    // 显示加载状态
    document.getElementById('previewContent').innerHTML += `
        <div class="alert alert-info mt-3">
            <i class='bx bx-loader-alt bx-spin'></i> 正在导入数据，请稍候...
        </div>
    `;
    
    // 发送确认导入请求
    fetch('/api/grades/confirm-import', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            file_path: filePath,
            semester: semester
        })
    })
    .then(response => response.json())
    .then(data => {
        // 恢复按钮状态
        importBtn.disabled = false;
        importBtn.innerHTML = originalBtnText;
        
        if (data.status === 'ok') {
            showNotification(data.message || '成功导入成绩', 'success');
            
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('importGradesModal'));
            if (modal) modal.hide();
            
            // 重置模态框
            resetImportModal();
            
            // 如果导入的学期与当前选择的学期相同，刷新数据
            if (semester === currentSemester) {
                loadGrades();
            }
        } else {
            showNotification(data.message || '导入成绩失败', 'error');
            
            // 在预览区域显示错误
            document.getElementById('previewContent').innerHTML += `
                <div class="alert alert-danger mt-3">
                    <i class='bx bx-error-circle'></i> 导入失败: ${data.message || '未知错误'}
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('导入成绩时出错:', error);
        importBtn.disabled = false;
        importBtn.innerHTML = originalBtnText;
        
        showNotification('导入成绩时发生错误', 'error');
        
        // 在预览区域显示错误
        document.getElementById('previewContent').innerHTML += `
            <div class="alert alert-danger mt-3">
                <i class='bx bx-error-circle'></i> 导入失败: ${error.message}
            </div>
        `;
    });
}

// 预览成绩导入
function previewGradesImport() {
    const fileInput = document.getElementById('gradeFile');
    const semesterInput = document.getElementById('importSemester');
    const previewArea = document.getElementById('previewArea');
    const previewContent = document.getElementById('previewContent');
    const confirmImportBtn = document.getElementById('confirmImportGrades');
    
    if (!fileInput || !fileInput.files.length) {
        showNotification('请选择要导入的Excel文件', 'warning');
        return;
    }
    
    if (!semesterInput || !semesterInput.value) {
        showNotification('请选择学期', 'warning');
        return;
    }
    
    const file = fileInput.files[0];
    const semester = semesterInput.value;
    
    // 创建FormData对象
    const formData = new FormData();
    formData.append('file', file);
    formData.append('semester', semester);
    
    // 显示加载中状态
    previewContent.innerHTML = `
        <div class="text-center p-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">上传中...</span>
            </div>
            <p class="mt-3">正在上传并解析文件，请稍候...</p>
        </div>
    `;
    
    // 禁用确认导入按钮
    confirmImportBtn.disabled = true;
    
    // 发送预览请求
    fetch('/api/grades/preview-import', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'ok') {
            // 显示预览内容
            previewContent.innerHTML = data.html_preview;
            
            // 保存文件路径
            document.getElementById('importFilePath').value = data.file_path;
            
            // 启用确认导入按钮
            confirmImportBtn.disabled = false;
        } else {
            // 显示错误
            previewContent.innerHTML = `
                <div class="alert alert-danger">
                    <i class='bx bx-error-circle'></i> ${data.message || '预览成绩导入失败'}
                </div>
            `;
            confirmImportBtn.disabled = true;
        }
    })
    .catch(error => {
        console.error('预览成绩导入时出错:', error);
        previewContent.innerHTML = `
            <div class="alert alert-danger">
                <i class='bx bx-error-circle'></i> 预览成绩导入时发生错误: ${error.message}
            </div>
        `;
        confirmImportBtn.disabled = true;
    });
}

// 重置导入模态框
function resetImportModal() {
    // 清空文件输入
    document.getElementById('gradeFile').value = '';
    
    // 清空文件名显示
    const fileNameDisplay = document.getElementById('selectedFileName');
    if (fileNameDisplay) {
        fileNameDisplay.textContent = '';
    }
    
    // 清空预览内容
    document.getElementById('previewContent').innerHTML = '';
    
    // 清空隐藏字段
    document.getElementById('importFilePath').value = '';
    
    // 禁用确认导入按钮
    document.getElementById('confirmImportGrades').disabled = true;
}

// 初始化成绩导入相关事件
function initGradesImport() {
    // 文件选择事件
    const fileInput = document.getElementById('gradeFile');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            // 选择文件后自动触发预览
            const file = e.target.files[0];
            if (file) {
                // 显示文件名
                const fileNameDisplay = document.getElementById('selectedFileName');
                if (fileNameDisplay) {
                    fileNameDisplay.textContent = file.name;
                }
                
                // 检查文件类型
                if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
                    showNotification('只支持Excel文件格式 (.xlsx, .xls)', 'error');
                    return;
                }
                
                // 自动触发预览
                previewGradesImport();
            }
        });
    }
    
    // 下载模板按钮事件
    document.getElementById('downloadTemplateBtn').addEventListener('click', function() {
        window.open('/api/grades/template', '_blank');
    });
    
    // 确认导入按钮事件
    document.getElementById('confirmImportGrades').addEventListener('click', importGrades);
    
    // 模态框关闭时重置
    document.getElementById('importGradesModal').addEventListener('hidden.bs.modal', resetImportModal);
    
    // 绑定拖放区域事件
    const importArea = document.querySelector('.import-area');
    if (importArea) {
        importArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('drag-over');
        });
        
        importArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('drag-over');
        });
        
        importArea.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const fileInput = document.getElementById('gradeFile');
                fileInput.files = files;
                
                // 显示文件名
                const fileNameDisplay = document.getElementById('selectedFileName');
                if (fileNameDisplay) {
                    fileNameDisplay.textContent = files[0].name;
                }
                
                // 检查文件类型
                if (!files[0].name.endsWith('.xlsx') && !files[0].name.endsWith('.xls')) {
                    showNotification('只支持Excel文件格式 (.xlsx, .xls)', 'error');
                    return;
                }
                
                // 自动触发预览
                previewGradesImport();
            }
        });
        
        // 点击导入区域也可以触发文件选择
        importArea.addEventListener('click', function(e) {
            if (e.target.tagName !== 'BUTTON') {
                document.getElementById('gradeFile').click();
            }
        });
    }
}

// 导出成绩
function exportGrades() {
    // 未实现，可以通过前端Excel库如SheetJS实现，
    // 或者可以添加后端API返回Excel文件
    showNotification('导出功能尚未实现', 'info');
}

// 一键将所有学生的所有科目成绩设为"优"
function setAllGradesExcellent() {
    // 显示确认对话框
    if (confirm('确定要将当前学期所有学生的所有科目成绩设为"优"吗？')) {
        // 显示加载中的提示
        showNotification('正在设置所有成绩...', 'info');
        
        // 首先获取所有成绩选择框
        const gradeSelects = document.querySelectorAll('.grade-select');
        
        // 如果没有成绩选择框，提示用户
        if (gradeSelects.length === 0) {
            showNotification('当前没有学生成绩数据可设置', 'warning');
            return;
        }
        
        // 记录所有要更新的数据
        const updatedGrades = {};
        
        // 将所有成绩选择框设置为"优"
        gradeSelects.forEach(select => {
            // 获取学生ID和科目
            const studentId = select.getAttribute('data-student-id');
            const subject = select.getAttribute('data-subject');
            
            // 如果已经是"优"，则不需要更新
            if (select.value !== '优') {
                // 更新选择框的值
                select.value = '优';
                
                // 更新选择框的样式类
                select.className = 'form-select form-select-sm grade-select grade-a';
                
                // 将数据添加到更新列表中
                if (!updatedGrades[studentId]) {
                    updatedGrades[studentId] = {};
                }
                updatedGrades[studentId][subject] = '优';
            }
        });
        
        // 如果没有需要更新的内容，提示用户
        if (Object.keys(updatedGrades).length === 0) {
            showNotification('所有成绩已经是"优"了', 'info');
            return;
        }
        
        // 发送数据到服务器保存
        const promises = [];
        
        // 对每个学生发送更新请求
        for (const studentId in updatedGrades) {
            const gradeData = {
                semester: currentSemester,
                ...updatedGrades[studentId]
            };
            
            // 发送请求保存单个学生的成绩
            const promise = fetch(`/api/grades/${studentId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gradeData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.status !== 'ok') {
                    throw new Error(`无法更新学生 ${studentId} 的成绩: ${data.message}`);
                }
                return data;
            });
            
            promises.push(promise);
        }
        
        // 等待所有请求完成
        Promise.all(promises)
            .then(() => {
                showNotification(`成功更新 ${Object.keys(updatedGrades).length} 名学生的所有科目成绩为"优"`, 'success');
            })
            .catch(error => {
                console.error('设置所有成绩时出错:', error);
                showNotification(`设置成绩时出错: ${error.message}`, 'error');
            });
    }
}

// 根据中文名称查找科目代码
function findSubjectCodeByName(subjectName) {
    // 遍历subjectNames对象，找到匹配的科目代码
    for (const code in subjectNames) {
        if (subjectNames[code] === subjectName) {
            console.log(`找到科目代码: ${subjectName} -> ${code}`);
            return code;
        }
    }
    console.log(`未找到科目代码: ${subjectName}`);
    return null;
}

// 清空所有成绩
function clearAllGrades() {
    // 显示确认对话框
    if (confirm('确定要清空当前学期所有学生的所有科目成绩吗？此操作无法撤销！')) {
        // 显示加载中的提示
        showNotification('正在清空所有成绩...', 'info');
        
        // 首先获取所有成绩选择框
        const gradeSelects = document.querySelectorAll('.grade-select');
        
        // 如果没有成绩选择框，提示用户
        if (gradeSelects.length === 0) {
            showNotification('当前没有学生成绩数据可清空', 'warning');
            return;
        }
        
        // 记录所有要更新的数据
        const updatedGrades = {};
        
        // 将所有成绩选择框清空
        gradeSelects.forEach(select => {
            // 获取学生ID和科目
            const studentId = select.getAttribute('data-student-id');
            const subject = select.getAttribute('data-subject');
            
            // 如果已经是空的，则不需要更新
            if (select.value !== '') {
                // 更新选择框的值
                select.value = '';
                
                // 更新选择框的样式类 - 移除所有颜色类
                select.className = 'form-select form-select-sm grade-select';
                
                // 将数据添加到更新列表中
                if (!updatedGrades[studentId]) {
                    updatedGrades[studentId] = {};
                }
                updatedGrades[studentId][subject] = '';
            }
        });
        
        // 如果没有需要更新的内容，提示用户
        if (Object.keys(updatedGrades).length === 0) {
            showNotification('所有成绩已经是空的了', 'info');
            return;
        }
        
        // 发送数据到服务器保存
        const promises = [];
        
        // 对每个学生发送更新请求
        for (const studentId in updatedGrades) {
            const gradeData = {
                semester: currentSemester,
                ...updatedGrades[studentId]
            };
            
            // 发送请求保存单个学生的成绩
            const promise = fetch(`/api/grades/${studentId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gradeData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.status !== 'ok') {
                    throw new Error(`无法更新学生 ${studentId} 的成绩: ${data.message}`);
                }
                return data;
            });
            
            promises.push(promise);
        }
        
        // 等待所有请求完成
        Promise.all(promises)
            .then(() => {
                showNotification(`成功清空 ${Object.keys(updatedGrades).length} 名学生的所有科目成绩`, 'success');
            })
            .catch(error => {
                console.error('清空所有成绩时出错:', error);
                showNotification(`清空成绩时出错: ${error.message}`, 'error');
            });
    }
}

// 显示通知
function showNotification(message, type = 'info') {
    // 检查是否有通知容器
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class='bx bx-${type === 'success' ? 'check-circle' : type === 'error' ? 'error-circle' : type === 'warning' ? 'error' : 'info-circle'}'></i>
        </div>
        <div class="notification-content">
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // 添加到容器
    notificationContainer.appendChild(notification);
    
    // 添加关闭按钮事件
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', function() {
        notification.classList.add('notification-hiding');
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 300);
    });
    
    // 自动关闭
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('notification-hiding');
            setTimeout(() => {
                if (notification.parentNode) {
                    notificationContainer.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// 列选择和粘贴功能
// 记录当前选择的列
let selectedColumn = null;
let selectedSubject = null;

document.addEventListener('DOMContentLoaded', function() {
    // 列选择和粘贴功能初始化
    initColumnSelectAndPaste();
});

// 初始化列选择和粘贴功能
function initColumnSelectAndPaste() {
    // 绑定表头点击事件
    const gradesTable = document.querySelector('.grades-table table');
    if (gradesTable) {
        const headerRow = gradesTable.querySelector('thead tr');
        if (headerRow) {
            const ths = headerRow.querySelectorAll('th');
            
            // 为每个表头单元格添加点击事件
            ths.forEach((th, index) => {
                // 只对科目列启用选择（索引从2开始是科目列）
                if (index >= 2) {
                    th.addEventListener('click', function() {
                        selectColumn(index, th.textContent.trim());
                    });
                }
            });
        }
    }
    
    // 绑定粘贴按钮事件
    const pasteToCellsBtn = document.getElementById('pasteToCellsBtn');
    if (pasteToCellsBtn) {
        pasteToCellsBtn.addEventListener('click', pasteToSelectedColumn);
    }
    
    // 绑定取消选择按钮事件
    const cancelColumnSelectBtn = document.getElementById('cancelColumnSelectBtn');
    if (cancelColumnSelectBtn) {
        cancelColumnSelectBtn.addEventListener('click', cancelColumnSelection);
    }
}

// 选择列
function selectColumn(colIndex, subjectName) {
    // 如果该列已经选中，取消选择
    if (selectedColumn === colIndex) {
        cancelColumnSelection();
        return;
    }
    
    // 首先取消之前的选择
    cancelColumnSelection();
    
    // 设置新的选中列
    selectedColumn = colIndex;
    
    // 将中文表头转换为代码中使用的科目标识符
    const subjectCode = findSubjectCodeByName(subjectName);
    selectedSubject = subjectCode || subjectName;
    
    // 获取所有单元格
    const table = document.querySelector('.grades-table table');
    const rows = table.querySelectorAll('tr');
    
    // 对所有行应用选中样式
    rows.forEach(row => {
        // 获取当前行的单元格
        const cells = row.querySelectorAll('th, td');
        
        // 检查如果该单元格存在
        if (cells.length > colIndex) {
            // 往该单元格添加选中类
            cells[colIndex].classList.add('selected-column');
        }
    });
    
    // 显示粘贴控制按钮
    document.querySelectorAll('.paste-button').forEach(button => {
        button.style.display = 'inline-block';
    });
    
    // 显示提示消息
    showNotification(`已选中"${selectedSubject}"列，您可以将Excel中复制的数据粘贴到该列`, 'info');
}

// 取消列选择
function cancelColumnSelection() {
    if (selectedColumn === null) return;
    
    // 获取所有标记为选中的单元格
    const selectedCells = document.querySelectorAll('.grades-table .selected-column');
    selectedCells.forEach(cell => {
        cell.classList.remove('selected-column');
    });
    
    // 重置选中列的标记
    selectedColumn = null;
    selectedSubject = null;
    
    // 隐藏粘贴控制按钮
    document.querySelectorAll('.paste-button').forEach(button => {
        button.style.display = 'none';
    });
}

// 将复制的内容粘贴到选中列
function pasteToSelectedColumn() {
    if (selectedColumn === null || selectedSubject === null) {
        showNotification('请先选择要粘贴的列', 'warning');
        return;
    }
    
    // 显示粘贴操作指南
    showNotification(`准备粘贴到「${selectedSubject}」列，请确保您的剪贴板中包含了要粘贴的成绩数据（优、良、及格、待及格）`, 'info');
    
    // 提示用户粘贴内容
    navigator.clipboard.readText()
        .then(text => {
            if (!text.trim()) {
                showNotification('剪贴板内容为空，请先复制数据', 'warning');
                return;
            }
            
            // 显示收到的数据
            console.log('从剪贴板读取到的内容:', text);
            
            // 处理复制的内容
            processPastedText(text);
        })
        .catch(err => {
            console.error('无法读取剪贴板内容:', err);
            showNotification('无法读取剪贴板内容，请确保您已复制数据并允许网站访问剪贴板', 'error');
        });
}

// 处理粘贴的文本
function processPastedText(text) {
    // 分行处理文本
    const lines = text.trim().split("\n");
    
    // 输出日志信息以便调试
    console.log(`准备粘贴到列: ${selectedSubject}`);
    console.log(`粘贴的行数: ${lines.length}`);
    
    // 像"体育"这样的中文科目名字，需要查询对应的科目代码（如"tiyu"）
    // 如果选中的是中文科目名，则尝试转换为对应的科目代码
    let subjectToSearch = selectedSubject;
    let subjectChineseName = selectedSubject;
    
    // 检查是否是中文科目名
    let isChineseSubject = /[\u4e00-\u9fa5]/.test(selectedSubject);
    
    if (isChineseSubject) {
        // 中文名称，查找对应代码
        for (const code in subjectNames) {
            if (subjectNames[code] === selectedSubject) {
                subjectToSearch = code;
                console.log(`将中文科目名称 "${selectedSubject}" 转换为代码 "${code}"`);
                break;
            }
        }
    } else {
        // 可能是代码，查找对应中文名
        subjectChineseName = subjectNames[selectedSubject] || selectedSubject;
    }
    
    // 尝试多种查询方式
    let gradeSelects = [];
    
    // 1. 首先直接使用用户选中的字符串查询
    let selects = document.querySelectorAll(`select[data-subject="${selectedSubject}"]`);
    if (selects.length > 0) {
        console.log(`使用原始选中文本 "${selectedSubject}" 找到 ${selects.length} 个选择框`);
        gradeSelects = selects;
    }
    
    // 2. 如果没找到，尝试使用科目代码查询
    if (gradeSelects.length === 0 && subjectToSearch !== selectedSubject) {
        selects = document.querySelectorAll(`select[data-subject="${subjectToSearch}"]`);
        if (selects.length > 0) {
            console.log(`使用科目代码 "${subjectToSearch}" 找到 ${selects.length} 个选择框`);
            gradeSelects = selects;
        }
    }
    
    // 3. 如果还是没有找到，尝试模糊匹配
    if (gradeSelects.length === 0) {
        console.log(`未找到精确匹配的选择框，尝试模糊匹配`);
        
        // 获取所有成绩选择框
        const allSelects = document.querySelectorAll('select.grade-select');
        console.log(`总计找到 ${allSelects.length} 个成绩选择框`);
        
        // 列出所有选择框的subject属性
        console.log('现有的subject属性值:');
        const subjectValues = new Set();
        allSelects.forEach(select => {
            const subject = select.getAttribute('data-subject');
            if (subject) subjectValues.add(subject);
        });
        console.log([...subjectValues]);
        
        // 尝试匹配中文名称或代码
        const searchTexts = [selectedSubject.toLowerCase(), subjectToSearch.toLowerCase(), subjectChineseName.toLowerCase()];
        
        // 找到最佳匹配
        let bestMatch = null;
        for (const subject of subjectValues) {
            const lowerSubject = subject.toLowerCase();
            for (const searchText of searchTexts) {
                if (lowerSubject === searchText || 
                    lowerSubject.includes(searchText) || 
                    searchText.includes(lowerSubject)) {
                    bestMatch = subject;
                    console.log(`找到最佳匹配: ${bestMatch}`);
                    break;
                }
            }
            if (bestMatch) break;
        }
        
        if (bestMatch) {
            gradeSelects = document.querySelectorAll(`select[data-subject="${bestMatch}"]`);
        }
    }
    
    // 如果仍然没有找到相关成绩选择框，则退出
    if (gradeSelects.length === 0) {
        showNotification(`未找到"${selectedSubject}"相关的成绩选择框，请尝试直接点击表头的科目名称选择`, 'error');
        
        // 显示可用科目列表
        const availableSubjects = Object.values(subjectNames).join('、');
        showNotification(`可用的科目有：${availableSubjects}`, 'info');
        return;
    } else {
        console.log(`找到 ${gradeSelects.length} 个选择框用于粘贴`);
    }
    
    // 验证有效的等级
    const validGrades = ['优', '良', '及格', '待及格'];
    
    // 记录要更新的数据
    const updatedGrades = {};
    let validUpdatesCount = 0;
    let errorsCount = 0;
    
    // 逐行处理数据
    for (let i = 0; i < Math.min(lines.length, gradeSelects.length); i++) {
        const value = lines[i].trim();
        const select = gradeSelects[i];
        const studentId = select.getAttribute('data-student-id');
        
        // 直接使用复制的等级值
        let gradeValue = value.trim();
        
        // 如果复制的不是直接的等级，则尝试进行简单的标准化处理
        if (!validGrades.includes(gradeValue)) {
            // 对于常见的误差进行修正
            if (gradeValue === '优秀' || gradeValue === 'A' || gradeValue === 'a') {
                gradeValue = '优';
            } else if (gradeValue === 'B' || gradeValue === 'b') {
                gradeValue = '良';
            } else if (gradeValue === 'C' || gradeValue === 'c' || gradeValue === '中') {
                gradeValue = '及格';
            } else if (gradeValue === 'D' || gradeValue === 'd' || gradeValue === '不及格') {
                gradeValue = '待及格';
            }
        }
        
        // 检查是否是有效的等级
        if (validGrades.includes(gradeValue)) {
            // 更新选择框
            select.value = gradeValue;
            
            // 更新选择框类
            select.className = 'form-select form-select-sm grade-select';
            if (gradeValue === '优') {
                select.classList.add('grade-a');
            } else if (gradeValue === '良') {
                select.classList.add('grade-b');
            } else if (gradeValue === '及格') {
                select.classList.add('grade-c');
            } else if (gradeValue === '待及格') {
                select.classList.add('grade-d');
            }
            
            // 添加到要保存的数据中
            if (!updatedGrades[studentId]) {
                updatedGrades[studentId] = {};
            }
            updatedGrades[studentId][selectedSubject] = gradeValue;
            validUpdatesCount++;
        } else {
            console.warn(`无效的成绩等级: ${value}`);
            errorsCount++;
        }
    }
    
    // 如果没有有效更新，显示错误
    if (validUpdatesCount === 0) {
        showNotification(`无效的数据格式，请确保复制的内容包含有效的成绩等级（优、良、差或相应的数字分数）`, 'error');
        return;
    }
    
    // 保存更新的成绩
    saveUpdatedGrades(updatedGrades, validUpdatesCount, errorsCount);
}

// 保存更新的成绩数据
function saveUpdatedGrades(updatedGrades, validCount, errorCount) {
    // 发送数据到服务器保存
    const promises = [];
    
    // 对每个学生发送更新请求
    for (const studentId in updatedGrades) {
        const gradeData = {
            semester: currentSemester,
            ...updatedGrades[studentId]
        };
        
        // 发送请求保存单个学生的成绩
        const promise = fetch(`/api/grades/${studentId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gradeData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status !== 'ok') {
                throw new Error(`无法更新学生 ${studentId} 的成绩: ${data.message}`);
            }
            return data;
        });
        
        promises.push(promise);
    }
    
    // 待所有请求完成
    Promise.all(promises)
        .then(() => {
            let message = `成功更新 ${validCount} 条成绩数据`;
            if (errorCount > 0) {
                message += `，${errorCount} 条数据无效被跳过`;
            }
            showNotification(message, 'success');
            
            // 取消列选择
            cancelColumnSelection();
        })
        .catch(error => {
            console.error('保存成绩时出错:', error);
            showNotification(`保存成绩时出错: ${error.message}`, 'error');
        });
}