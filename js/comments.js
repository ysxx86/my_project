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

// 添加DOM监控，确保按钮事件始终有效
function monitorDOMChanges() {
    console.log('开始监控DOM变化...');
    
    // 直接绑定事件，不依赖于jQuery或DOM观察器
    setInterval(function() {
        const saveBtn = document.getElementById('saveCommentBtn');
        if (saveBtn && !saveBtn.hasAttribute('data-event-bound')) {
            console.log('发现未绑定事件的保存按钮，添加点击事件');
            
            // 标记按钮已绑定事件，避免重复绑定
            saveBtn.setAttribute('data-event-bound', 'true');
            
            // 添加直接的点击事件，不使用addEventListener
            saveBtn.onclick = function(event) {
                console.log('保存按钮点击事件触发(通过DOM监控)');
                event.preventDefault();
            saveComment();
                return false;
            };
        }
    }, 1000); // 每秒检查一次
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('评语管理页面初始化...');
    
    // 初始化
    initialize();
    
    // 启动DOM监控
    monitorDOMChanges();
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
                    <button class="btn btn-sm btn-outline-info ai-comment-btn me-1 breathing-button" data-student-id="${student.id}" data-student-name="${student.name}" style="background: linear-gradient(135deg, #e0f7ff, #ffffff); border-color: #00c3ff; color: #0072ff; font-weight: bold;">
                        <i class='bx bx-bot'></i> AI海海
                    </button>
                    <button class="btn btn-sm btn-primary edit-comment-btn" data-student-id="${student.id}" data-student-name="${student.name}">
                        <i class='bx bx-edit'></i> 编辑评语
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // 绑定编辑按钮事件
    const editBtn = col.querySelector('.edit-comment-btn');
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            fillCommentForm(this.dataset.studentId, this.dataset.studentName);
        });
    }
    
    // 绑定AI评语助手按钮事件
    const aiBtn = col.querySelector('.ai-comment-btn');
    if (aiBtn) {
        aiBtn.addEventListener('click', function() {
            showAICommentAssistant(this.dataset.studentId, this.dataset.studentName);
        });
    }
    
    return col;
}

