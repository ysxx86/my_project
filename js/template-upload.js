// 模板上传和管理功能

// 文件模板上传处理
function handleTemplateUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.name.endsWith('.docx')) {
        showNotification('请上传.docx格式的Word文档', 'error');
        return;
    }
    
    // 显示上传中状态
    const uploadBtn = document.getElementById('uploadTemplateBtn');
    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> 上传中...';
    }
    
    // 创建FormData对象
    const formData = new FormData();
    formData.append('template', file);
    
    // 发送上传请求
    fetch('/api/templates', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'ok') {
            showNotification('模板上传成功', 'success');
            // 刷新模板列表
            fetchTemplates();
        } else {
            showNotification('模板上传失败: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('上传模板时出错:', error);
        showNotification('上传模板时出错: ' + error.message, 'error');
    })
    .finally(() => {
        // 恢复按钮状态
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="bx bx-upload"></i> 上传模板';
        }
        
        // 清空文件输入框
        event.target.value = '';
    });
}

// 获取可用的模板列表
function fetchTemplates() {
    fetch('/api/templates')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok' && data.templates) {
                // 简化模板显示，只展示基本信息
                updateTemplateCards(data.templates);
            } else {
                console.warn('获取模板列表失败:', data.message);
            }
        })
        .catch(error => {
            console.error('获取模板列表时出错:', error);
        });
}

// 更新模板卡片显示
function updateTemplateCards(templates) {
    console.log('更新模板卡片:', templates);
    const templateContainer = document.getElementById('templateContainer');
    if (!templateContainer) {
        console.error('找不到模板容器');
        return;
    }
    
    // 清空现有模板
    templateContainer.innerHTML = '';
    
    // 移除已存在的事件监听器
    templateContainer.removeEventListener('click', templateContainerClickHandler);
    
    // 简化的模板卡片
    if (templates.length > 0) {
        templates.forEach(template => {
            const card = document.createElement('div');
            card.className = 'col-md-4 mb-3';
            card.innerHTML = `
                <div class="card template-card" data-template-id="${template.id}">
                    <div class="card-body">
                        <h5 class="card-title">${template.name}</h5>
                    </div>
                </div>
            `;
            templateContainer.appendChild(card);
        });
    } else {
        // 没有模板时显示提示
        templateContainer.innerHTML = '<div class="col-12 text-center">没有可用的模板，请上传模板</div>';
    }
    
    // 添加单击事件处理程序
    templateContainer.addEventListener('click', templateContainerClickHandler, { once: false });
    
    // 选中第一个模板
    const firstTemplate = templateContainer.querySelector('.template-card');
    if (firstTemplate) {
        selectTemplate(firstTemplate, false); // 不触发事件，只更新UI
    }
}

// 处理模板容器的点击事件
function templateContainerClickHandler(event) {
    const templateCard = event.target.closest('.template-card');
    if (templateCard) {
        selectTemplate(templateCard);
    }
}

// 选择模板
function selectTemplate(templateCard, triggerEvent = true) {
    if (!templateCard) return;
    
    console.log('选中模板:', templateCard.dataset.templateId);
    
    // 移除其他模板的选中状态
    document.querySelectorAll('.template-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // 添加当前模板的选中状态
    templateCard.classList.add('selected');
    
    // 触发选择事件（如果需要）
    if (triggerEvent) {
        const event = new CustomEvent('template-selected', { 
            detail: { templateId: templateCard.dataset.templateId } 
        });
        document.dispatchEvent(event);
    }
}

// 显示通知消息
function showNotification(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show fixed-top mx-auto mt-3`;
    alert.style.maxWidth = '500px';
    alert.style.zIndex = '9999';
    alert.role = 'alert';
    
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alert);
    
    // 3秒后自动关闭
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
    }, 3000);
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化模板上传功能');
    
    // 绑定模板上传事件
    const templateUpload = document.getElementById('templateUpload');
    if (templateUpload) {
        // 移除可能已存在的事件监听器
        templateUpload.removeEventListener('change', handleTemplateUpload);
        // 添加新的事件监听器
        templateUpload.addEventListener('change', handleTemplateUpload);
    } else {
        console.warn('找不到模板上传元素');
    }
    
    // 绑定上传按钮点击事件
    const uploadTemplateBtn = document.getElementById('uploadTemplateBtn');
    if (uploadTemplateBtn) {
        // 移除可能已存在的事件监听器
        const clonedBtn = uploadTemplateBtn.cloneNode(true);
        uploadTemplateBtn.parentNode.replaceChild(clonedBtn, uploadTemplateBtn);
        
        // 添加新的事件监听器
        clonedBtn.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            const templateUpload = document.getElementById('templateUpload');
            if (templateUpload) {
                templateUpload.click();
            } else {
                console.warn('找不到模板上传元素');
            }
        });
    } else {
        console.warn('找不到上传按钮元素');
    }
    
    // 获取模板列表
    fetchTemplates();
}); 