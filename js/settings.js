// @charset UTF-8
// 初始化页面时加载数据库信息
document.addEventListener('DOMContentLoaded', function() {
    // 创建样式元素
    const style = document.createElement('style');
    style.textContent = `
        .toast {
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        }
        .toast.show {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
    
    // 加载数据库信息
    loadDatabaseInfo();
    
    // 绑定刷新数据库信息按钮
    const refreshDbInfoBtn = document.getElementById('refreshDbInfoBtn');
    if (refreshDbInfoBtn) {
        refreshDbInfoBtn.addEventListener('click', loadDatabaseInfo);
    }
    
    // 绑定重置数据库按钮
    const resetDatabaseBtn = document.getElementById('resetDatabaseBtn');
    if (resetDatabaseBtn) {
        resetDatabaseBtn.addEventListener('click', resetDatabase);
    }
    
    // 初始化设置
    loadSettings();
    
    // 绑定事件监听
    bindEventListeners();
    
    // 检查是否需要滚动到Deepseek API设置
    if (sessionStorage.getItem('scrollToDeepseekApi') === 'true') {
        // 清除会话存储变量
        sessionStorage.removeItem('scrollToDeepseekApi');
        
        // 激活安全设置选项卡（假设Deepseek API设置在此选项卡下）
        setTimeout(() => {
            // 找到API设置所在的卡片
            const apiCard = document.querySelector('.card-header:has(h5:contains("AI评语设置"))') || 
                            document.querySelector('h5:contains("AI评语设置")').closest('.card');
            
            if (apiCard) {
                // 滚动到API设置卡片
                apiCard.scrollIntoView({ behavior: 'smooth' });
                
                // 高亮显示API设置卡片
                apiCard.classList.add('border-primary');
                apiCard.style.boxShadow = '0 0 15px rgba(52, 152, 219, 0.6)';
                
                // 高亮显示DeepseekApiKey输入框
                const apiKeyInput = document.getElementById('deepseekApiKey');
                if (apiKeyInput) {
                    apiKeyInput.focus();
                    apiKeyInput.classList.add('border-primary');
                }
                
                // 3秒后移除高亮效果
                setTimeout(() => {
                    apiCard.classList.remove('border-primary');
                    apiCard.style.boxShadow = '';
                    if (apiKeyInput) {
                        apiKeyInput.classList.remove('border-primary');
                    }
                }, 3000);
            }
        }, 500); // 延迟半秒确保DOM已完全加载
    }
});

// 加载数据库信息
function loadDatabaseInfo() {
    // 显示加载中状态
    document.getElementById('databasePath').textContent = '加载中...';
    document.getElementById('studentCount').textContent = '加载中...';
    document.getElementById('lastModified').textContent = '加载中...';
    
    // 发送请求获取数据库信息
    fetch('/api/database-info')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                document.getElementById('databasePath').textContent = data.path;
                document.getElementById('studentCount').textContent = data.student_count;
                document.getElementById('lastModified').textContent = data.last_modified;
            } else {
                showToast('错误', '无法获取数据库信息: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('获取数据库信息出错:', error);
            showToast('错误', '获取数据库信息时出错', 'error');
            document.getElementById('databasePath').textContent = '未知';
            document.getElementById('studentCount').textContent = '未知';
            document.getElementById('lastModified').textContent = '未知';
        });
}

// 重置数据库
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
            // 刷新数据库信息
            loadDatabaseInfo();
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
            resetBtn.innerHTML = '<i class="bx bx-reset"></i> 重置数据库';
            resetBtn.disabled = false;
        }
    });
}

// 加载设置
function loadSettings() {
    // 加载DeepSeek API密钥
    const apiKey = localStorage.getItem('deepseekApiKey') || '';
    document.getElementById('deepseekApiKey').value = apiKey;
    
    // 其他设置加载...
}

// 绑定事件监听
function bindEventListeners() {
    // 保存DeepSeek API设置
    document.getElementById('saveDeepseekApiBtn').addEventListener('click', function() {
        const apiKey = document.getElementById('deepseekApiKey').value.trim();
        localStorage.setItem('deepseekApiKey', apiKey);
        
        // 如果有API端点，也可以发送到服务器
        fetch('/api/settings/deepseek', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ api_key: apiKey })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showToast('DeepSeek API设置已保存', 'success');
            } else {
                showToast('保存设置失败: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('保存API设置出错:', error);
            // 即使服务器请求失败，也保存在本地
            showToast('已保存到本地，但同步到服务器失败', 'warning');
        });
    });
    
    // 测试DeepSeek API连接
    document.getElementById('testDeepseekApiBtn').addEventListener('click', function() {
        const apiKey = document.getElementById('deepseekApiKey').value.trim();
        
        if (!apiKey) {
            showToast('请先输入API密钥', 'warning');
            return;
        }
        
        // 显示测试中状态
        const testBtn = document.getElementById('testDeepseekApiBtn');
        testBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 测试中...';
        testBtn.disabled = true;
        
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
            if (data.status === 'success') {
                showToast('API连接测试成功！', 'success');
            } else {
                showToast('API连接测试失败: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('测试API连接出错:', error);
            showToast('测试API连接时出错: ' + error.message, 'error');
        })
        .finally(() => {
            // 恢复按钮状态
            testBtn.innerHTML = '测试连接';
            testBtn.disabled = false;
        });
    });
    
    // API密钥显示/隐藏切换
    document.getElementById('toggleDeepseekKeyBtn').addEventListener('click', function() {
        const apiKeyInput = document.getElementById('deepseekApiKey');
        const iconElement = this.querySelector('i');
        
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            iconElement.classList.remove('bx-show');
            iconElement.classList.add('bx-hide');
        } else {
            apiKeyInput.type = 'password';
            iconElement.classList.remove('bx-hide');
            iconElement.classList.add('bx-show');
        }
    });
    
    // 其他事件绑定...
}

// 显示提示信息
function showToast(message, type = 'info') {
    console.log('显示Toast消息:', message, type); // 添加日志以便调试
    
    // 简化Toast实现，不依赖Bootstrap的Toast API
    const toastClass = type === 'error' ? 'bg-danger' : 
                     type === 'success' ? 'bg-success' : 
                     type === 'warning' ? 'bg-warning' : 'bg-info';
    
    // 创建一个独立的toast元素
    const toast = document.createElement('div');
    toast.className = `toast ${toastClass} text-white`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.innerHTML = `<div class="toast-body">${message}</div>`;
    
    // 获取或创建Toast容器
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        // 如果容器不存在，创建一个
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    // 添加到容器
    toastContainer.appendChild(toast);
    
    // 手动显示Toast
    requestAnimationFrame(() => {
        // 确保DOM已更新
        toast.style.opacity = '1';
        
        // 自动隐藏
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            
            // 等待淡出动画完成后移除元素
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    });

    // 添加必要的样式
    const style = document.createElement('style');
    style.textContent = `
        #toastContainer {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
        }
        #toastContainer .toast {
            margin-bottom: 10px;
            opacity: 0;
            transition: opacity 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border-radius: 6px;
            overflow: hidden;
        }
    `;
    document.head.appendChild(style);
} 