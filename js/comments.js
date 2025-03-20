// @charset UTF-8
// 评语管理模块

// 控制是否使用服务器API（而不是本地存储）
const USE_SERVER_API = true; // 设置为true使用服务器API，false使用本地存储

// 全局变量存储评语模板
let commentTemplates = {
    study: [],
    physical: [],
    behavior: []
};
let currentStudentId = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('评语管理页面初始化...');
    
    // 初始化
    initialize();
});

// 初始化评语列表
function initCommentList() {
    console.log('初始化评语列表...');
    const startTime = performance.now();
    
    const commentCards = document.getElementById('commentCards');
    const emptyState = document.getElementById('emptyState');
    const commentsHeader = document.getElementById('commentsHeader');
    
    if (!commentCards) {
        console.error('无法找到评语卡片容器');
        return;
    }
    
    // 显示加载状态
    commentCards.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
            <p class="mt-2">正在加载数据...</p>
        </div>
    `;
    
    // 从服务器获取学生数据
    fetch('/api/students')
        .then(response => {
            if (!response.ok) {
                throw new Error(`服务器响应错误: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                commentCards.innerHTML = `
                    <div class="col-12">
                        <div class="alert alert-danger">
                            <i class='bx bx-error-circle'></i> ${data.error}
                        </div>
                    </div>
                `;
                return;
            }
            
            const students = data.students;
            // 获取有评语的学生数量
            const commentsCount = students.filter(student => student.comments).length;
            const exportSettings = dataService.getExportSettings();
            
            console.log(`从服务器获取学生数据:`, students.length, '条');
            console.log(`有评语的学生:`, commentsCount, '人');
            
            // 设置页面标题
            if (commentsHeader) {
                const className = exportSettings.className || (students.length > 0 ? students[0].class : '未设置');
                commentsHeader.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <h1 class="page-title">评语管理</h1>
                        <div class="text-muted">
                            <span>班级：${className}</span> | 
                            <span>班主任：${exportSettings.teacherName || '未设置'}</span> | 
                            <span>学生数：${students.length}</span> | 
                            <span>评语数：${commentsCount}</span>
                        </div>
                    </div>
                `;
            }
            
            // 使用文档片段减少DOM操作，提高性能
            const fragment = document.createDocumentFragment();
            
            // 显示空状态或评语卡片
            if (students.length === 0) {
                if (emptyState) emptyState.classList.remove('d-none');
                // 清空评语区域
                commentCards.innerHTML = '';
            } else {
                if (emptyState) emptyState.classList.add('d-none');
                
                // 按班级分组学生
                const studentsByClass = {};
                students.forEach(student => {
                    const className = student.class || '未分班';
                    if (!studentsByClass[className]) {
                        studentsByClass[className] = [];
                    }
                    studentsByClass[className].push(student);
                });
                
                // 展示已分组的学生
                commentCards.innerHTML = '';
                Object.keys(studentsByClass).sort().forEach(className => {
                    // 添加班级标题
                    const classTitle = document.createElement('div');
                    classTitle.className = 'col-12 mt-4 mb-2';
                    classTitle.innerHTML = `
                        <h4 class="class-title">
                            <i class='bx bx-group'></i> ${className}
                            <span class="badge bg-primary ms-2">${studentsByClass[className].length} 名学生</span>
                        </h4>
                        <hr>
                    `;
                    fragment.appendChild(classTitle);
                    
                    // 先对班级内的学生按学号排序
                    studentsByClass[className].sort((a, b) => {
                        return parseInt(a.id) - parseInt(b.id);
                    });
                    
                    // 添加该班级的学生卡片
                    studentsByClass[className].forEach(student => {
                        // 直接使用学生数据中的comments字段
                        const commentData = student.comments ? {
                            studentId: student.id,
                            content: student.comments,
                            updateDate: student.updated_at
                        } : null;
                        
                        const card = createCommentCard(student, commentData);
                        fragment.appendChild(card);
                    });
                });
                
                commentCards.appendChild(fragment);
            }
            
            const endTime = performance.now();
            console.log(`评语列表更新完成，用时: ${(endTime - startTime).toFixed(2)}ms`);
        })
        .catch(error => {
            console.error('加载学生数据时出错:', error);
            commentCards.innerHTML = `
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

// 创建评语卡片
function createCommentCard(student, commentData) {
    const col = document.createElement('div');
    col.className = 'col-md-3 col-lg-3 col-xl-1-5 mb-4';
    col.dataset.studentId = student.id; // 添加数据属性以便于实时更新
    
    // 处理评语数据（兼容旧版本和新版本）
    let comment;
    if (Array.isArray(commentData)) {
        // 旧版本：传入的是评语数组，需要查找指定学生的评语
        comment = commentData.find(c => c.studentId === student.id);
    } else {
        // 新版本：传入的是单个评语对象
        comment = commentData;
    }
    
    const commentContent = comment ? comment.content : '暂无评语';
    const updateDate = comment ? comment.updateDate : '';
    
    // 评语字数
    const commentLength = commentContent.length;
    
    // 设置字数的颜色 - 从绿色(接近0字)渐变到红色(接近200字)
    const maxLength = 200;
    const percentage = commentLength / maxLength; // 使用百分比来确定颜色
    let textColor = '';
    
    if (percentage < 0.5) {
        // 0-50%: 从绿色渐变到黄色
        const green = Math.floor(128 + (127 - 128) * (percentage * 2)); // 从128减小
        const red = Math.floor(40 + (255 - 40) * (percentage * 2));     // 从40增加到255
        textColor = `rgb(${red}, ${green}, 0)`;
    } else {
        // 50-100%: 从黄色渐变到红色
        const green = Math.floor(127 * (2 - percentage * 2)); // 从127减小到0
        const red = 255; // 一直保持255
        textColor = `rgb(${red}, ${green}, 0)`;
    }
    
    // 是否接近字数限制的警告
    const warningClass = percentage > 0.9 ? 'fw-bold' : '';
    
    col.innerHTML = `
        <div class="comment-card">
            <span class="card-badge ${student.gender === '男' ? 'male' : 'female'}">${student.gender}</span>
            <div class="student-info">
                <div class="student-avatar">
                    <i class='bx bx-user'></i>
                </div>
                <div class="student-details">
                    <h4>${student.name}</h4>
                    <div class="text-muted">学号: ${student.id}</div>
                    <div class="text-muted">班级: ${student.class || '未分班'}</div>
                </div>
            </div>
            <div class="comment-content mt-3">
                <div class="comment-text">${commentContent}</div>
                <div class="comment-date"><i class='bx bx-calendar'></i> ${updateDate || '未更新'}</div>
            </div>
            <div class="comment-card-footer">
                <div class="comment-stats">
                    <div class="comment-stat">
                        <i class='bx bx-text'></i> <span style="color: ${textColor}" class="${warningClass}">${commentLength}/${maxLength}</span> 字
                    </div>
                </div>
                <div>
                    <button class="btn btn-sm btn-primary" onclick="fillCommentForm('${student.id}', '${student.name}')">
                        <i class='bx bx-edit'></i> 编辑评语
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

// 填充评语表单
function fillCommentForm(studentId, studentName) {
    console.log('填充评语表单:', studentId, studentName);
    
    // 设置学生信息
    const modalStudentName = document.getElementById('modalStudentName');
    const modalStudentId = document.getElementById('modalStudentId');
    const commentText = document.getElementById('commentText');
    
    if (modalStudentName) modalStudentName.textContent = studentName;
    if (modalStudentId) modalStudentId.textContent = `学号: ${studentId}`;
    if (!commentText) return;
    
    // 存储学生ID，用于保存评语
    commentText.dataset.studentId = studentId;
    
    // 显示加载状态
    commentText.value = '加载中...';
    commentText.disabled = true;
    
    if (USE_SERVER_API) {
        // 从服务器获取评语数据
        fetch(`/api/comments/${studentId}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'ok' && data.comment) {
                    commentText.value = data.comment.content || '';
                } else {
                    commentText.value = '';
                }
            })
            .catch(error => {
                console.error('获取评语数据出错:', error);
                commentText.value = '';
            })
            .finally(() => {
                commentText.disabled = false;
                
                // 显示模态框
                const modal = new bootstrap.Modal(document.getElementById('editCommentModal'));
                modal.show();
                
                // 更新字数统计
                updateCharCount();
                
                // 聚焦到文本框
                commentText.focus();
                
                // 渲染评语模板按钮
                renderTemplateButtons('all');
            });
    } else {
        // 从本地存储获取评语数据
        const comment = dataService.getCommentByStudentId(studentId);
        commentText.value = comment ? comment.content : '';
        commentText.disabled = false;
        
        // 显示模态框
        const modal = new bootstrap.Modal(document.getElementById('editCommentModal'));
        modal.show();
        
        // 更新字数统计
        updateCharCount();
        
        // 聚焦到文本框
        commentText.focus();
        
        // 渲染评语模板按钮
        renderTemplateButtons('all');
    }
}

