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
            
            // 显示模板名称
            const templateNameElement = document.getElementById('templateName');
            if (templateNameElement) {
                templateNameElement.textContent = file.name;
                
                // 显示已上传模板信息
                const uploadedTemplate = document.getElementById('uploadedTemplate');
                if (uploadedTemplate) {
                    uploadedTemplate.classList.remove('d-none');
                }
            }
            
            // 更新当前选中的模板ID
            const templateContainer = document.getElementById('templateContainer');
            if (templateContainer) {
                const templateId = data.template_id || data.templateId || file.name.replace('.docx', '');
                
                // 创建一个隐藏的模板选择器
                let hiddenTemplate = document.querySelector('.template-card.hidden-template');
                if (!hiddenTemplate) {
                    hiddenTemplate = document.createElement('div');
                    hiddenTemplate.className = 'template-card hidden-template selected d-none';
                    hiddenTemplate.dataset.templateId = templateId;
                    templateContainer.appendChild(hiddenTemplate);
                } else {
                    hiddenTemplate.dataset.templateId = templateId;
                    hiddenTemplate.classList.add('selected');
                }
                
                // 触发模板选择事件
                const event = new CustomEvent('template-selected', { 
                    detail: { templateId: templateId } 
                });
                document.dispatchEvent(event);
            }
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
            uploadBtn.innerHTML = '<i class="bx bx-upload"></i> 上传自定义模板';
        }
        
        // 清空文件输入框
        event.target.value = '';
    });
}

// 获取可用的模板列表 - 简化版，不再显示列表
function fetchTemplates() {
    // 将不再显示模板列表，只需检查是否有默认模板
    fetch('/api/templates')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok' && data.templates) {
                console.log('系统有可用模板:', data.templates.length);
                
                // 只需确保有一个隐藏的模板选择器
                const templateContainer = document.getElementById('templateContainer');
                if (templateContainer && data.templates.length > 0) {
                    const defaultTemplate = data.templates[0];
                    
                    // 确保有一个隐藏的模板选择器
                    let hiddenTemplate = document.querySelector('.template-card.hidden-template');
                    if (!hiddenTemplate) {
                        hiddenTemplate = document.createElement('div');
                        hiddenTemplate.className = 'template-card hidden-template selected d-none';
                        hiddenTemplate.dataset.templateId = defaultTemplate.id;
                        templateContainer.appendChild(hiddenTemplate);
                    } else {
                        hiddenTemplate.dataset.templateId = defaultTemplate.id;
                        hiddenTemplate.classList.add('selected');
                    }
                }
            }
        })
        .catch(error => {
            console.error('获取模板列表时出错:', error);
        });
}

// 更新模板卡片显示 - 简化版，不再显示列表
function updateTemplateCards(templates) {
    // 不再显示模板列表，此函数保留但简化
    console.log('有可用模板数量:', templates.length);
}

// 模板容器点击事件处理函数 - 防抖处理
let lastClickTime = 0;
let clickTimeout = null;

function templateContainerClickHandler(event) {
    // 阻止事件冒泡
    event.stopPropagation();
    
    // 查找被点击的模板卡片
    const templateCard = event.target.closest('.template-card');
    if (!templateCard) return;
    
    // 添加防抖，避免多次快速点击触发多次
    const now = Date.now();
    if (now - lastClickTime < 300) {
        // 快速点击，忽略这次点击
        console.log('快速点击被忽略');
        clearTimeout(clickTimeout);
        return;
    }
    
    lastClickTime = now;
    
    // 使用延迟执行，防止双击
    clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => {
        selectTemplate(templateCard, true);
    }, 50);
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

// 显示通知
function showNotification(message, type = 'success') {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `alert alert-${type} notification`;
    notificationDiv.innerHTML = message;
    
    document.body.appendChild(notificationDiv);
    
    // 显示通知
    setTimeout(() => {
        notificationDiv.classList.add('show');
    }, 10);
    
    // 2秒后隐藏通知
    setTimeout(() => {
        notificationDiv.classList.remove('show');
        setTimeout(() => {
            notificationDiv.remove();
        }, 300);
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