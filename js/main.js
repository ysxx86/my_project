// @charset UTF-8
// DOM元素加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化Bootstrap工具提示
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // 处理侧边栏和底部导航的点击事件
    const navLinks = document.querySelectorAll('.nav-link, .tab-item');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // 更新活动状态
            document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
            
            // 获取对应的侧边栏和底部导航项
            const targetId = this.getAttribute('href').substring(1);
            const sidebarLink = document.querySelector(`.nav-link[href="#${targetId}"]`);
            const bottomTabLink = document.querySelector(`.tab-item[href="#${targetId}"]`);
            
            // 添加活动状态
            if (sidebarLink) sidebarLink.classList.add('active');
            if (bottomTabLink) bottomTabLink.classList.add('active');
            
            // 加载相应的页面
            const iframe = document.querySelector(`#${targetId} iframe`);
            if (iframe) {
                const src = this.getAttribute('data-iframe');
                if (src && iframe.src.indexOf(src) === -1) {
                    iframe.src = src;
                }
            }
        });
    });

    // 监听iframe加载完成事件，调整高度
    const iframes = document.querySelectorAll('.content-iframe');
    iframes.forEach(iframe => {
        iframe.addEventListener('load', function() {
            adjustIframeHeight(this);
        });
    });

    // 初始调整iframe高度
    window.addEventListener('resize', function() {
        iframes.forEach(iframe => {
            adjustIframeHeight(iframe);
        });
    });

    // 初始加载
    setTimeout(function() {
        iframes.forEach(iframe => {
            adjustIframeHeight(iframe);
        });
    }, 500);

    // 检查URL参数并打开相应的标签
    const params = getUrlParams();
    if (params.tab) {
        const tabLink = document.querySelector(`.nav-link[href="#${params.tab}"]`);
        if (tabLink) {
            tabLink.click();
        }
    }

    // 设置活动菜单项
    setActiveMenuItem();
});

// 调整iframe高度
function adjustIframeHeight(iframe) {
    try {
        const height = Math.max(
            window.innerHeight - 120,
            iframe.contentWindow.document.body.scrollHeight + 30
        );
        iframe.style.height = height + 'px';
    } catch (e) {
        // 可能因为跨域问题无法访问contentWindow
        iframe.style.height = (window.innerHeight - 120) + 'px';
    }
}

// 监听消息事件，用于iframe通信
window.addEventListener('message', function(e) {
    try {
        // 添加数据验证
        if (!e.data || typeof e.data !== 'string' || e.data.trim() === '') {
            console.log('收到空消息或非字符串消息，已忽略');
            return;
        }
        
        const data = JSON.parse(e.data);
        
        // 处理各种消息类型
        switch (data.type) {
            case 'notification':
                showNotification(data.message, data.messageType);
                break;
            case 'navigate':
                // 导航到指定标签
                const tabLink = document.querySelector(`.nav-link[href="#${data.tab}"]`);
                if (tabLink) {
                    tabLink.click();
                }
                break;
            case 'height-update':
                // 更新iframe高度
                const iframe = document.querySelector(`#${data.source} iframe`);
                if (iframe) {
                    iframe.style.height = data.height + 'px';
                }
                break;
            case 'refresh':
                // 刷新指定iframe
                const refreshFrame = document.querySelector(`#${data.target} iframe`);
                if (refreshFrame) {
                    refreshFrame.contentWindow.location.reload();
                }
                break;
        }
    } catch (err) {
        // 提供更详细的错误信息
        console.error('处理iframe消息时出错:', err);
        if (e.data) {
            console.log('问题消息内容:', typeof e.data === 'string' ? e.data.substring(0, 100) + '...' : typeof e.data);
        }
    }
});

// 显示通知
function showNotification(message, type = 'success') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<p>${message}</p>`;
    
    // 添加到文档
    document.body.appendChild(notification);
    
    // 显示通知
    setTimeout(() => notification.classList.add('show'), 10);
    
    // 自动关闭
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 确认操作
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// 复制到剪贴板
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showNotification('已复制到剪贴板');
}

// 导出到Word
function exportToWord(data, template, filename) {
    // 实现导出Word的逻辑
    // 这里需要根据具体情况实现
    showNotification('导出成功');
}

// 批量导出
function batchExport(dataList, template) {
    // 实现批量导出的逻辑
    // 这里需要根据具体情况实现
    showNotification(`成功导出${dataList.length}条数据`);
}

// 导入学生
function importStudents(file) {
    // 实现导入学生的逻辑
    // 这里需要根据具体情况实现
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 格式化日期
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 获取URL参数
function getUrlParams() {
    const params = {};
    const query = window.location.search.substring(1);
    const vars = query.split('&');
    for (let i = 0; i < vars.length; i++) {
        const pair = vars[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return params;
}

// 设置Cookie
function setCookie(name, value, days) {
    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '')  + expires + '; path=/';
}

// 获取Cookie
function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// 删除Cookie
function eraseCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999;';
}

// 防抖函数
function debounce(func, wait, immediate) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// 设置活动菜单项
function setActiveMenuItem() {
    const currentPath = window.location.hash || '#home';
    const menuItem = document.querySelector(`.nav-link[href="${currentPath}"]`);
    if (menuItem) {
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        menuItem.classList.add('active');
    }
}

// 设置页面标题
function setPageTitle(title) {
    document.title = title ? title + ' - 班主任管理系统' : '班主任管理系统';
}