// 保存评语
function saveComment() {
    const commentText = document.getElementById('commentText');
    if (!commentText) return;
    
    const studentId = commentText.dataset.studentId;
    const content = commentText.value.trim();
    
    if (!studentId || !content) {
        showNotification('请输入评语内容', 'error');
        return;
    }
    
    // 检查评语字数是否超过限制
    const maxLength = 200;
    if (content.length > maxLength) {
        showNotification(`评语内容超过${maxLength}字限制，请编辑后重试`, 'error');
        return;
    }
    
    // 检查是否为添加模式
    const appendMode = document.getElementById('appendModeSwitch').checked;
    
    // 创建评语对象
    const commentData = {
        studentId,
        content,
        appendMode,
        updateDate: formatDate(new Date())
    };
    
    // 显示处理状态
    const saveBtn = document.querySelector('#editCommentModal .btn-primary');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 保存中...';
    }
    
    // 两种实现方式：
    // 1. 如果已实现服务器端API，则使用服务器端保存
    if (USE_SERVER_API) {
        // 发送到服务器
        fetch('/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(commentData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                // 关闭模态框
                const modal = bootstrap.Modal.getInstance(document.getElementById('editCommentModal'));
                modal.hide();
                
                // 实时更新评语卡片，使用服务器返回的更新后内容
                if (data.updatedContent) {
                    commentData.content = data.updatedContent;
                }
                updateCommentCard(studentId, commentData);
                
                // 显示成功通知
                showNotification('评语保存成功');
            } else {
                showNotification('评语保存失败: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('保存评语时出错:', error);
            showNotification('保存评语时出错，请查看控制台获取详细信息', 'error');
        })
        .finally(() => {
            // 恢复按钮状态
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '保存评语';
            }
        });
    } 
    // 2. 如果使用本地存储，则使用dataService
    else {
        // 保存评语
        const success = dataService.updateComment(commentData);
        
        if (success) {
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('editCommentModal'));
            modal.hide();
            
            // 实时更新评语卡片（无需刷新整个列表）
            updateCommentCard(studentId, commentData);
            
            // 显示成功通知
            showNotification('评语保存成功');
            
            // 触发自定义事件，通知评语已更新
            const event = new CustomEvent('commentUpdated', { 
                detail: { 
                    studentId, 
                    content, 
                    updateDate: commentData.updateDate 
                } 
            });
            document.dispatchEvent(event);
        } else {
            showNotification('评语保存失败', 'error');
        }
        
        // 恢复按钮状态
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '保存评语';
        }
    }
}