// 填充评语表单
function fillCommentForm(studentId, studentName) {
    console.log('填充评语表单:', studentId, studentName);
    
    // 设置学生信息
    const modalStudentName = document.getElementById('modalStudentName');
    const modalStudentId = document.getElementById('modalStudentId');
    const commentText = document.getElementById('commentText');
    
    if (!modalStudentName || !modalStudentId || !commentText) {
        showNotification('找不到必要的表单元素', 'error');
        return;
    }
    
    // 设置学生信息
    modalStudentName.textContent = studentName;
    modalStudentId.textContent = `学号: ${studentId}`;
    
    // 存储学生ID，用于保存评语
    commentText.dataset.studentId = studentId;
    currentStudentId = studentId;
    
    // 显示加载状态
    commentText.value = '加载中...';
    commentText.disabled = true;
    
    if (USE_SERVER_API) {
        // 从服务器获取评语数据
        fetch(`/api/comments/${studentId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
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
                showNotification('获取评语数据失败: ' + error.message, 'error');
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
    console.log('执行保存评语函数...');
    
    const commentText = document.getElementById('commentText');
    if (!commentText) {
        console.error('找不到评语输入框');
        showNotification('找不到评语输入框', 'error');
        return;
    }
    
    const studentId = commentText.dataset.studentId;
    if (!studentId) {
        console.error('未找到学生ID');
        showNotification('未找到学生ID', 'error');
        return;
    }
    
    // 先调用一次字数统计更新，确保字数已被限制在允许范围内
    updateCharCount();
    
    const content = commentText.value.trim();
    if (!content) {
        console.error('评语内容为空');
        showNotification('请输入评语内容', 'error');
        return;
    }
    
    // 检查评语字数是否超过限制
    const maxLength = 200;
    if (content.length > maxLength) {
        console.warn(`评语内容超过字数限制: ${content.length}/${maxLength}，将自动截断`);
        // 自动截断内容而不是显示错误
        commentText.value = content.substring(0, maxLength);
        updateCharCount();
        showNotification(`评语内容已自动截断至${maxLength}字`, 'warning');
    }
    
    // 检查是否为添加模式
    const appendMode = document.getElementById('appendModeSwitch')?.checked || false;
    console.log(`保存模式: ${appendMode ? '添加' : '替换'}`);
    
    // 创建评语对象
    const commentData = {
        studentId,
        content: commentText.value.trim(), // 使用可能被截断后的内容
        appendMode
    };
    
    // 显示处理状态
    const saveBtn = document.getElementById('saveCommentBtn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 保存中...';
    }
    
    console.log('发送保存请求:', commentData);
    
        // 发送到服务器
        fetch('/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(commentData)
        })
    .then(response => {
        console.log('服务器响应状态:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
        .then(data => {
        console.log('保存评语响应:', data);
            if (data.status === 'ok') {
                // 关闭模态框
                const modal = bootstrap.Modal.getInstance(document.getElementById('editCommentModal'));
            if (modal) {
                modal.hide();
            }
            
            // 实时更新评语卡片
            const updatedComment = {
                content: data.updatedContent || content,
                updateDate: data.updateDate || new Date().toLocaleString()
            };
            updateCommentCard(studentId, updatedComment);
                
                // 显示成功通知
                showNotification('评语保存成功');
            } else {
            throw new Error(data.message || '保存失败');
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

// 实时更新评语卡片
function updateCommentCard(studentId, comment) {
    if (!studentId || !comment) {
        console.error('更新评语卡片失败：缺少必要参数');
        return;
    }

    // 查找对应的评语卡片
    const commentCard = document.querySelector(`[data-student-id="${studentId}"]`);
    if (!commentCard) {
        console.error(`找不到ID为 ${studentId} 的评语卡片`);
        return;
    }
    
    // 更新评语内容
    const contentElement = commentCard.querySelector('.comment-text');
    if (contentElement) {
        contentElement.textContent = comment.content || '暂无评语';
    } else {
        console.error('找不到评语内容元素');
    }
    
    // 更新评语日期
    const dateElement = commentCard.querySelector('.comment-date');
    if (dateElement) {
        dateElement.innerHTML = `<i class='bx bx-calendar'></i> ${comment.updateDate || '未更新'}`;
    } else {
        console.error('找不到评语日期元素');
    }
    
    // 更新评语字数和状态
    const commentLength = (comment.content || '').length;
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
    } else {
        console.error('找不到评语统计元素');
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
    let className = exportSettings.className || '';
    const schoolName = exportSettings.schoolName || '';
    const schoolYear = exportSettings.schoolYear || '';
    
    console.log('导出设置：', { 班级: className, 学校: schoolName, 学年: schoolYear });
    
    // 构建请求URL - 使用URLSearchParams处理参数
    const params = new URLSearchParams();
    
    // 添加班级参数
    if (className && className.trim() !== '') {
        try {
            className = className.trim();
            params.append('class', className);
        } catch (e) {
            console.error('处理班级名称时出错:', e);
        }
    }
    
    // 添加学校名称参数
    if (schoolName && schoolName.trim() !== '') {
        try {
            params.append('school_name', schoolName.trim());
        } catch (e) {
            console.error('处理学校名称时出错:', e);
        }
    }
    
    // 添加学年参数
    if (schoolYear && schoolYear.trim() !== '') {
        try {
            params.append('school_year', schoolYear.trim());
        } catch (e) {
            console.error('处理学年时出错:', e);
        }
    }
    
    // 生成查询字符串
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    console.log('导出请求URL:', `/api/export-comments-pdf${queryString}`);
    
    // 显示长时间进度提示
    setTimeout(() => {
        // 5秒后如果仍在加载，显示长时间等待提示
        const toastContainer = document.getElementById('toastContainer');
        if (toastContainer) {
            const toasts = toastContainer.querySelectorAll('.toast');
            // 如果仍有加载通知，显示额外的提示
            if (toasts.length > 0) {
                showNotification('PDF生成中，请继续等待...', 'info', 8000);
            }
        }
    }, 5000);
    
    // 调用导出API
    fetch(`/api/export-comments-pdf${queryString}`)
        .then(response => {
            // 即使是错误状态码，也获取JSON响应
            return response.json().then(data => {
                // 将响应状态码和数据一起返回
                return { 
                    ok: response.ok, 
                    status: response.status,
                    data: data 
                };
            });
        })
        .then(result => {
            // 关闭加载通知
            const toastContainer = document.getElementById('toastContainer');
            if (toastContainer) {
                const toasts = toastContainer.querySelectorAll('.toast');
                toasts.forEach(toast => {
                    const bsToast = bootstrap.Toast.getInstance(toast);
                    if (bsToast) bsToast.hide();
                });
            }
            
            // 检查结果
            if (result.ok && result.data.status === 'ok') {
                // 显示成功通知
                showNotification('PDF生成成功，正在下载...');
                
                // 创建下载链接
                const downloadLink = document.createElement('a');
                downloadLink.href = result.data.download_url;
                downloadLink.download = result.data.download_url.split('/').pop();
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            } else {
                // 显示错误信息
                let errorMessage = '导出PDF失败，未知错误';
                
                // 正确提取错误信息
                try {
                    if (result.data) {
                        // 如果data是字符串，直接使用
                        if (typeof result.data === 'string') {
                            errorMessage = result.data;
                        } 
                        // 如果data是对象
                        else if (typeof result.data === 'object') {
                            // 尝试获取message字段
                            if (typeof result.data.message === 'string') {
                                errorMessage = result.data.message;
                            } 
                            // 如果status是error并且有message
                            else if (result.data.status === 'error' && typeof result.data.message === 'string') {
                                errorMessage = result.data.message;
                            }
                            // 如果对象没有可用的message字段，尝试转换为字符串
                            else {
                                // 尝试使用JSON.stringify转换
                                try {
                                    const dataStr = JSON.stringify(result.data);
                                    if (dataStr && dataStr !== '{}' && dataStr !== '[]') {
                                        errorMessage = '服务器返回: ' + dataStr.substring(0, 100);
                                    }
                                } catch (jsonErr) {
                                    console.error('JSON转换错误:', jsonErr);
                                }
                            }
                        }
                    }
                    // 如果没有提取到有意义的错误信息，加上HTTP状态码
                    if (errorMessage === '导出PDF失败，未知错误' && result.status) {
                        errorMessage += ` (HTTP ${result.status})`;
                    }
                } catch (e) {
                    console.error('解析错误消息时出错:', e);
                    errorMessage = `解析错误消息时出错: ${e.message}`;
                }
                
                showNotification(`导出PDF失败: ${errorMessage}`, 'error');
                console.error('导出PDF失败详情:', result);
            }
        })
        .catch(error => {
            console.error('导出PDF时网络请求出错:', error);
            showNotification('导出PDF时出错，请检查网络连接或查看控制台获取详细信息', 'error');
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
    console.log('更新字数统计...');
    const commentText = document.getElementById('commentText');
    const charCount = document.getElementById('commentCharCount');
    const batchCommentText = document.getElementById('batchCommentText');
    const batchCharCount = document.getElementById('batchCommentCharCount');
    
    if (commentText && charCount) {
        const maxLength = 200; // 最大字数限制
        const count = commentText.value.length;
        charCount.textContent = `${count}/${maxLength}`;
        console.log(`当前字数: ${count}/${maxLength}`);
        
        // 限制输入字数
        if (count > maxLength) {
            commentText.value = commentText.value.substring(0, maxLength);
            charCount.textContent = `${maxLength}/${maxLength}`;
            console.log(`已截断至最大字数: ${maxLength}`);
        }
        
        // 根据字数改变颜色提示 - 从绿色(接近0字)渐变到红色(接近200字)
        const percentage = Math.min(count / maxLength, 1.0); // 确保不超过1.0
        
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
        const percentage = Math.min(count / maxLength, 1.0); // 确保不超过1.0
        
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
function showNotification(message, type = 'success', duration = 3000) {
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
    
    // 显示Toast，0表示不自动关闭
    const delay = duration === 0 ? Infinity : duration;
    const bsToast = new bootstrap.Toast(toast, { delay: delay });
    bsToast.show();
    
    // 返回toast实例以便可以手动控制
    return bsToast;
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
    console.log('开始初始化评语管理功能...');
    
    // 添加呼吸灯效果的样式
    if (!document.getElementById('breathing-effect-style')) {
        const style = document.createElement('style');
        style.id = 'breathing-effect-style';
        style.textContent = `
            @keyframes breathing {
                0% { box-shadow: 0 0 10px 2px rgba(0, 183, 255, 0.4); }
                25% { box-shadow: 0 0 15px 4px rgba(0, 217, 255, 0.6); }
                50% { box-shadow: 0 0 20px 6px rgba(0, 247, 255, 0.8); }
                75% { box-shadow: 0 0 15px 4px rgba(0, 217, 255, 0.6); }
                100% { box-shadow: 0 0 10px 2px rgba(0, 183, 255, 0.4); }
            }
            .breathing-border {
                animation: breathing 2s infinite ease-in-out;
                border: 3px solid #00c3ff !important;
                border-radius: 8px !important;
                overflow: hidden;
            }
            .breathing-button {
                animation: breathing 2s infinite ease-in-out;
                position: relative;
                z-index: 1;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 加载评语模板
    loadCommentTemplates();
    
    // 初始化评语列表
    initCommentList();
    
    // 绑定事件监听器
    bindEventListeners();
    
    console.log('评语管理功能初始化完成');
}

// 绑定事件监听器
function bindEventListeners() {
    console.log('绑定事件监听器...');
    
    // 批量编辑按钮事件
    const batchEditBtn = document.getElementById('batchEditBtn');
    if (batchEditBtn) {
        batchEditBtn.addEventListener('click', function() {
            console.log('批量编辑按钮被点击');
            showBatchEditModal();
        });
    } else {
        console.error('找不到批量编辑按钮');
    }
    
    // 批量保存按钮事件
    const saveBatchBtn = document.getElementById('saveBatchBtn');
    if (saveBatchBtn) {
        saveBatchBtn.addEventListener('click', function() {
            console.log('批量保存按钮被点击');
            saveBatchComments();
        });
    } else {
        console.error('找不到批量保存按钮');
    }
    
    // 导出评语按钮事件
    const exportCommentsBtn = document.getElementById('exportCommentsBtn');
    if (exportCommentsBtn) {
        exportCommentsBtn.addEventListener('click', function() {
            console.log('导出评语按钮被点击');
            exportComments();
        });
    } else {
        console.error('找不到导出评语按钮');
    }
    
    // 打印预览按钮事件
    const printPreviewBtn = document.getElementById('printPreviewBtn');
    if (printPreviewBtn) {
        printPreviewBtn.addEventListener('click', function() {
            console.log('打印预览按钮被点击');
            showPrintPreview();
        });
    } else {
        console.error('找不到打印预览按钮');
    }
    
    // 管理模板按钮事件
    const manageTemplatesBtn = document.getElementById('manageTemplatesBtn');
    if (manageTemplatesBtn) {
        manageTemplatesBtn.addEventListener('click', function() {
            console.log('管理模板按钮被点击');
            showTemplateModal();
        });
    } else {
        console.error('找不到管理模板按钮');
    }
    
    // 添加模板按钮事件
    const addTemplateBtn = document.getElementById('addTemplateBtn');
    if (addTemplateBtn) {
        addTemplateBtn.addEventListener('click', function() {
            console.log('添加模板按钮被点击');
            addTemplate();
        });
    } else {
        console.error('找不到添加模板按钮');
    }
    
    // 模板分类筛选按钮事件
    const templateFilters = document.querySelectorAll('.template-filter');
    templateFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            console.log('模板过滤按钮被点击:', this.dataset.filter);
            const filterType = this.dataset.filter;
            
            // 更新活动状态
            templateFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            
            // 根据选择的过滤器渲染模板按钮
            renderTemplateButtons(filterType);
        });
    });
    
    // 监听评语文本框输入事件，更新字数统计
    const commentText = document.getElementById('commentText');
    if (commentText) {
        commentText.addEventListener('input', function() {
            updateCharCount();
        });
    } else {
        console.error('找不到评语文本框');
    }
    
    // 搜索输入事件
    const searchInput = document.getElementById('searchStudent');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            console.log('搜索框输入:', this.value);
            filterComments(this.value);
        });
    } else {
        console.error('找不到搜索输入框');
    }
    
    // 为批量编辑中的全选/取消全选按钮绑定事件
    document.getElementById('selectAllStudentsBtn')?.addEventListener('click', function() {
        console.log('全选按钮被点击');
        const checkboxes = document.querySelectorAll('.student-checkbox');
        checkboxes.forEach(cb => cb.checked = true);
        document.getElementById('selectAllCheckbox').checked = true;
    });
    
    document.getElementById('deselectAllStudentsBtn')?.addEventListener('click', function() {
        console.log('取消全选按钮被点击');
        const checkboxes = document.querySelectorAll('.student-checkbox');
        checkboxes.forEach(cb => cb.checked = false);
        document.getElementById('selectAllCheckbox').checked = false;
    });
    
    // 批量评语文本框输入事件
    document.getElementById('batchCommentText')?.addEventListener('input', function() {
        updateCharCount();
    });
    
    console.log('事件监听器绑定完成');
}

