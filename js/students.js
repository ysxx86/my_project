// @charset UTF-8
document.addEventListener('DOMContentLoaded', function() {
    console.log("页面加载完成，初始化学生管理功能...");
    
    // 检查当前页面是否包含学生管理相关元素
    if (document.getElementById('studentCards') || 
        document.getElementById('importModal') || 
        document.getElementById('addStudentForm')) {
        
        // 初始化学生列表 - 从服务器加载数据而不是从本地存储
        loadStudentsFromServer();
        
        // 初始化导入功能
        initImportStudents();
    }

    // 绑定搜索事件
    const searchInput = document.getElementById('searchStudent');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterStudents(this.value);
        });
    }
    
    // 绑定添加学生表单提交事件
    const addStudentForm = document.getElementById('addStudentForm');
    if (addStudentForm) {
        addStudentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addStudent();
        });
    }
    
    // 绑定编辑学生表单提交事件
    const editStudentForm = document.getElementById('editStudentForm');
    if (editStudentForm) {
        editStudentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveEditedStudent();
        });
    }
    
    // 绑定删除学生确认按钮事件
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            deleteStudent();
        });
    }
    
    // 绑定导入学生确认按钮事件
    const confirmImport = document.getElementById('confirmImport');
    if (confirmImport) {
        confirmImport.addEventListener('click', function() {
            importStudents();
        });
    }
    
    // 绑定文件导入事件
    const fileImport = document.getElementById('fileImport');
    if (fileImport) {
        fileImport.addEventListener('change', function(e) {
            handleFileImport(e);
        });
    }
        
    // 绑定下载模板按钮事件
    const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener('click', function() {
            downloadTemplate();
        });
    }
        
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
                const fileInput = document.getElementById('fileImport');
                fileInput.files = files;
                handleFileImport({ target: fileInput });
            }
        });
    }
    
    // 监听编辑学生模态框显示事件，填充表单数据
    const editStudentModal = document.getElementById('editStudentModal');
    if (editStudentModal) {
        editStudentModal.addEventListener('show.bs.modal', function(e) {
            // 不在这里调用openEditStudentModal，而是通过按钮的onclick事件直接调用
            // 避免从e.relatedTarget获取属性，防止undefined错误
            console.log("编辑模态框显示事件触发");
        });
    }
    
    // 监听删除学生模态框显示事件，设置学生信息
    const deleteStudentModal = document.getElementById('deleteStudentModal');
    if (deleteStudentModal) {
        deleteStudentModal.addEventListener('show.bs.modal', function(e) {
            const button = e.relatedTarget;
            const studentId = button.getAttribute('data-student-id');
            const studentName = button.getAttribute('data-student-name');
            document.getElementById('deleteStudentId').value = studentId;
            document.getElementById('deleteStudentName').textContent = studentName;
        });
    }
    
    // 修复模态框可访问性问题
    const fixModalAccessibility = () => {
        const modals = [
            'editStudentModal', 
            'studentDetailsModal', 
            'addStudentModal', 
            'commentModal', 
            'importModal', 
            'deleteStudentModal',
            'importConfirmModal'
        ];
        
        modals.forEach(modalId => {
            const modalEl = document.getElementById(modalId);
            if (modalEl) {
                // 记录打开模态框前的焦点元素
                let previousActiveElement;
                
                modalEl.addEventListener('show.bs.modal', function() {
                    previousActiveElement = document.activeElement;
                });
                
                // 监听模态框隐藏事件
                modalEl.addEventListener('hidden.bs.modal', function() {
                    // 当模态框隐藏时，将焦点返回到安全元素
                    if (previousActiveElement && previousActiveElement.focus) {
                        setTimeout(() => previousActiveElement.focus(), 0);
                    } else {
                        // 如果无法返回之前的焦点元素，则聚焦到body
                        setTimeout(() => document.body.focus(), 0);
                    }
                    
                    // 移除模态框中所有输入元素的焦点
                    const focusableElements = modalEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                    focusableElements.forEach(el => {
                        el.blur();
                    });
                });
            }
        });
    };
    
    // 应用可访问性修复
    fixModalAccessibility();
});

// 初始化学生列表
function initStudentList() {
    // 从服务器加载学生数据
    loadStudentsFromServer();
}