// 实时更新评语卡片
function updateCommentCard(studentId, comment) {
    // 查找对应的评语卡片
    const commentCard = document.querySelector(`[data-student-id="${studentId}"]`);
    if (!commentCard) return;
    
    // 更新评语内容
    const contentElement = commentCard.querySelector('.comment-text');
    if (contentElement) {
        contentElement.textContent = comment.content;
    }
    
    // 更新评语日期
    const dateElement = commentCard.querySelector('.comment-date');
    if (dateElement) {
        dateElement.innerHTML = `<i class='bx bx-calendar'></i> ${comment.updateDate || '未更新'}`;
    }
    
    // 更新评语字数和状态
    const commentLength = comment.content.length;
    let lengthColorClass = 'text-danger';
    if (commentLength >= 100) {
        lengthColorClass = 'text-success';
    } else if (commentLength >= 50) {
        lengthColorClass = 'text-warning';
    }
    
    const statElement = commentCard.querySelector('.comment-stat');
    if (statElement) {
        statElement.innerHTML = `
            <i class='bx bx-text'></i> ${commentLength} 字
            <span class="ms-1 ${lengthColorClass}">${commentLength < 50 ? '(字数不足)' : ''}</span>
        `;
    }
}

// 批量编辑功能实现
function showBatchEditModal() {
    console.log('显示批量编辑模态框');
    
    // 获取模态框元素
    const batchEditModal = document.getElementById('batchEditModal');
    const batchEditTable = document.getElementById('batchEditTable');
    
    if (!batchEditModal || !batchEditTable) {
        console.error('找不到批量编辑模态框或表格元素');
        showNotification('加载批量编辑界面失败', 'error');
        return;
    }
    
    // 显示加载状态
    batchEditTable.innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
                <p class="mt-2">正在加载学生数据...</p>
            </td>
        </tr>
    `;
    
    // 显示模态框
    const modal = new bootstrap.Modal(batchEditModal);
    modal.show();
    
    // 获取学生数据
    fetch('/api/students')
        .then(response => response.json())
        .then(data => {
            if (data.status !== 'ok' || !data.students || !data.students.length) {
                batchEditTable.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center py-4">
                            <div class="alert alert-warning mb-0">
                                <i class='bx bx-info-circle'></i> 没有可编辑的学生数据
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
            
            // 创建批量编辑表单
    batchEditTable.innerHTML = '';
    
            // 添加批量评语编辑行
            const contentRow = document.createElement('tr');
            contentRow.innerHTML = `
                <td colspan="4">
                    <div class="form-group mb-3">
                        <label class="form-label">批量评语内容</label>
                        <div class="input-group">
                            <textarea id="batchCommentText" class="form-control" rows="4" placeholder="请输入要添加到所选学生评语中的内容"></textarea>
                        </div>
                        <div class="form-text d-flex justify-content-between">
                            <span>字数限制: <span id="batchCommentCharCount">0/200</span></span>
                            <span class="text-muted">最多200字</span>
                        </div>
                    </div>
                    <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" id="batchAppendModeSwitch" checked>
                        <label class="form-check-label" for="batchAppendModeSwitch">添加到已有评语（关闭则替换原有评语）</label>
                    </div>
                    
                    <!-- 添加评语模板选择 -->
                    <div class="mb-3">
                        <label class="form-label">选择评语模板</label>
                        <div class="btn-group mb-2">
                            <button type="button" class="btn btn-sm btn-outline-secondary batch-template-filter active" data-filter="all">
                                全部
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-secondary batch-template-filter" data-filter="study">
                                学习
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-secondary batch-template-filter" data-filter="physical">
                                体育
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-secondary batch-template-filter" data-filter="behavior">
                                行为
                            </button>
                        </div>
                        <div id="batchTemplateContainer" class="d-flex flex-wrap">
                            <!-- 模板按钮将通过JavaScript动态加载 -->
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <label class="form-label m-0">选择学生</label>
                            <div>
                                <button type="button" class="btn btn-sm btn-outline-primary" id="selectAllStudentsBtn">全选</button>
                                <button type="button" class="btn btn-sm btn-outline-secondary" id="deselectAllStudentsBtn">取消全选</button>
                            </div>
                        </div>
                    </div>
                </td>
            `;
            batchEditTable.appendChild(contentRow);
            
            // 添加表头
            const headerRow = document.createElement('tr');
            headerRow.innerHTML = `
                <th width="5%"><input type="checkbox" id="selectAllCheckbox"></th>
                <th width="15%">学号</th>
                <th width="15%">姓名</th>
                <th width="65%">评语状态</th>
            `;
            batchEditTable.appendChild(headerRow);
            
            // 显示学生信息
            data.students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>
                        <input type="checkbox" class="student-checkbox" data-student-id="${student.id}">
                    </td>
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>
                        <small class="text-muted">${student.comments ? '已有评语' : '无评语'}</small>
            </td>
        `;
        batchEditTable.appendChild(row);
    });
    
            // 初始化模板筛选器
            const templateFilters = document.querySelectorAll('.batch-template-filter');
            templateFilters.forEach(filter => {
                filter.addEventListener('click', function() {
                    const filterType = this.dataset.filter;
                    templateFilters.forEach(f => f.classList.remove('active'));
                    this.classList.add('active');
                    renderBatchTemplateButtons(filterType);
                });
            });
            
            // 初始化模板按钮
            renderBatchTemplateButtons('all');
            
            // 绑定全选/取消全选按钮
            const selectAllCheckbox = document.getElementById('selectAllCheckbox');
            if (selectAllCheckbox) {
                selectAllCheckbox.addEventListener('change', function() {
                    const checkboxes = document.querySelectorAll('.student-checkbox');
                    checkboxes.forEach(cb => {
                        cb.checked = this.checked;
                    });
                });
            }
            
            // 绑定全选/取消全选按钮
            const selectAllBtn = document.getElementById('selectAllStudentsBtn');
            const deselectAllBtn = document.getElementById('deselectAllStudentsBtn');
            
            if (selectAllBtn) {
                selectAllBtn.addEventListener('click', function() {
                    const checkboxes = document.querySelectorAll('.student-checkbox');
                    checkboxes.forEach(cb => {
                        cb.checked = true;
                    });
                    if (selectAllCheckbox) selectAllCheckbox.checked = true;
                });
            }
            
            if (deselectAllBtn) {
                deselectAllBtn.addEventListener('click', function() {
                    const checkboxes = document.querySelectorAll('.student-checkbox');
                    checkboxes.forEach(cb => {
                        cb.checked = false;
                    });
                    if (selectAllCheckbox) selectAllCheckbox.checked = false;
                });
            }
        })
        .catch(error => {
            console.error('获取学生数据时出错:', error);
            batchEditTable.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4">
                        <div class="alert alert-danger mb-0">
                            <i class='bx bx-error-circle'></i> 加载数据时出错: ${error.message}
                        </div>
                    </td>
                </tr>
            `;
        });
}

// 渲染批量编辑页面的模板按钮
function renderBatchTemplateButtons(filter) {
    const templateContainer = document.getElementById('batchTemplateContainer');
    if (!templateContainer) return;
    
    // 清空容器
    templateContainer.innerHTML = '';
    
    // 根据过滤条件添加按钮
    const addTemplates = (templates, category) => {
        if (!templates || !Array.isArray(templates)) {
            console.warn(`模板类别 ${category} 不存在或不是数组`);
            return;
        }
        
        if (filter === 'all' || filter === category) {
            templates.forEach(template => {
                // 安全检查：确保模板对象有效
                if (!template) {
                    console.warn(`在类别 ${category} 中发现无效的模板`);
                    return;
                }
                
                const content = template.content || '';
                const title = template.title || '';
                
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-sm btn-outline-primary m-1';
                
                // 安全获取按钮文本
                if (title) {
                    btn.textContent = title;
                } else if (content) {
                    // 如果内容太长，截取前15个字符并添加省略号
                    btn.textContent = content.substring(0, 15) + (content.length > 15 ? '...' : '');
                } else {
                    btn.textContent = '空模板';
                }
                
                btn.dataset.content = content;
                btn.addEventListener('click', () => {
                    // 将模板内容插入到批量评语文本框
                    const batchCommentText = document.getElementById('batchCommentText');
                    if (batchCommentText) {
                        // 在光标位置插入模板内容
                        const startPos = batchCommentText.selectionStart;
                        const endPos = batchCommentText.selectionEnd;
                        const currentContent = batchCommentText.value;
                        
                        // 直接在光标位置插入，不添加额外空格或换行
                        const newContent = currentContent.substring(0, startPos) + content + currentContent.substring(endPos);
                        batchCommentText.value = newContent;
                        
                        // 更新光标位置
                        const newCursorPos = startPos + content.length;
                        batchCommentText.setSelectionRange(newCursorPos, newCursorPos);
                        
                        // 聚焦输入框
                        batchCommentText.focus();
                    }
                });
                templateContainer.appendChild(btn);
            });
        }
    };
    
    // 添加各类模板
    addTemplates(commentTemplates.study, 'study');
    addTemplates(commentTemplates.physical, 'physical');
    addTemplates(commentTemplates.behavior, 'behavior');
}

// 批量保存评语
function saveBatchComments() {
    console.log('执行批量保存评语操作');
    
    // 防止重复提交
    const saveBtn = document.getElementById('saveBatchBtn');
    if (saveBtn && saveBtn.disabled) {
        console.log('保存按钮已禁用，防止重复提交');
        return;
    }

    const batchCommentText = document.getElementById('batchCommentText');
    const batchAppendModeSwitch = document.getElementById('batchAppendModeSwitch');
    
    if (!batchCommentText) {
        showNotification('找不到批量评语输入框', 'error');
        return;
    }
    
    const content = batchCommentText.value.trim();
    
    if (!content) {
        showNotification('请输入评语内容', 'error');
        return;
    }
    
    // 检查批量评语字数是否超过限制
    const maxLength = 200;
    if (content.length > maxLength) {
        showNotification(`批量评语内容超过${maxLength}字限制，请编辑后重试`, 'error');
        return;
    }
    
    // 获取选中的学生
    const selectedStudents = [];
    const checkboxes = document.querySelectorAll('.student-checkbox:checked');
    checkboxes.forEach(cb => {
        selectedStudents.push(cb.dataset.studentId);
    });
    
    if (selectedStudents.length === 0) {
        showNotification('请至少选择一名学生', 'error');
        return;
    }
    
    // 获取追加模式状态
    const appendMode = batchAppendModeSwitch ? batchAppendModeSwitch.checked : true;
    
    // 显示处理状态
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 保存中...';
    }
    
    // 调用批量更新API
    fetch('/api/batch-update-comments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content: content,
            appendMode: appendMode,
            studentIds: selectedStudents  // 添加选中的学生ID列表
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'ok') {
    // 关闭模态框
    const modal = bootstrap.Modal.getInstance(document.getElementById('batchEditModal'));
    modal.hide();
            
            // 显示成功通知
            showNotification(`${data.message}`);
    
    // 刷新评语列表
    initCommentList();
    } else {
            showNotification('批量更新失败: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('批量更新评语时出错:', error);
        showNotification('批量更新评语时出错，请查看控制台获取详细信息', 'error');
    })
    .finally(() => {
        // 恢复按钮状态
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '批量保存';
        }
    });
}

// 筛选评语
function filterComments(keyword) {
    const commentCards = document.getElementById('commentCards').children;
    const emptyState = document.getElementById('emptyState');
    
    keyword = keyword.toLowerCase();
    let visibleCount = 0;
    
    // 遍历所有评语卡片
    for (let i = 0; i < commentCards.length; i++) {
        const card = commentCards[i];
        if (card.id === 'emptyState') continue;
        
        const studentName = card.querySelector('.student-name').textContent.toLowerCase();
        const studentId = card.querySelector('.student-id').textContent.toLowerCase();
        const commentContent = card.querySelector('.comment-content').textContent.toLowerCase();
        
        // 检查是否匹配关键字
        if (studentName.includes(keyword) || studentId.includes(keyword) || commentContent.includes(keyword)) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    }
    
    // 显示或隐藏空状态
    if (visibleCount === 0 && emptyState) {
        emptyState.classList.remove('d-none');
    } else if (emptyState) {
        emptyState.classList.add('d-none');
    }
}

// 显示打印预览
function showPrintPreview() {
    console.log('显示打印预览');
    
    // 获取预览模态框元素
    const previewModal = document.getElementById('printPreviewModal');
    const previewContent = document.getElementById('previewContent');
    
    if (!previewModal || !previewContent) {
        showNotification('找不到预览模态框或内容元素', 'error');
        return;
    }
    
    // 显示加载状态
    previewContent.innerHTML = `
        <div class="d-flex justify-content-center align-items-center p-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
            <p class="ms-3 mb-0">正在生成预览...</p>
        </div>
    `;
    
    // 显示模态框
    const modal = new bootstrap.Modal(previewModal);
    modal.show();
    
    // 创建iframe来加载预览内容
    const previewFrame = document.createElement('iframe');
    previewFrame.style.width = '100%';
    previewFrame.style.height = '100%';
    previewFrame.style.border = 'none';
    previewFrame.className = 'preview-frame';
    
    // 在iframe加载完成后处理打印按钮
    previewFrame.onload = function() {
        // 绑定打印按钮
        const printBtn = document.getElementById('printBtn');
        if (printBtn) {
            printBtn.onclick = function() {
                previewFrame.contentWindow.print();
            };
        }
        
        // 给iframe添加消息监听器，以接收加载完成通知
        window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'previewLoaded') {
                console.log('预览加载完成', event.data.timestamp);
                // 这里可以执行预览加载完成后的操作
            } else if (event.data && event.data.type === 'previewError') {
                console.error('预览加载出错', event.data.error);
                showNotification('预览生成失败: ' + event.data.error, 'error');
            }
        });
    };
    
    // 清空预览内容并添加iframe
    previewContent.innerHTML = '';
    previewContent.appendChild(previewFrame);
    
    // 直接设置iframe的src为预览API
    previewFrame.src = '/api/preview-comments';
    
    // 错误处理
    previewFrame.onerror = function() {
        previewContent.innerHTML = `
            <div class="alert alert-danger m-5">
                <h4 class="alert-heading">加载预览失败</h4>
                <p>无法连接到服务器或服务器返回错误。请稍后再试。</p>
            </div>
        `;
        showNotification('加载预览失败，请稍后再试', 'error');
    };
}

// 导出评语为PDF
function exportComments() {
    console.log('导出评语为PDF');
    
    // 显示加载通知
    showNotification('正在生成PDF...', 'info', 0);
    
    // 获取班级信息（可选）
    const exportSettings = dataService.getExportSettings();
    const className = exportSettings.className || '';
    
    // 构建请求URL
    const queryString = className ? `?class=${encodeURIComponent(className)}` : '';
    
    // 调用导出API
    fetch(`/api/export-comments-pdf${queryString}`)
        .then(response => response.json())
        .then(data => {
            // 关闭加载通知
            const toastContainer = document.getElementById('toastContainer');
            if (toastContainer) {
                const toasts = toastContainer.querySelectorAll('.toast');
                toasts.forEach(toast => {
                    const bsToast = bootstrap.Toast.getInstance(toast);
                    if (bsToast) bsToast.hide();
                });
            }
            
            if (data.status === 'ok') {
                // 显示成功通知
                showNotification('PDF生成成功，正在下载...');
                
                // 创建下载链接
                const downloadLink = document.createElement('a');
                downloadLink.href = data.download_url;
                downloadLink.download = data.download_url.split('/').pop();
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            } else {
                showNotification('导出PDF失败: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('导出PDF时出错:', error);
            showNotification('导出PDF时出错，请查看控制台获取详细信息', 'error');
    });
}

// 导入docx库
async function importDocxLibrary() {
    // 如果已经加载了docx库，直接返回
    if (window.docx) {
        return window.docx;
    }
    
    // 否则动态加载docx库
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/docx@7.8.2/build/index.js';
        script.onload = () => {
            if (window.docx) {
                resolve(window.docx);
            } else {
                reject(new Error('加载docx库失败'));
            }
        };
        script.onerror = () => {
            reject(new Error('加载docx库失败'));
        };
        document.head.appendChild(script);
    });
}

// 格式化日期
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 更新字数统计
function updateCharCount() {
    const commentText = document.getElementById('commentText');
    const charCount = document.getElementById('commentCharCount');
    const batchCommentText = document.getElementById('batchCommentText');
    const batchCharCount = document.getElementById('batchCommentCharCount');
    
    if (commentText && charCount) {
        const maxLength = 200; // 最大字数限制
        const count = commentText.value.length;
        charCount.textContent = `${count}/${maxLength}`;
        
        // 限制输入字数
        if (count > maxLength) {
            commentText.value = commentText.value.substring(0, maxLength);
            charCount.textContent = `${maxLength}/${maxLength}`;
        }
        
        // 根据字数改变颜色提示 - 从绿色(接近0字)渐变到红色(接近200字)
        const percentage = count / maxLength; // 使用百分比来确定颜色
        
        if (percentage < 0.5) {
            // 0-50%: 从绿色渐变到黄色
            const green = Math.floor(128 + (127 - 128) * (percentage * 2)); // 从128减小
            const red = Math.floor(40 + (255 - 40) * (percentage * 2));     // 从40增加到255
            charCount.style.color = `rgb(${red}, ${green}, 0)`;
        } else {
            // 50-100%: 从黄色渐变到红色
            const green = Math.floor(127 * (2 - percentage * 2)); // 从127减小到0
            const red = 255; // 一直保持255
            charCount.style.color = `rgb(${red}, ${green}, 0)`;
        }
        
        // 如果接近限制，添加警告效果
        if (percentage > 0.9) {
            charCount.classList.add('fw-bold');
        } else {
            charCount.classList.remove('fw-bold');
        }
    }
    
    if (batchCommentText && batchCharCount) {
        const maxLength = 200; // 最大字数限制
        const count = batchCommentText.value.length;
        batchCharCount.textContent = `${count}/${maxLength}`;
        
        // 限制输入字数
        if (count > maxLength) {
            batchCommentText.value = batchCommentText.value.substring(0, maxLength);
            batchCharCount.textContent = `${maxLength}/${maxLength}`;
        }
        
        // 根据字数改变颜色提示 - 从绿色(接近0字)渐变到红色(接近200字)
        const percentage = count / maxLength; // 使用百分比来确定颜色
        
        if (percentage < 0.5) {
            // 0-50%: 从绿色渐变到黄色
            const green = Math.floor(128 + (127 - 128) * (percentage * 2)); // 从128减小
            const red = Math.floor(40 + (255 - 40) * (percentage * 2));     // 从40增加到255
            batchCharCount.style.color = `rgb(${red}, ${green}, 0)`;
        } else {
            // 50-100%: 从黄色渐变到红色
            const green = Math.floor(127 * (2 - percentage * 2)); // 从127减小到0
            const red = 255; // 一直保持255
            batchCharCount.style.color = `rgb(${red}, ${green}, 0)`;
        }
        
        // 如果接近限制，添加警告效果
        if (percentage > 0.9) {
            batchCharCount.classList.add('fw-bold');
        } else {
            batchCharCount.classList.remove('fw-bold');
        }
    }
}

// 过滤模板显示
function filterTemplates(filter) {
    const templateButtons = document.querySelectorAll('.template-button');
    
    templateButtons.forEach(btn => {
        const category = btn.dataset.category;
        
        if (filter === 'all' || filter === category) {
            btn.style.display = '';
        } else {
            btn.style.display = 'none';
        }
    });
}

// 显示模板管理模态框
function showTemplateModal() {
    // 加载模板数据
    loadTemplates();
    
    // 显示模态框
    const templateModal = new bootstrap.Modal(document.getElementById('templateModal'));
    templateModal.show();
}

// 加载模板数据
function loadTemplates() {
    // 获取模板列表容器
    const studyList = document.getElementById('studyTemplateList');
    const physicalList = document.getElementById('physicalTemplateList');
    const behaviorList = document.getElementById('behaviorTemplateList');
    
    // 清空容器
    if (studyList) studyList.innerHTML = '';
    if (physicalList) physicalList.innerHTML = '';
    if (behaviorList) behaviorList.innerHTML = '';
    
    // 填充学习类模板
    if (studyList) {
        commentTemplates.study.forEach(template => {
            const item = createTemplateItem(template, 'study');
            studyList.appendChild(item);
        });
    }
    
    // 填充体育类模板
    if (physicalList) {
        commentTemplates.physical.forEach(template => {
            const item = createTemplateItem(template, 'physical');
            physicalList.appendChild(item);
        });
    }
    
    // 填充行为类模板
    if (behaviorList) {
        commentTemplates.behavior.forEach(template => {
            const item = createTemplateItem(template, 'behavior');
            behaviorList.appendChild(item);
        });
    }
}

// 创建模板项
function createTemplateItem(template, category) {
    const item = document.createElement('div');
    item.className = 'list-group-item d-flex justify-content-between align-items-center';
    item.innerHTML = `
        <span>${template}</span>
        <div>
            <button class="btn btn-sm btn-outline-danger delete-template" data-template="${template}" data-category="${category}">
                <i class='bx bx-trash'></i>
            </button>
        </div>
    `;
    
    // 绑定删除按钮事件
    const deleteBtn = item.querySelector('.delete-template');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            deleteTemplate(this.dataset.template, this.dataset.category);
        });
    }
    
    return item;
}

// 添加模板
function addTemplate() {
    const templateText = document.getElementById('newTemplateText');
    const categorySelect = document.getElementById('newTemplateCategory');
    
    if (!templateText || !categorySelect) return;
    
    const text = templateText.value.trim();
    const category = categorySelect.value;
    
    if (!text) {
        showNotification('请输入模板内容', 'error');
        return;
    }
    
    // 检查是否已存在相同模板
    if (commentTemplates[category].includes(text)) {
        showNotification('该模板已存在', 'error');
        return;
    }
    
    // 添加模板
    commentTemplates[category].push(text);
    
    // 重新加载模板列表
    loadTemplates();
    
    // 更新编辑模态框中的模板按钮
    updateTemplateButtons();
    
    // 清空输入框
    templateText.value = '';
    
    showNotification('模板添加成功');
}

// 删除模板
function deleteTemplate(template, category) {
    // 确认删除
    if (!confirm('确定要删除此模板吗？')) return;
    
    // 从数组中移除模板
    const index = commentTemplates[category].indexOf(template);
    if (index !== -1) {
        commentTemplates[category].splice(index, 1);
    }
    
    // 重新加载模板列表
    loadTemplates();
    
    // 更新编辑模态框中的模板按钮
    updateTemplateButtons();
    
    showNotification('模板删除成功');
}

// 更新编辑模态框中的模板按钮
function updateTemplateButtons() {
    // 获取模板容器
    const templateContainer = document.querySelector('.template-container');
    if (!templateContainer) return;
    
    // 清空容器
    templateContainer.innerHTML = '';
    
    // 根据过滤条件添加按钮
    const addTemplates = (templates, category) => {
        if (!templates || !Array.isArray(templates)) {
            console.warn(`模板类别 ${category} 不存在或不是数组`);
            return;
        }
        
        if (filter === 'all' || filter === category) {
            templates.forEach(template => {
                // 安全检查：确保模板对象有效
                if (!template) {
                    console.warn(`在类别 ${category} 中发现无效的模板`);
                    return;
                }
                
                const content = template.content || '';
                const title = template.title || '';
                
        const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-sm btn-outline-primary m-1';
                
                // 安全获取按钮文本
                if (title) {
                    btn.textContent = title;
                } else if (content) {
                    // 如果内容太长，截取前15个字符并添加省略号
                    btn.textContent = content.substring(0, 15) + (content.length > 15 ? '...' : '');
                } else {
                    btn.textContent = '空模板';
                }
                
                btn.dataset.content = content;
                btn.addEventListener('click', () => {
                    insertTemplate(content);
        });
        templateContainer.appendChild(btn);
    });
        }
    };
    
    // 添加各类模板
    addTemplates(commentTemplates.study, 'study');
    addTemplates(commentTemplates.physical, 'physical');
    addTemplates(commentTemplates.behavior, 'behavior');
}

// 显示通知
function showNotification(message, type = 'success') {
    // 创建一个toast元素
    const toastId = `toast-${Date.now()}`;
    const toast = document.createElement('div');
    toast.className = `toast align-items-center border-0 ${type === 'error' ? 'bg-danger' : type === 'info' ? 'bg-info' : 'bg-success'} text-white`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.id = toastId;
    
    // 设置Toast内容
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="bx ${type === 'error' ? 'bx-error-circle' : type === 'info' ? 'bx-info-circle' : 'bx-check-circle'} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="关闭"></button>
        </div>
    `;
    
    // 将Toast添加到容器
    const toastContainer = document.getElementById('toastContainer');
    if (toastContainer) {
        toastContainer.appendChild(toast);
    } else {
        // 如果没有容器，创建一个并添加到body
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
        container.appendChild(toast);
    }
    
    // 监听隐藏事件，从DOM移除元素
    toast.addEventListener('hidden.bs.toast', function() {
        document.getElementById(toastId)?.remove();
    });
    
    // 显示Toast
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();
}

// 修改学生操作函数，添加跨页面通信
// 当在学生管理页面做出更改后，通知评语管理页面更新
function notifyStudentDataChanged() {
    console.log('学生数据已变更，发送通知...');
    
    // 方法1: 通过localStorage触发storage事件
    const timestamp = Date.now();
    localStorage.setItem('studentDataChangeTimestamp', timestamp);
    
    // 方法2: 通过window.postMessage通知所有iframe
    if (window.frames && window.frames.length) {
        for (let i = 0; i <window.frames.length; i++) {
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
    
    // 方法4: 直接调用页面上的刷新方法
    try {
        if (window.refreshCommentList) {
            window.refreshCommentList();
        }
        
        // 如果评语页面在iframe中
        const commentsFrame = document.querySelector('iframe[src*="comments.html"]');
        if (commentsFrame && commentsFrame.contentWindow && commentsFrame.contentWindow.refreshCommentList) {
            commentsFrame.contentWindow.refreshCommentList();
        }
    } catch (e) {
        console.error('直接调用刷新方法失败:', e);
    }
}

// 加载评语模板
function loadCommentTemplates() {
    console.log('加载评语模板...');
    
    fetch('/api/comment-templates')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok' && data.templates) {
                // 分类存储模板
                commentTemplates = {
                    study: [],
                    physical: [],
                    behavior: []
                };
                
                // 将模板按类型分类
                data.templates.forEach(template => {
                    if (!template || !template.content) return;
                    
                    const content = template.content;
                    const title = template.title || '';
                    
                    // 根据模板类型添加到对应分类
                    if (template.type === 'study') {
                        commentTemplates.study.push({ title, content });
                    } else if (template.type === 'physical') {
                        commentTemplates.physical.push({ title, content });
                    } else if (template.type === 'behavior') {
                        commentTemplates.behavior.push({ title, content });
                    }
                });
                
                console.log('评语模板加载完成:', commentTemplates);
            } else {
                console.error('获取评语模板失败:', data.message || '未知错误');
            }
        })
        .catch(error => {
            console.error('加载评语模板出错:', error);
        });
}