// 显示AI评语助手模态框
function showAICommentAssistant(studentId, studentName) {
    console.log('打开AI海海:', studentId, studentName);
    
    // 创建模态框HTML
    const modalId = 'aiCommentAssistantModal';
    let modalElement = document.getElementById(modalId);
    
    // 如果模态框不存在，创建新的
    if (!modalElement) {
        modalElement = document.createElement('div');
        modalElement.className = 'modal fade';
        modalElement.id = modalId;
        modalElement.tabIndex = '-1';
        modalElement.setAttribute('data-bs-backdrop', 'static');
        modalElement.setAttribute('aria-labelledby', `${modalId}Label`);
        modalElement.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content breathing-border">
                    <div class="modal-header" style="background: linear-gradient(135deg, #00c6ff, #0072ff); color: white;">
                        <h5 class="modal-title" id="${modalId}Label">
                            <i class='bx bx-bot'></i> AI海海 - <span id="aiModalStudentName"></span>
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <!-- 欢迎信息 -->
                        <div class="alert alert-info d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <i class='bx bx-info-circle me-2'></i> 
                                欢迎使用青柠半夏为您提供的Deepseek API，您也可以使用自己的API
                            </div>
                            <a href="#" class="btn btn-sm btn-outline-primary" id="openApiSettingsBtn">
                                <i class='bx bx-cog'></i> 修改
                            </a>
                        </div>
                        
                        <!-- AI评语生成设置 -->
                        <div class="card mb-3">
                            <div class="card-body">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">学生个性特点</label>
                                        <textarea class="form-control" id="aiPersonalityInput" rows="2" placeholder="例如：活泼开朗、喜欢思考、认真负责..."></textarea>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">学习表现</label>
                                        <textarea class="form-control" id="aiStudyInput" rows="2" placeholder="例如：数学成绩优秀、语文需要提高、认真听讲..."></textarea>
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">爱好/特长</label>
                                        <textarea class="form-control" id="aiHobbiesInput" rows="2" placeholder="例如：喜欢画画、擅长球类运动、对科学感兴趣..."></textarea>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">需要改进的方面</label>
                                        <textarea class="form-control" id="aiImprovementInput" rows="2" placeholder="例如：注意力不集中、作业拖延、不爱发言..."></textarea>
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-4">
                                        <label class="form-label">评语风格</label>
                                        <select class="form-select" id="aiStyleSelect">
                                            <option value="鼓励性的">鼓励性</option>
                                            <option value="严肃的">严肃</option>
                                            <option value="中肯的">中肯</option>
                                            <option value="温和的">温和</option>
                                            <option value="诗意的">诗意的</option>
                                            <option value="自然的">自然的</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">评语语气</label>
                                        <select class="form-select" id="aiToneSelect">
                                            <option value="正式的">正式</option>
                                            <option value="亲切的">亲切</option>
                                            <option value="严厉的">严厉</option>
                                            <option value="随和的">随和</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">最大字数</label>
                                        <input type="number" class="form-control" id="aiMaxLengthInput" value="200" min="50" max="500">
                                    </div>
                                </div>
                                <div class="text-end">
                                    <button id="generateAICommentBtn" class="btn btn-primary">
                                        <i class='bx bx-magic'></i> 生成AI评语
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- AI评语预览 -->
                        <div id="aiCommentPreview" class="card" style="display: none; border: 2px solid #00c3ff; box-shadow: 0 0 10px rgba(0, 195, 255, 0.3);">
                            <div class="card-header bg-info text-white" style="background: linear-gradient(135deg, #00c6ff, #0072ff) !important;">
                                <h6 class="mb-0">
                                    <i class='bx bx-bot'></i> AI海海生成的评语
                                </h6>
                            </div>
                            <div class="card-body">
                                <div id="aiCommentContent" class="mb-3 p-3 border rounded" style="min-height: 100px;"></div>
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <span class="badge bg-light text-dark" id="aiCommentLength">0/200</span> 字
                                    </div>
                                    <div>
                                        <button class="btn btn-outline-secondary" id="generateAnotherBtn">
                                            <i class='bx bx-refresh'></i> 重新生成
                                        </button>
                                        <button class="btn btn-primary" id="useAICommentBtn">
                                            <i class='bx bx-check'></i> 使用此评语
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 加载中提示 -->
                        <div id="aiGeneratingIndicator" class="text-center p-4" style="display: none;">
                            <div class="spinner-border text-primary mb-3" role="status">
                                <span class="visually-hidden">正在生成...</span>
                            </div>
                            <p>正在生成评语，请稍候...</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalElement);
        
        // 绑定API设置按钮事件 - 现在打开模态框而不是跳转
        document.getElementById('openApiSettingsBtn').addEventListener('click', function(e) {
            e.preventDefault();
            showApiSettingsModal();
        });
        
        // 绑定模态框隐藏前的事件处理器
        modalElement.addEventListener('hide.bs.modal', function() {
            // 移除所有按钮的焦点，避免ARIA警告
            const focusableElements = modalElement.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            focusableElements.forEach(el => el.blur());
        });
    }
    
    // 保存当前学生ID到模态框中的隐藏字段
    if (!modalElement.querySelector('#currentStudentId')) {
        const hiddenField = document.createElement('input');
        hiddenField.type = 'hidden';
        hiddenField.id = 'currentStudentId';
        modalElement.appendChild(hiddenField);
    }
    
    // 更新当前学生ID
    document.getElementById('currentStudentId').value = studentId;
    
    // 设置学生姓名
    document.getElementById('aiModalStudentName').textContent = studentName;
    
    // 清空生成的评语预览
    document.getElementById('aiCommentPreview').style.display = 'none';
    document.getElementById('aiCommentContent').textContent = '';
    
    // 每次打开模态框时重新绑定事件，使用当前的学生ID
    const generateBtn = document.getElementById('generateAICommentBtn');
    const generateAnotherBtn = document.getElementById('generateAnotherBtn');
    const useAICommentBtn = document.getElementById('useAICommentBtn');
    
    // 移除旧的事件监听器
    const newGenerateBtn = generateBtn.cloneNode(true);
    generateBtn.parentNode.replaceChild(newGenerateBtn, generateBtn);
    
    const newGenerateAnotherBtn = generateAnotherBtn ? generateAnotherBtn.cloneNode(true) : null;
    if (generateAnotherBtn && newGenerateAnotherBtn) {
        generateAnotherBtn.parentNode.replaceChild(newGenerateAnotherBtn, generateAnotherBtn);
    }
    
    const newUseAICommentBtn = useAICommentBtn ? useAICommentBtn.cloneNode(true) : null;
    if (useAICommentBtn && newUseAICommentBtn) {
        useAICommentBtn.parentNode.replaceChild(newUseAICommentBtn, useAICommentBtn);
    }
    
    // 添加新的事件监听器
    document.getElementById('generateAICommentBtn').addEventListener('click', function() {
        // 使用getCurrentStudentId()函数获取当前正在操作的学生ID
        const currentId = document.getElementById('currentStudentId').value;
        console.log('生成评语按钮点击，当前学生ID:', currentId);
        generateAIComment(currentId);
    });
    
    if (newGenerateAnotherBtn) {
        document.getElementById('generateAnotherBtn').addEventListener('click', function() {
            const currentId = document.getElementById('currentStudentId').value;
            console.log('重新生成按钮点击，当前学生ID:', currentId);
            generateAIComment(currentId);
        });
    }
    
    if (newUseAICommentBtn) {
        document.getElementById('useAICommentBtn').addEventListener('click', function() {
            const currentId = document.getElementById('currentStudentId').value;
            console.log('使用评语按钮点击，当前学生ID:', currentId);
            useAIComment(currentId);
        });
    }
    
    // 打开模态框
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