// 创建学生卡片
function createStudentCard(student) {
    // 创建卡片容器
    const card = document.createElement('div');
    card.className = 'col-md-4 col-sm-6 col-lg-2 mb-3';
    
    // 定义一个辅助函数来处理数值显示
    const displayNumericValue = (value) => {
        if (value === 0 || value === 0.0) {
            return '0';
        }
        return value !== null && value !== undefined ? value : '-';
    };
    
    // 卡片内容
    card.innerHTML = `
        <div class="card student-card h-100">
            <div class="card-header p-2">
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="card-title mb-0 student-name">${student.name}</h6>
                    <span class="badge ${student.gender === '男' ? 'bg-primary' : 'bg-danger'}">${student.gender}</span>
                </div>
            </div>
            <div class="card-body p-2">
                <p class="card-text small mb-1 student-id"><strong>学号:</strong> ${student.id}</p>
                <p class="card-text small mb-1"><strong>班级:</strong> ${student.class || '未设置'}</p>
                <p class="card-text small mb-1"><strong>身高:</strong> ${displayNumericValue(student.height)} cm</p>
                <p class="card-text small mb-1"><strong>体重:</strong> ${displayNumericValue(student.weight)} kg</p>
                <p class="card-text small mb-1"><strong>胸围:</strong> ${displayNumericValue(student.chest_circumference)} cm</p>
                <p class="card-text small mb-1"><strong>肺活量:</strong> ${displayNumericValue(student.vital_capacity)} ml</p>
                <p class="card-text small mb-1"><strong>龋齿:</strong> ${student.dental_caries || '-'}</p>
                <p class="card-text small mb-1"><strong>视力:</strong> 左${displayNumericValue(student.vision_left)}/右${displayNumericValue(student.vision_right)}</p>
                <p class="card-text small mb-1"><strong>体测情况:</strong> ${student.physical_test_status || '-'}</p>
            </div>
            <div class="card-footer p-2">
                <div class="d-flex justify-content-between flex-wrap">
                    <button type="button" class="btn btn-outline-info btn-sm mb-1" onclick="viewStudentDetails('${student.id}')">
                        <i class="bi bi-info-circle"></i> 详情
                    </button>
                    <button type="button" class="btn btn-outline-success btn-sm mb-1" onclick="openCommentModal('${student.id}')">
                        <i class="bi bi-chat-text"></i> 评语
                    </button>
                    <button type="button" class="btn btn-outline-primary btn-sm mb-1" onclick="openEditStudentModal('${student.id}')">
                        <i class="bi bi-pencil"></i> 编辑
                    </button>
                    <button type="button" class="btn btn-outline-danger btn-sm mb-1" onclick="deleteStudent('${student.id}')">
                        <i class="bi bi-trash"></i> 删除
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// 查看学生详情
function viewStudentDetails(studentId) {
    // 显示加载状态
    const loadingToast = showNotification('正在加载学生详细数据...', 'info', false);
    
    // 从服务器获取学生数据
    fetch(`/api/students/${studentId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`服务器响应错误: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                showNotification(data.error, 'error');
                return;
            }
            
            const student = data.student;
            if (!student) {
                showNotification('未找到该学生信息', 'error');
                return;
            }
            
            // 关闭加载提示
            if (loadingToast) {
                loadingToast.hide();
            }
            
            // 定义显示数值的辅助函数
            const displayNumericValue = (value) => {
                if (value === 0 || value === 0.0) {
                    return '0';
                }
                return value !== null && value !== undefined ? value : '-';
            };
            
            // 创建或获取详情模态框
            let detailsModal = document.getElementById('studentDetailsModal');
            
            if (!detailsModal) {
                // 创建模态框
                detailsModal = document.createElement('div');
                detailsModal.className = 'modal fade';
                detailsModal.id = 'studentDetailsModal';
                detailsModal.setAttribute('tabindex', '-1');
                detailsModal.setAttribute('aria-labelledby', 'studentDetailsModalLabel');
                // 不要在HTML中使用aria-hidden，让Bootstrap处理它
                // detailsModal.setAttribute('aria-hidden', 'true');
                
                detailsModal.innerHTML = `
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="studentDetailsModalLabel">学生详细信息</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="关闭"></button>
                            </div>
                            <div class="modal-body" id="studentDetailsContent">
                                <!-- 详细信息将在这里显示 -->
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(detailsModal);
                
                // 给模态框添加事件监听器，确保在隐藏时正确处理焦点
                detailsModal.addEventListener('hidden.bs.modal', function () {
                    // 当模态框隐藏时，将焦点转移到安全的元素
                    document.body.focus();
                });
            }
            
            // 填充学生详细信息
            const detailsContent = document.getElementById('studentDetailsContent');
            
            detailsContent.innerHTML = `
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <div class="d-flex justify-content-between align-items-center">
                            <h4>${student.name}</h4>
                            <span class="badge bg-light text-dark">${student.gender}</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <table class="table table-bordered">
                                    <tr>
                                        <th class="bg-light">学号</th>
                                        <td>${student.id}</td>
                                    </tr>
                                    <tr>
                                        <th class="bg-light">班级</th>
                                        <td>${student.class || '未设置'}</td>
                                    </tr>
                                    <tr>
                                        <th class="bg-light">身高</th>
                                        <td>${displayNumericValue(student.height)} cm</td>
                                    </tr>
                                    <tr>
                                        <th class="bg-light">体重</th>
                                        <td>${displayNumericValue(student.weight)} kg</td>
                                    </tr>
                                    <tr>
                                        <th class="bg-light">胸围</th>
                                        <td>${displayNumericValue(student.chest_circumference)} cm</td>
                                    </tr>
                                </table>
                            </div>
                            <div class="col-md-6">
                                <table class="table table-bordered">
                                    <tr>
                                        <th class="bg-light">肺活量</th>
                                        <td>${displayNumericValue(student.vital_capacity)} ml</td>
                                    </tr>
                                    <tr>
                                        <th class="bg-light">龋齿</th>
                                        <td>${student.dental_caries || '无'}</td>
                                    </tr>
                                    <tr>
                                        <th class="bg-light">视力(左)</th>
                                        <td>${displayNumericValue(student.vision_left)}</td>
                                    </tr>
                                    <tr>
                                        <th class="bg-light">视力(右)</th>
                                        <td>${displayNumericValue(student.vision_right)}</td>
                                    </tr>
                                    <tr>
                                        <th class="bg-light">体测情况</th>
                                        <td>${student.physical_test_status || '未记录'}</td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                        
                        <div class="row mt-3">
                            <div class="col-12">
                                <div class="card">
                                    <div class="card-header bg-info text-white">
                                        <h5 class="mb-0">健康指标分析</h5>
                                    </div>
                                    <div class="card-body">
                                        <div id="healthAnalysis">
                                            ${generateHealthAnalysis(student)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // 显示模态框
            const modal = new bootstrap.Modal(detailsModal);
            modal.show();
        })
        .catch(error => {
            console.error('获取学生数据出错:', error);
            showNotification('获取学生数据出错: ' + error.message, 'error');
        });
}

// 生成健康指标分析
function generateHealthAnalysis(student) {
    let analysis = '<ul class="list-group list-group-flush">';
    
    // 身高体重指标
    if (student.height && student.weight) {
        // 计算BMI
        const height = parseFloat(student.height) / 100; // 转换为米
        const weight = parseFloat(student.weight);
        const bmi = weight / (height * height);
        
        let bmiStatus = '';
        let bmiClass = '';
        
        if (bmi < 18.5) {
            bmiStatus = '偏瘦';
            bmiClass = 'text-warning';
        } else if (bmi < 24) {
            bmiStatus = '正常';
            bmiClass = 'text-success';
        } else if (bmi < 28) {
            bmiStatus = '超重';
            bmiClass = 'text-warning';
        } else {
            bmiStatus = '肥胖';
            bmiClass = 'text-danger';
        }
        
        analysis += `<li class="list-group-item">
            <strong>BMI指数:</strong> ${bmi.toFixed(2)} 
            <span class="${bmiClass}">（${bmiStatus}）</span>
        </li>`;
    }
    
    // 视力评估
    if (student.vision_left || student.vision_right) {
        const visionLeft = parseFloat(student.vision_left || 0);
        const visionRight = parseFloat(student.vision_right || 0);
        
        let visionStatus = '';
        let visionClass = '';
        
        // 取较差的一只眼睛作为标准
        const visionValue = Math.min(visionLeft || 5.0, visionRight || 5.0);
        
        if (visionValue >= 5.0) {
            visionStatus = '正常';
            visionClass = 'text-success';
        } else if (visionValue >= 4.6) {
            visionStatus = '轻度近视';
            visionClass = 'text-info';
        } else if (visionValue >= 4.0) {
            visionStatus = '中度近视';
            visionClass = 'text-warning';
        } else {
            visionStatus = '重度近视';
            visionClass = 'text-danger';
        }
        
        analysis += `<li class="list-group-item">
            <strong>视力状况:</strong> 
            <span class="${visionClass}">${visionStatus}</span>
        </li>`;
    }
    
    // 肺活量评估
    if (student.vital_capacity) {
        const vitalCapacity = parseFloat(student.vital_capacity);
        let vcStatus = '';
        let vcClass = '';
        
        // 根据性别不同，评估标准不同
        if (student.gender === '男') {
            if (vitalCapacity >= 3000) {
                vcStatus = '优秀';
                vcClass = 'text-success';
            } else if (vitalCapacity >= 2500) {
                vcStatus = '良好';
                vcClass = 'text-info';
            } else if (vitalCapacity >= 2000) {
                vcStatus = '一般';
                vcClass = 'text-warning';
            } else {
                vcStatus = '较弱';
                vcClass = 'text-danger';
            }
        } else {
            if (vitalCapacity >= 2500) {
                vcStatus = '优秀';
                vcClass = 'text-success';
            } else if (vitalCapacity >= 2000) {
                vcStatus = '良好';
                vcClass = 'text-info';
            } else if (vitalCapacity >= 1500) {
                vcStatus = '一般';
                vcClass = 'text-warning';
            } else {
                vcStatus = '较弱';
                vcClass = 'text-danger';
            }
        }
        
        analysis += `<li class="list-group-item">
            <strong>肺活量水平:</strong> 
            <span class="${vcClass}">${vcStatus}</span>
        </li>`;
    }
    
    // 龋齿情况
    if (student.dental_caries) {
        let dentalClass = student.dental_caries.includes('无') ? 'text-success' : 'text-warning';
        
        analysis += `<li class="list-group-item">
            <strong>牙齿状况:</strong> 
            <span class="${dentalClass}">${student.dental_caries || '无记录'}</span>
        </li>`;
    }
    
    // 体测情况
    if (student.physical_test_status) {
        let physicalClass = 'text-info';
        if (student.physical_test_status.includes('优') || student.physical_test_status.includes('良好')) {
            physicalClass = 'text-success';
        } else if (student.physical_test_status.includes('不')) {
            physicalClass = 'text-danger';
        }
        
        analysis += `<li class="list-group-item">
            <strong>体测评价:</strong> 
            <span class="${physicalClass}">${student.physical_test_status}</span>
        </li>`;
    }
    
    analysis += '</ul>';
    
    return analysis;
}

// 添加学生
function addStudent() {
    const id = document.getElementById('studentId').value;
    const name = document.getElementById('studentName').value;
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const studentClass = document.getElementById('studentClass').value;
    const height = document.getElementById('studentHeight').value;
    const weight = document.getElementById('studentWeight').value;
    const chest = document.getElementById('studentChest').value;
    const visionLeft = document.getElementById('studentVisionLeft').value;
    const visionRight = document.getElementById('studentVisionRight').value;
    const vitalCapacity = document.getElementById('studentVital').value;
    const dentalCaries = document.getElementById('studentDental').value;
    const physicalTest = document.getElementById('studentPhysical').value;
    
    // 创建学生对象 - 使用下划线命名风格以与服务器保持一致
    const student = {
        id,
        name,
        gender,
        class: studentClass,
        height,
        weight,
        chest_circumference: chest,
        vision_left: visionLeft,
        vision_right: visionRight,
        vital_capacity: vitalCapacity,
        dental_caries: dentalCaries,
        physical_test_status: physicalTest
    };
    
    // 显示处理状态
    const saveBtn = document.querySelector('#addStudentModal .btn-primary');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 保存中...';
    }
    
    // 使用服务器API添加学生
    fetch('/api/students', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(student)
    })
    .then(response => {
        console.log('服务器响应状态码:', response.status);
        // 即使响应不是200，也尝试解析JSON
        return response.json().then(data => {
            if (!response.ok) {
                // 如果服务器返回了错误信息，抛出带有错误信息的错误
                return Promise.reject(data.error || `服务器错误: ${response.status}`);
            }
            return data;
        });
    })
    .then(data => {
        console.log('添加学生成功，服务器响应:', data);
        if (data.status === 'ok') {
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('addStudentModal'));
            modal.hide();
            
            // 重置表单
            document.getElementById('addStudentForm').reset();
            
            // 刷新学生列表
            loadStudentsFromServer();
            
            // 显示成功通知
            showNotification('学生添加成功');
        } else {
            showNotification('学生添加失败: ' + (data.message || '未知错误'), 'error');
        }
    })
    .catch(error => {
        console.error('添加学生时出错:', error);
        showNotification('添加学生时出错: ' + error, 'error');
    })
    .finally(() => {
        // 恢复按钮状态
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '保存';
        }
    });
}

// 打开编辑学生模态框
function openEditStudentModal(studentId) {
    // 显示加载状态
    const loadingToast = showNotification('正在加载学生数据...', 'info', false);
    
    // 从服务器获取学生数据
    fetch(`/api/students/${studentId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`服务器响应错误: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                showNotification(data.error, 'error');
                return;
            }
            
            const student = data.student;
            if (!student) {
                showNotification('未找到该学生信息', 'error');
                return;
            }
            
            // 关闭加载提示
            if (loadingToast) {
                loadingToast.hide();
            }
            
            // 填充表单字段
            document.getElementById('editStudentId').value = student.id;
            document.getElementById('editStudentName').value = student.name;
            
            // 设置性别选项
            if (student.gender === '男') {
                document.getElementById('editGenderMale').checked = true;
            } else {
                document.getElementById('editGenderFemale').checked = true;
            }
            
            document.getElementById('editStudentClass').value = student.class || '';
            document.getElementById('editStudentHeight').value = student.height || '';
            document.getElementById('editStudentWeight').value = student.weight || '';
            document.getElementById('editStudentChest').value = student.chest_circumference || '';
            document.getElementById('editStudentVisionLeft').value = student.vision_left || '';
            document.getElementById('editStudentVisionRight').value = student.vision_right || '';
            document.getElementById('editStudentVital').value = student.vital_capacity || '';
            document.getElementById('editStudentDental').value = student.dental_caries || '';
            document.getElementById('editStudentPhysical').value = student.physical_test_status || '';
            
            // 显示模态框
            const modal = new bootstrap.Modal(document.getElementById('editStudentModal'));
            modal.show();
        })
        .catch(error => {
            console.error('获取学生数据出错:', error);
            showNotification('获取学生数据出错: ' + error.message, 'error');
        });
}

// 保存编辑的学生信息
function saveEditedStudent() {
    const id = document.getElementById('editStudentId').value;
    const name = document.getElementById('editStudentName').value;
    const gender = document.querySelector('input[name="editGender"]:checked')?.value;
    const studentClass = document.getElementById('editStudentClass').value;
    const height = document.getElementById('editStudentHeight').value;
    const weight = document.getElementById('editStudentWeight').value;
    const chest = document.getElementById('editStudentChest').value;
    const visionLeft = document.getElementById('editStudentVisionLeft').value;
    const visionRight = document.getElementById('editStudentVisionRight').value;
    const vitalCapacity = document.getElementById('editStudentVital').value;
    const dentalCaries = document.getElementById('editStudentDental').value;
    const physicalTest = document.getElementById('editStudentPhysical').value;
    
    // 验证必填字段
    if (!id) {
        showNotification('学号不能为空', 'error');
        return;
    }
    if (!name) {
        showNotification('姓名不能为空', 'error');
        return;
    }
    if (!gender) {
        showNotification('性别不能为空', 'error');
        return;
    }
    
    // 创建更新的学生对象 - 使用下划线命名风格以与服务器保持一致
    const updatedStudent = {
        id,
        name,
        gender,
        class: studentClass,
        height: height || null,
        weight: weight || null,
        chest_circumference: chest || null,
        vision_left: visionLeft || null,
        vision_right: visionRight || null,
        vital_capacity: vitalCapacity || null,
        dental_caries: dentalCaries || '',
        physical_test_status: physicalTest || ''
    };
    
    console.log('待更新的学生数据:', updatedStudent);
    
    // 显示处理状态
    const saveBtn = document.querySelector('#editStudentModal .btn-primary');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 保存中...';
    }
    
    // 显示全局加载通知
    const loadingNotification = showNotification('正在保存学生信息...', 'loading');
    
    // 设置超时处理，确保按钮状态不会永久停留在"保存中"
    const resetTimeout = setTimeout(() => {
        // 如果5秒内没有收到响应，重置按钮状态
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '保存';
        }
        if (loadingNotification) {
            loadingNotification.close();
        }
        showNotification('保存操作超时，请重试', 'warning');
    }, 5000);
    
    // 使用服务器API更新学生信息
    fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedStudent)
    })
    .then(response => {
        console.log('服务器响应状态码:', response.status);
        console.log('服务器响应头:', [...response.headers.entries()]);
        
        // 尝试获取响应文本，以便查看原始响应
        return response.text().then(text => {
            console.log('原始响应内容:', text);
            
            // 清除超时定时器
            clearTimeout(resetTimeout);
            
            // 尝试将文本解析为JSON
            try {
                const data = text ? JSON.parse(text) : {};
                if (!response.ok) {
                    return Promise.reject(data.error || `服务器错误(${response.status}): ${response.statusText}`);
                }
                return data;
            } catch (e) {
                console.error('解析响应JSON时出错:', e);
                return Promise.reject(`无法解析服务器响应: ${e.message}\n原始响应: ${text}`);
            }
        });
    })
    .then(data => {
        console.log('更新学生成功，服务器响应:', data);
        
        // 关闭加载通知
        if (loadingNotification) {
            loadingNotification.close();
        }
        
        if (data.status === 'ok') {
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('editStudentModal'));
            if (modal) modal.hide();
            
            // 显示成功消息
            showNotification(data.message || '学生信息已更新', 'success');
            
            // 刷新学生列表
            loadStudentsFromServer();
        } else {
            // 服务器可能返回了非错误状态码但包含错误信息
            showNotification(data.message || '更新失败，请稍后重试', 'warning');
            
            // 恢复保存按钮状态
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '保存';
            }
        }
    })
    .catch(error => {
        console.error('更新学生出错:', error);
        
        // 清除超时定时器
        clearTimeout(resetTimeout);
        
        // 关闭加载通知
        if (loadingNotification) {
            loadingNotification.close();
        }
        
        // 显示错误消息
        showNotification(`更新学生信息出错: ${error}`, 'error');
        
        // 恢复保存按钮状态
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '保存';
        }
    });
}

// 删除学生
function deleteStudent(studentId) {
    if (confirm('确定要删除该学生吗？此操作不可恢复。')) {
        // 显示加载状态
        const loadingToast = showNotification('正在删除学生数据...', 'info', false);
        
        // 使用服务器API删除学生
        fetch(`/api/students/${studentId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            // 关闭加载提示
            if (loadingToast) {
                loadingToast.hide();
            }
            
            if (data.status === 'ok') {
                // 刷新学生列表
                loadStudentsFromServer();
                showNotification('学生删除成功');
            } else {
                showNotification('学生删除失败: ' + (data.message || '未知错误'), 'error');
            }
        })
        .catch(error => {
            console.error('删除学生时出错:', error);
            showNotification('删除学生时出错: ' + error.message, 'error');
            
            // 关闭加载提示
            if (loadingToast) {
                loadingToast.hide();
            }
        });
    }
}