// 渲染模板按钮
function renderTemplateButtons(filter) {
    const templateContainer = document.getElementById('templateContainer');
    if (!templateContainer) return;
    
    // 清空容器
    templateContainer.innerHTML = '';
    
    // 根据过滤条件添加按钮
    const addTemplates = (templates, category) => {
        if (!templates || !Array.isArray(templates)) {
            console.warn(`模板类别 ${category} 不存在或不是数组`);
            return;
        }
        
        if (filter === 'all' || filter === category) {
            templates.forEach(template => {
                // 安全检查：确保模板对象有效
                if (!template) {
                    console.warn(`在类别 ${category} 中发现无效的模板`);
                    return;
                }
                
                const content = template.content || '';
                const title = template.title || '';
                
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-sm btn-outline-primary m-1';
                
                // 安全获取按钮文本
                if (title) {
                    btn.textContent = title;
                } else if (content) {
                    // 如果内容太长，截取前15个字符并添加省略号
                    btn.textContent = content.substring(0, 15) + (content.length > 15 ? '...' : '');
                } else {
                    btn.textContent = '空模板';
                }
                
                btn.dataset.content = content;
                btn.addEventListener('click', () => {
                    insertTemplate(content);
                });
                templateContainer.appendChild(btn);
            });
        }
    };
    
    // 添加各类模板
    addTemplates(commentTemplates.study, 'study');
    addTemplates(commentTemplates.physical, 'physical');
    addTemplates(commentTemplates.behavior, 'behavior');
}