// 生成AI评语
function generateAIComment(studentId) {
    console.log('生成AI评语:', studentId);
    
    // 获取输入参数
    const personality = document.getElementById('aiPersonalityInput').value.trim();
    const studyPerformance = document.getElementById('aiStudyInput').value.trim();
    const hobbies = document.getElementById('aiHobbiesInput').value.trim();
    const improvement = document.getElementById('aiImprovementInput').value.trim();
    const style = document.getElementById('aiStyleSelect').value;
    const tone = document.getElementById('aiToneSelect').value;
    const maxLength = parseInt(document.getElementById('aiMaxLengthInput').value);
    
    // 显示加载状态
    document.getElementById('aiGeneratingIndicator').style.display = 'block';
    document.getElementById('aiCommentPreview').style.display = 'none';
    document.getElementById('generateAICommentBtn').disabled = true;
    
    // 处理特殊风格
    let styleDescription = style;
    let additionalInstructions = "";
    
    if (style === "诗意的") {
        additionalInstructions = "请在评语中加入一句与学生特点相关的诗句，使评语更加富有诗意。";
    } else if (style === "自然的") {
        additionalInstructions = "请使用花卉、植物等自然元素来形象比喻描述学生的特点，使评语更加生动形象。";
    }
    
    // 请求参数
    const requestData = {
        student_id: studentId,  // 兼容后端API
        studentId: studentId,   // 兼容后端API可能的另一种参数名
        personality,
        study_performance: studyPerformance,
        hobbies,
        improvement,
        style,
        tone,
        max_length: maxLength,
        additional_instructions: additionalInstructions  // 添加特殊风格说明
    };
    
    console.log('发送评语生成请求:', requestData);
    
    // 发送请求
    fetch('/api/generate-comment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }
        // 获取响应文本以便于调试
        return response.text().then(text => {
            // 尝试解析JSON
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error('解析响应数据失败:', e);
                console.log('原始响应内容:', text);
                throw new Error('服务器返回的数据格式不正确');
            }
        });
    })
    .then(data => {
        console.log('评语生成结果:', data);
        
        // 隐藏加载状态
        document.getElementById('aiGeneratingIndicator').style.display = 'none';
        
        // 检查响应状态
        if (data.status === 'ok') {
            // 验证返回的学生ID与请求的学生ID是否一致
            if (data.student_id && data.student_id !== studentId) {
                console.error(`学生ID不匹配: 请求ID=${studentId}, 返回ID=${data.student_id}`);
                showNotification('服务器返回了错误的学生评语数据，请重试', 'error');
                return;
            }
            
            // 获取评语内容（兼容可能的不同字段名）
            const commentContent = data.comment || data.content;
            
            if (!commentContent) {
                showNotification('评语生成成功，但内容为空', 'warning');
                return;
            }
            
            // 显示生成的评语
            const aiCommentPreview = document.getElementById('aiCommentPreview');
            const aiCommentContent = document.getElementById('aiCommentContent');
            const aiCommentLength = document.getElementById('aiCommentLength');
            
            aiCommentContent.textContent = commentContent;
            aiCommentLength.textContent = `${commentContent.length}/${maxLength}`;
            aiCommentPreview.style.display = 'block';
            
            showNotification('评语生成成功', 'success');
        } else {
            // 显示错误消息
            showNotification(`评语生成失败: ${data.message || '未知错误'}`, 'error');
        }
    })
    .catch(error => {
        console.error('评语生成请求出错:', error);
        document.getElementById('aiGeneratingIndicator').style.display = 'none';
        showNotification(`评语生成出错: ${error.message}`, 'error');
    })
    .finally(() => {
        // 恢复按钮状态
        document.getElementById('generateAICommentBtn').disabled = false;
    });
}