// 检查服务器连接状态
function checkServerConnection() {
    console.log("检查后端服务器连接状态...");
    
    return fetch('http://localhost:8080/api/health', { 
        method: 'GET',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`服务器响应错误: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("服务器连接正常:", data);
        return true;
    })
    .catch(error => {
        console.error("服务器连接失败:", error);
        showNotification('无法连接到后端服务器，请确保服务器已启动', 'error');
        return false;
    });
}

// 处理文件导入
function handleFileImport(e) {
    const file = e.target?.files?.[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        showNotification('只支持Excel文件格式 (.xlsx, .xls)', 'error');
        return;
    }
    
    // 显示文件名
    const fileNameDisplay = document.getElementById('selectedFileName');
    if (fileNameDisplay) {
        fileNameDisplay.textContent = file.name;
    }
    
    // 启用确认导入按钮（导入预览成功后会再次启用）
    const confirmImportBtn = document.getElementById('confirmImport');
    if (confirmImportBtn) {
        confirmImportBtn.disabled = true;
    }
    
    // 上传文件进行预览
    uploadFileForPreview(file);
}

// 上传文件进行预览
function uploadFileForPreview(file) {
    const previewContainer = document.getElementById('previewContainer');
    if (!previewContainer) return;
    
    // 创建FormData对象
    const formData = new FormData();
    formData.append('file', file);
    
    // 显示上传中状态
    previewContainer.innerHTML = `
        <div class="text-center p-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">上传中...</span>
            </div>
            <p class="mt-3">正在上传并解析文件，请稍候...</p>
        </div>
    `;
    
    // 发送文件到服务器进行解析
    fetch('/api/import-students', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`服务器响应错误: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            previewContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class='bx bx-error-circle'></i> ${data.error}
                </div>
            `;
            return;
        }
        
        console.log('文件解析结果:', data);
        
        // 保存导入的学生数据到隐藏字段
        const importDataField = document.getElementById('importData');
        if (importDataField) {
            importDataField.value = JSON.stringify(data.students);
        }
        
        // 如果服务器返回了HTML预览，直接使用它
        if (data.html_preview) {
            previewContainer.innerHTML = data.html_preview;
            
            // 启用确认导入按钮
            const confirmImportBtn = document.getElementById('confirmImportBtn');
            if (confirmImportBtn) {
                confirmImportBtn.disabled = false;
            }
        } 
        // 否则使用旧的预览方式
        else if (data.students && data.students.length > 0) {
            showLegacyPreview(previewContainer, data);
        } 
        else {
            previewContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class='bx bx-info-circle'></i> 文件中没有找到有效的学生数据。
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('上传文件出错:', error);
        previewContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class='bx bx-error-circle'></i> 上传文件时出错: ${error.message}
            </div>
        `;
    });
}