// 插入模板内容到评语编辑框
function insertTemplate(content) {
    const commentText = document.getElementById('commentText');
    if (!commentText) return;
    
    // 在光标位置插入模板内容
    const startPos = commentText.selectionStart;
    const endPos = commentText.selectionEnd;
    const currentContent = commentText.value;
    
    // 直接在光标位置插入，不添加额外空格或换行
    const newContent = currentContent.substring(0, startPos) + content + currentContent.substring(endPos);
    commentText.value = newContent;
    
    // 更新光标位置
    const newCursorPos = startPos + content.length;
    commentText.setSelectionRange(newCursorPos, newCursorPos);
    
    // 聚焦到文本框
    commentText.focus();
    
    // 更新字数统计
    updateCharCount();
}

// 显示模板选择器模态框
function showTemplateSelectorModal() {
    const modal = new bootstrap.Modal(document.getElementById('templateSelectorModal'));
    modal.show();
}

// 初始化评语数据
function initialize() {
    // 加载评语模板
    loadCommentTemplates();
    
    // 初始化评语列表
    initCommentList();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 绑定搜索事件
    const searchInput = document.getElementById('searchStudent');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterComments(this.value);
        });
    }
}

// 绑定事件监听器
function bindEventListeners() {
    // 编辑评语按钮点击事件
    $(document).on('click', '.edit-comment-btn', function() {
        const studentId = $(this).data('student-id');
        const comment = $(this).data('comment');
        
        // 设置学生信息和评语内容
        const studentName = $(this).closest('.card').find('.student-name').text();
        $('#modalStudentName').text(studentName);
        $('#modalStudentId').text('学号: ' + studentId);
        $('#commentText').val(comment || '');
        
        // 清空AI评语生成区域的输入
        $('#personalityInput').val('');
        $('#studyPerformanceInput').val('');
        $('#hobbiesInput').val('');
        $('#improvementInput').val('');
        
        // 重置添加模式开关
        $('#appendModeSwitch').prop('checked', false);
        
        // 更新字数统计
        updateCharCount();
        
        // 存储当前学生ID
        currentStudentId = studentId;
        
        // 显示模态框
        $('#editCommentModal').modal('show');
    });
    
    // 保存评语按钮事件
    $('#saveCommentBtn').on('click', function() {
        saveComment();
    });
    
    // 批量编辑按钮事件
    $('#batchEditBtn').on('click', function() {
        showBatchEditModal();
    });
    
    // 批量保存按钮事件
    $('#saveBatchBtn').on('click', function() {
        saveBatchComments();
    });
    
    // 导出评语按钮事件
    $('#exportCommentsBtn').on('click', function() {
        exportComments();
    });
    
    // 打印预览按钮事件
    $('#printPreviewBtn').on('click', function() {
        showPrintPreview();
    });
    
    // 管理模板按钮事件
    $('#manageTemplatesBtn').on('click', function() {
        showTemplateModal();
    });
    
    // 添加模板按钮事件
    $('#addTemplateBtn').on('click', function() {
        addTemplate();
    });
    
    // 模板分类筛选按钮事件
    $('.template-filter').on('click', function() {
        const filter = $(this).data('filter');
        filterTemplates(filter);
        
        // 更新活动状态
        $('.template-filter').removeClass('active');
        $(this).addClass('active');
    });
    
    // 监听评语文本框输入事件，更新字数统计
    $('#commentText').on('input', function() {
        updateCharCount();
    });
    
    // AI评语生成按钮点击事件
    $('#generateCommentBtn').on('click', function() {
        // 显示生成状态
        $('#generationStatus').removeClass('d-none');
        
        // 获取参数
        const params = {
            student_id: currentStudentId,
            personality: $('#personalityInput').val(),
            study_performance: $('#studyPerformanceInput').val(),
            hobbies: $('#hobbiesInput').val(),
            improvement: $('#improvementInput').val(),
            style: $('#styleSelect').val(),
            tone: $('#toneSelect').val(),
            max_length: parseInt($('#maxLengthSelect').val())
        };
        
        // 调用API生成评语
        fetch('/api/generate-comment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        })
        .then(response => response.json())
        .then(data => {
            // 隐藏生成状态
            $('#generationStatus').addClass('d-none');
            
            if (data.status === 'success') {
                // 如果是添加模式，则在现有评语后添加
                if ($('#appendModeSwitch').is(':checked')) {
                    const currentText = $('#commentText').val();
                    if (currentText && !currentText.endsWith('\n')) {
                        $('#commentText').val(currentText + '\n' + data.comment);
                    } else {
                        $('#commentText').val(currentText + data.comment);
                    }
                } else {
                    // 否则直接替换
                    $('#commentText').val(data.comment);
                }
                
                // 更新字数统计
                updateCharCount();
                
                // 折叠AI评语助手区域
                $('#aiGeneratorCollapse').collapse('hide');
                
                // 显示成功消息
                showToast('评语生成成功！', 'success');
            } else {
                // 显示错误消息
                showToast(`生成失败: ${data.message}`, 'error');
            }
        })
        .catch(error => {
            // 隐藏生成状态
            $('#generationStatus').addClass('d-none');
            console.error('Error generating comment:', error);
            showToast('生成评语时出错，请重试', 'error');
        });
    });

    // 显示/隐藏生成状态的监听
    $('#aiGeneratorCollapse').on('hidden.bs.collapse', function () {
        // 隐藏生成状态
        $('#generationStatus').addClass('d-none');
    });
}

// 显示提示信息
function showToast(message, type = 'info') {
    const toastClass = type === 'error' ? 'bg-danger' : 
                      type === 'success' ? 'bg-success' : 'bg-info';
    
    const toastHtml = `
        <div class="toast ${toastClass} text-white" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    const $toast = $(toastHtml);
    $('#toastContainer').append($toast);
    
    $toast.toast({
        delay: 3000,
        autohide: true
    });
    
    $toast.toast('show');
    
    // 自动移除
    $toast.on('hidden.bs.toast', function() {
        $(this).remove();
    });
}