// 使用AI生成的评语
function useAIComment(studentId) {
    console.log('使用AI评语:', studentId);
    
    // 获取生成的评语内容
    const aiCommentContent = document.getElementById('aiCommentContent').textContent;
    if (!aiCommentContent) {
        showNotification('评语内容为空', 'error');
        return;
    }
    
    // 确认使用评语
    if (confirm('确定要使用此评语吗？这将替换现有评语。')) {
        // 创建评语数据
        const commentData = {
            studentId,
            content: aiCommentContent,
            updatedContent: aiCommentContent  // 兼容API可能需要的参数
        };
        
        // 发送到服务器
        fetch('/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(commentData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'ok') {
                // 移除模态框中所有按钮的焦点，避免ARIA警告
                const modalElement = document.getElementById('aiCommentAssistantModal');
                const focusableElements = modalElement.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                focusableElements.forEach(el => el.blur());
                
                // 关闭模态框
                const modal = bootstrap.Modal.getInstance(document.getElementById('aiCommentAssistantModal'));
                if (modal) {
                    modal.hide();
                }
                
                // 实时更新评语卡片
                updateCommentCard(studentId, {
                    content: aiCommentContent,
                    updateDate: new Date().toLocaleDateString()
                });
                
                showNotification('评语已保存', 'success');
                
                // 触发更新事件
                notifyStudentDataChanged();
            } else {
                throw new Error(data.message || '保存失败');
            }
        })
        .catch(error => {
            console.error('保存评语失败:', error);
            showNotification(`保存评语失败: ${error.message}`, 'error');
        });
    }
}