// 显示遗留的预览方式（备用）
function showLegacyPreview(previewContainer, data) {
    const students = data.students;
    
    // 定义一个辅助函数来处理数值显示
    const displayNumericValue = (value) => {
        if (value === 0 || value === 0.0) {
            return '0';
        }
        return value !== null && value !== undefined ? value : '-';
    };
    
    // 创建表格预览
    let tableHtml = `
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>学号</th>
                        <th>姓名</th>
                        <th>性别</th>
                        <th>班级</th>
                        <th>身高(cm)</th>
                        <th>体重(kg)</th>
                        <th>胸围(cm)</th>
                        <th>肺活量(ml)</th>
                        <th>龋齿</th>
                        <th>视力左</th>
                        <th>视力右</th>
                        <th>体测情况</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // 生成表格行
    students.forEach(student => {
        tableHtml += `
            <tr>
                <td>${student.id || '-'}</td>
                <td>${student.name || '-'}</td>
                <td>${student.gender || '-'}</td>
                <td>${student.class || '-'}</td>
                <td>${displayNumericValue(student.height)}</td>
                <td>${displayNumericValue(student.weight)}</td>
                <td>${displayNumericValue(student.chest_circumference)}</td>
                <td>${displayNumericValue(student.vital_capacity)}</td>
                <td>${student.dental_caries || '-'}</td>
                <td>${displayNumericValue(student.vision_left)}</td>
                <td>${displayNumericValue(student.vision_right)}</td>
                <td>${student.physical_test_status || '-'}</td>
            </tr>
        `;
    });
    
    tableHtml += `
                </tbody>
            </table>
        </div>
        <div class="alert alert-info">
            <i class='bx bx-info-circle'></i> 共发现 ${students.length} 名学生数据，点击"确认导入"按钮完成导入。
        </div>
    `;
    
    previewContainer.innerHTML = tableHtml;
    
    // 启用确认导入按钮
    const confirmImportBtn = document.getElementById('confirmImportBtn');
    if (confirmImportBtn) {
        confirmImportBtn.disabled = false;
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
}

// 导入学生
function importStudents() {
    const students = JSON.parse(document.getElementById('importData').value || '[]');
    if (!students || students.length === 0) {
        showNotification('没有可导入的学生数据', 'error');
        return;
    }
    
    // 显示加载状态
    const importBtn = document.getElementById('confirmImportBtn');
    if (importBtn) {
        importBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 导入中...';
        importBtn.disabled = true;
    }
    
    console.log(`提交 ${students.length} 条学生记录进行导入...`);
    
    // 准备请求数据
    const requestData = {
        students: students
    };
    
    // 发送导入请求
    fetch('/api/confirm-import', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        console.log('服务器响应状态码:', response.status);
        return response.json().then(data => {
            if (!response.ok) {
                // 即使响应状态码不是2xx，我们也尝试解析响应体
                return Promise.reject(data);
            }
            return data;
        });
    })
    .then(data => {
        console.log('导入结果:', data);
        
        if (data.status === 'ok' || data.status === 'partial') {
            // 导入成功或部分成功
            let message = `成功导入 ${data.success_count} 名学生`;
            if (data.updated_count > 0) {
                message += `（更新 ${data.updated_count} 名，新增 ${data.inserted_count} 名）`;
            }
            
            // 显示通知
            showNotification(message, 'success');
            
            // 关闭模态框
            const importModal = bootstrap.Modal.getInstance(document.getElementById('importModal'));
            if (importModal) {
                importModal.hide();
            }
            
            // 清空导入数据
            document.getElementById('importData').value = '';
            document.getElementById('previewContainer').innerHTML = '';
            
            // 更新学生列表
            loadStudentsFromServer();
            
            // 通知其他模块学生数据已更改
            notifyStudentDataChanged();
            
            // 显示详细错误信息(如果有)
            if (data.error_count > 0 && data.error_details && data.error_details.length > 0) {
                console.warn('导入过程中发生以下错误:');
                data.error_details.forEach(error => console.warn(`- ${error}`));
                
                // 创建错误详情对话框
                const errorModal = new bootstrap.Modal(document.getElementById('errorDetailsModal') || createErrorModal());
                document.getElementById('errorDetailsList').innerHTML = data.error_details.map(err => `<li>${err}</li>`).join('');
                errorModal.show();
            }
        } else {
            // 导入失败
            showNotification(`导入失败: ${data.message}`, 'error');
        }
    })
    .catch(error => {
        console.error('导入学生时出错:', error);
        showNotification(`导入失败: ${error.message || '未知错误'}`, 'error');
    })
    .finally(() => {
        // 恢复按钮状态
        if (importBtn) {
            importBtn.innerHTML = '确认导入';
            importBtn.disabled = false;
        }
    });
}
    
// 下载Excel模板
function downloadTemplate() {
    console.log("开始下载Excel模板...");
    
    // 先检查服务器连接
    checkServerConnection().then(connected => {
        if (!connected) {
            return;
        }
        
        // 发送请求到服务器获取模板
        fetch('http://localhost:8080/api/template', {
            method: 'GET',
            mode: 'cors'
        })
        .then(response => {
            console.log("模板请求响应状态码:", response.status);
            if (!response.ok) {
                throw new Error(`服务器响应错误: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("模板请求返回数据:", data);
            
            if (data.error) {
                showNotification(data.error, 'error');
                return;
            }
            
            // 创建下载链接
            const a = document.createElement('a');
            a.href = 'http://localhost:8080' + data.template_url;
            a.download = 'student_template.xlsx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            showNotification('模板下载成功', 'success');
        })
        .catch(error => {
            console.error('下载模板时出错:', error);
            showNotification('下载模板时出错，请确保后端服务器已启动并且可以访问', 'error');
        });
    });
}

