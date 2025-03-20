// @charset UTF-8
// 初始化页面时加载数据库信息
document.addEventListener('DOMContentLoaded', function() {
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
    const toastClass = type === 'error' ? 'bg-danger' : 
                     type === 'success' ? 'bg-success' : 
                     type === 'warning' ? 'bg-warning' : 'bg-info';
    
    const toastHtml = `
        <div class="toast ${toastClass} text-white" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        // 如果容器不存在，创建一个
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    
    const toastElement = document.createElement('div');
    toastElement.innerHTML = toastHtml;
    document.getElementById('toastContainer').appendChild(toastElement.firstChild);
    
    const toast = new bootstrap.Toast(document.getElementById('toastContainer').lastChild, {
        delay: 3000
    });
    toast.show();
} 