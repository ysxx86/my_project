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

// 显示通知消息
function showToast(title, message, type) {
    // 检查是否有父窗口提供的通知函数
    if (window.parent && window.parent.showToast) {
        window.parent.showToast(title, message, type);
        return;
    }
    
    // 如果没有父窗口提供的函数，则自己实现
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        // 创建toast容器
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = `toast bg-${type === 'error' ? 'danger' : type} text-white`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="toast-header bg-${type === 'error' ? 'danger' : type} text-white">
            <strong class="me-auto">${title}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    document.getElementById('toastContainer').appendChild(toast);
    
    // 显示toast
    const bsToast = new bootstrap.Toast(toast, { delay: 5000 });
    bsToast.show();
    
    // 自动删除
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
} 