// 筛选学生
function filterStudents(keyword) {
    const studentCards = document.querySelectorAll('.student-card');
    const emptyState = document.getElementById('emptyState');
    
    keyword = keyword.toLowerCase();
    let visibleCount = 0;
    
    studentCards.forEach(card => {
        const name = card.querySelector('.student-name').textContent.toLowerCase();
        const id = card.querySelector('.student-id').textContent.toLowerCase();
        const parent = card.closest('.col-md-4');
        
        if (name.includes(keyword) || id.includes(keyword)) {
            parent.style.display = '';
            visibleCount++;
        } else {
            parent.style.display = 'none';
        }
    });
    
    // 显示或隐藏空状态
    if (visibleCount === 0 && emptyState) {
        emptyState.classList.remove('d-none');
    } else if (emptyState) {
        emptyState.classList.add('d-none');
    }
}

// 初始化学生导入功能
function initImportStudents() {
    console.log("初始化学生导入功能...");
    
    // 绑定文件选择事件
    const fileInput = document.getElementById('importFile');
    if (fileInput) {
        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                console.log("选择了文件:", file.name);
    
    // 检查文件类型
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
                    showNotification('请选择Excel文件(.xlsx或.xls格式)', 'error');
                    this.value = null;
        return;
                }
                
                // 上传文件预览
                uploadFileForPreview(file);
            }
        });
    }
    
    // 绑定模板下载按钮
    const downloadTemplateBtn = document.getElementById('downloadTemplate');
    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener('click', function() {
            downloadTemplate();
        });
    }
}