// 创建并显示API设置模态框
function showApiSettingsModal() {
    console.log('显示API设置模态框');

    // 创建模态框HTML
    const modalId = 'apiSettingsModal';
    let modalElement = document.getElementById(modalId);
    
    // 如果模态框不存在，创建新的
    if (!modalElement) {
        modalElement = document.createElement('div');
        modalElement.className = 'modal fade';
        modalElement.id = modalId;
        modalElement.tabIndex = '-1';
        modalElement.setAttribute('data-bs-backdrop', 'static');
        modalElement.setAttribute('aria-labelledby', `${modalId}Label`);
        modalElement.innerHTML = `
            <div class="modal-dialog modal-md">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="${modalId}Label">
                            <i class='bx bx-cog'></i> 设置 Deepseek API
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="apiDeepseekKey" class="form-label">Deepseek API密钥</label>
                            <div class="input-group">
                                <input type="password" class="form-control" id="apiDeepseekKey" placeholder="输入您的Deepseek API密钥">
                                <button class="btn btn-outline-secondary" type="button" id="apiToggleKeyBtn">
                                    <i class='bx bx-show'></i>
                                </button>
                            </div>
                            <div class="form-text">用于生成学生评语的API密钥，请在 <a href="https://www.deepseek.com/" target="_blank">DeepSeek官网</a> 获取</div>
                        </div>
                        
                        <!-- API状态显示 -->
                        <div id="apiStatusDisplay" class="alert alert-info mt-3" style="display: none;"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                        <button type="button" class="btn btn-info" id="apiTestBtn">
                            <i class='bx bx-test-tube'></i> 测试连接
                        </button>
                        <button type="button" class="btn btn-primary" id="apiSaveBtn">
                            <i class='bx bx-save'></i> 保存设置
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalElement);
        
        // 绑定API密钥显示/隐藏按钮事件
        document.getElementById('apiToggleKeyBtn').addEventListener('click', function() {
            const apiKeyInput = document.getElementById('apiDeepseekKey');
            const icon = this.querySelector('i');
            
            if (apiKeyInput.type === 'password') {
                apiKeyInput.type = 'text';
                icon.classList.remove('bx-show');
                icon.classList.add('bx-hide');
            } else {
                apiKeyInput.type = 'password';
                icon.classList.remove('bx-hide');
                icon.classList.add('bx-show');
            }
        });
        
        // 绑定测试按钮事件
        document.getElementById('apiTestBtn').addEventListener('click', function() {
            testApiConnection();
        });
        
        // 绑定保存按钮事件
        document.getElementById('apiSaveBtn').addEventListener('click', function() {
            saveApiSettings();
        });
    }
    
    // 加载当前的API密钥
    loadApiSettings();
    
    // 显示模态框
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

// 加载API设置
function loadApiSettings() {
    const apiKeyInput = document.getElementById('apiDeepseekKey');
    if (!apiKeyInput) return;
    
    // 从localStorage获取API密钥
    const apiKey = localStorage.getItem('deepseekApiKey') || '';
    apiKeyInput.value = apiKey;
    
    // 也可以从服务器加载，但这里我们使用本地存储的值
    fetch('/api/settings')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok' && data.settings && data.settings.deepseek_api_key) {
                apiKeyInput.value = data.settings.deepseek_api_key;
            }
        })
        .catch(error => {
            console.error('加载API设置时出错:', error);
        });
}

// 测试API连接
function testApiConnection() {
    const apiKey = document.getElementById('apiDeepseekKey').value.trim();
    const statusDisplay = document.getElementById('apiStatusDisplay');
    
    if (!apiKey) {
        showApiStatus('请输入API密钥', 'warning');
        return;
    }
    
    // 显示加载状态
    showApiStatus('正在测试连接...', 'info');
    
    // 禁用测试按钮
    const testBtn = document.getElementById('apiTestBtn');
    if (testBtn) {
        testBtn.disabled = true;
        testBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 测试中...';
    }
    
    // 发送测试请求
    fetch('/api/test-deepseek', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ api_key: apiKey })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'ok') {
            showApiStatus('API连接测试成功！', 'success');
        } else {
            showApiStatus(`测试失败: ${data.message || '未知错误'}`, 'danger');
        }
    })
    .catch(error => {
        console.error('测试API连接时出错:', error);
        showApiStatus(`测试出错: ${error.message}`, 'danger');
    })
    .finally(() => {
        // 恢复按钮状态
        if (testBtn) {
            testBtn.disabled = false;
            testBtn.innerHTML = '<i class="bx bx-test-tube"></i> 测试连接';
        }
    });
}

// 保存API设置
function saveApiSettings() {
    const apiKey = document.getElementById('apiDeepseekKey').value.trim();
    
    // 保存到localStorage
    localStorage.setItem('deepseekApiKey', apiKey);
    
    // 显示保存状态
    const statusDisplay = document.getElementById('apiStatusDisplay');
    
    // 禁用保存按钮
    const saveBtn = document.getElementById('apiSaveBtn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 保存中...';
    }
    
    // 发送到服务器
    fetch('/api/settings/deepseek', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ api_key: apiKey })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'ok') {
            showApiStatus('API设置已保存', 'success');
            
            // 可以选择关闭模态框
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('apiSettingsModal'));
                if (modal) modal.hide();
            }, 1500);
        } else {
            showApiStatus(`保存失败: ${data.message || '未知错误'}`, 'danger');
        }
    })
    .catch(error => {
        console.error('保存API设置时出错:', error);
        showApiStatus(`保存失败: ${error.message}`, 'danger');
    })
    .finally(() => {
        // 恢复按钮状态
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="bx bx-save"></i> 保存设置';
        }
    });
}

// 显示API状态
function showApiStatus(message, type) {
    const statusDisplay = document.getElementById('apiStatusDisplay');
    if (!statusDisplay) return;
    
    // 设置状态消息和样式
    statusDisplay.textContent = message;
    statusDisplay.style.display = 'block';
    
    // 设置样式
    statusDisplay.className = '';
    statusDisplay.classList.add('alert');
    
    switch (type) {
        case 'success':
            statusDisplay.classList.add('alert-success');
            break;
        case 'danger':
            statusDisplay.classList.add('alert-danger');
            break;
        case 'warning':
            statusDisplay.classList.add('alert-warning');
            break;
        default:
            statusDisplay.classList.add('alert-info');
    }
}// 文件结束