// 显示通知
function showNotification(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'bg-danger' : 'bg-success'} text-white`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="toast-header ${type === 'error' ? 'bg-danger' : 'bg-success'} text-white">
            <strong class="me-auto">${type === 'error' ? '错误' : '成功'}</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    // 添加到容器
    toastContainer.appendChild(toast);
    
    // 初始化toast
    const bsToast = new bootstrap.Toast(toast, {
        delay: 3000
    });
    
    // 显示toast
    bsToast.show();
    
    // 监听隐藏事件，移除DOM元素
    toast.addEventListener('hidden.bs.toast', function () {
        toast.remove();
    });
}

// 打开评语模态框
function openCommentModal(studentId) {
    // 显示加载状态
    const loadingToast = showNotification('正在加载学生评语数据...', 'info', false);
    
    // 从服务器获取学生数据
    fetch(`/api/students/${studentId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`服务器响应错误: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                showNotification(data.error, 'error');
                return;
            }
            
            const student = data.student;
            if (!student) {
                showNotification('未找到该学生信息', 'error');
                return;
            }
            
            // 设置学生信息
            document.getElementById('commentStudentId').value = student.id;
            document.getElementById('commentStudentName').textContent = student.name;
            
            // 获取学生评语
            fetch(`/api/comments/${studentId}`)
                .then(response => response.json())
                .then(commentData => {
                    const commentText = document.getElementById('commentContent');
                    if (commentData.status === 'ok' && commentData.comment) {
                        commentText.value = commentData.comment.content || '';
                    } else {
                        commentText.value = '';
                    }
                    
                    // 关闭加载提示
                    if (loadingToast) {
                        loadingToast.hide();
                    }
                    
                    // 显示模态框
                    const modal = new bootstrap.Modal(document.getElementById('commentModal'));
                    modal.show();
                })
                .catch(error => {
                    console.error('获取评语数据出错:', error);
                    showNotification('获取评语数据出错: ' + error.message, 'error');
                });
        })
        .catch(error => {
            console.error('获取学生数据出错:', error);
            showNotification('获取学生数据出错: ' + error.message, 'error');
        });
}

// 保存评语
function saveComment() {
    const studentId = document.getElementById('commentStudentId').value;
    const content = document.getElementById('commentContent').value;
    
    if (!studentId || !content) {
        showNotification('请输入评语内容', 'error');
        return;
    }
    
    // 创建评语对象
    const comment = {
        studentId,
        content,
        updateDate: formatDate(new Date())
    };
    
    // 显示处理状态
    const saveBtn = document.querySelector('#commentModal .btn-primary');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 保存中...';
    }
    
    // 使用服务器API保存评语
    fetch('/api/comments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(comment)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'ok') {
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('commentModal'));
            modal.hide();
            
            // 显示成功通知
            showNotification('评语保存成功');
            
            // 刷新学生列表以显示更新后的评语
            // 在实际应用中，如果性能要求高，可以只更新对应的评语卡片
            loadStudentsFromServer();
        } else {
            showNotification('评语保存失败: ' + (data.message || '未知错误'), 'error');
        }
    })
    .catch(error => {
        console.error('保存评语时出错:', error);
        showNotification('保存评语时出错: ' + error.message, 'error');
    })
    .finally(() => {
        // 恢复按钮状态
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '保存评语';
        }
    });
}

// 添加通知其他页面的函数
function notifyStudentDataChanged() {
    console.log('学生数据已变更，发送通知...');
    
    // 方法1: 通过localStorage触发storage事件
    const timestamp = Date.now();
    localStorage.setItem('studentDataChangeTimestamp', timestamp);
    
    // 方法2: 通过window.postMessage通知所有iframe
    if (window.parent && window.parent !== window) {
        try {
            // 通知父窗口
            window.parent.postMessage({
                type: 'studentDataChanged',
                timestamp: timestamp
            }, '*');
        } catch (e) {
            console.error('向父窗口发送消息失败:', e);
        }
    }
    
    // 如果在主页面，通知其他iframe
    if (window.frames && window.frames.length) {
        for (let i = 0; i < window.frames.length; i++) {
            try {
                window.frames[i].postMessage({
                    type: 'studentDataChanged',
                    timestamp: timestamp
                }, '*');
            } catch (e) {
                console.error('向iframe发送消息失败:', e);
            }
        }
    }
    
    // 方法3: 通过自定义事件
    if (window.eventBus) {
        const event = new CustomEvent('studentDataChanged', {
            detail: {
                timestamp: timestamp
            }
        });
        window.eventBus.dispatchEvent(event);
    }
    
    // 方法4: 尝试直接调用评语页面的刷新方法
    try {
        // 如果评语页面在iframe中
        const commentsFrame = document.querySelector('iframe[src*="comments.html"]');
        if (commentsFrame && commentsFrame.contentWindow && commentsFrame.contentWindow.refreshCommentList) {
            commentsFrame.contentWindow.refreshCommentList();
        }
    } catch (e) {
        console.error('直接调用评语页面刷新方法失败:', e);
    }
}

// 从服务器加载学生列表
function loadStudentsFromServer() {
    const cardsContainer = document.getElementById('studentCards');
    const emptyState = document.getElementById('emptyState');
    
    if (!cardsContainer) return;
    
    // 显示加载状态
    cardsContainer.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
            <p class="mt-2">正在加载学生数据...</p>
        </div>
    `;
    
    // 从服务器获取学生数据
    fetch('/api/students', {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`服务器响应错误: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            cardsContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <i class='bx bx-error-circle'></i> ${data.error}
                    </div>
                </div>
            `;
            return;
        }
        
        const students = data.students;
        
        // 检查是否有学生数据
        if (!students || students.length === 0) {
            cardsContainer.innerHTML = '';
            if (emptyState) {
                emptyState.classList.remove('d-none');
            }
            return;
        }
        
        // 隐藏空状态
        if (emptyState) {
            emptyState.classList.add('d-none');
        }
        
        // 渲染学生卡片
        cardsContainer.innerHTML = '';
        students.forEach(student => {
            const studentCard = createStudentCard(student);
            cardsContainer.appendChild(studentCard);
        });
        
        console.log(`已加载 ${students.length} 名学生数据`);
    })
    .catch(error => {
        console.error('加载学生数据时出错:', error);
        cardsContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class='bx bx-error-circle'></i> 加载学生数据时出错，请确保后端服务器已启动并且可以访问。错误详情: ${error.message}
                </div>
                <div class="alert alert-info">
                    <h5>排查步骤：</h5>
                    <ol>
                        <li>确认后端服务器正在运行</li>
                        <li>验证网络连接正常</li>
                        <li>检查浏览器控制台(F12)获取更多错误信息</li>
                        <li>尝试重新启动服务器和浏览器</li>
                    </ol>
                </div>
            </div>
        `;
    });
}

// 重置数据库函数
function resetDatabase() {
    if (!confirm('警告：这将删除所有学生数据并重置数据库！\n请确认是否继续？')) {
        return;
    }
    
    // 二次确认
    if (!confirm('再次确认：所有数据将被删除，但会先备份。确定继续吗？')) {
        return;
    }
    
    // 显示加载状态
    const resetBtn = document.getElementById('resetDatabaseBtn');
    if (resetBtn) {
        resetBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 重置中...';
        resetBtn.disabled = true;
    }
    
    // 发送重置请求
    fetch('/api/reset-database', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirm: true })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'ok') {
            // 重置成功
            showToast('成功', data.message, 'success');
            // 刷新页面
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            // 重置失败
            showToast('错误', data.message, 'error');
        }
    })
    .catch(error => {
        console.error('重置数据库出错:', error);
        showToast('错误', '重置数据库时出错，请查看控制台获取详细信息', 'error');
    })
    .finally(() => {
        // 恢复按钮状态
        if (resetBtn) {
            resetBtn.innerHTML = '重置数据库';
            resetBtn.disabled = false;
        }
    });
}

// 格式化日期为YYYY-MM-DD
function formatDate(date) {
    if (!date) return '';
    
    // 判断输入是否为Date对象
    if (!(date instanceof Date)) {
        try {
            // 尝试转换为Date对象
            date = new Date(date);
        } catch (e) {
            console.error('日期格式转换错误:', e);
            return '';
        }
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}
