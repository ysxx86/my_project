// @charset UTF-8
// DOM元素加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化Bootstrap工具提示
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // 初始化登录模态框
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    const registerBtn = document.getElementById('registerBtn');
    const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));

    // 点击登录按钮显示登录模态框
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            loginModal.show();
        });
    }

    // 点击注册按钮显示注册模态框
    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            loginModal.hide();
            registerModal.show();
        });
    }

    // 处理登录表单提交
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // 验证用户名和密码
            if (!username || !password) {
                showNotification('请输入用户名和密码', 'error');
                return;
            }
            
            // 验证用户
            const user = dataService.validateUser(username, password);
            if (user) {
                // 登录成功
                loginSuccess(user);
                loginModal.hide();
                showNotification(`欢迎回来，${user.teacherName}`);
            } else {
                showNotification('用户名或密码错误', 'error');
            }
        });
    }

    // 处理注册表单提交
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const teacherName = document.getElementById('teacherName').value;
            const teacherClass = document.getElementById('teacherClass').value;
            
            // 验证表单数据
            if (!username || !password || !confirmPassword || !teacherName || !teacherClass) {
                showNotification('请填写所有必填字段', 'error');
                return;
            }
            
            // 验证密码是否匹配
            if (password !== confirmPassword) {
                showNotification('两次输入的密码不一致', 'error');
                return;
            }
            
            // 检查用户名是否已存在
            const users = dataService.getUsers();
            if (users.find(u => u.username === username)) {
                showNotification('用户名已存在，请使用其他用户名', 'error');
                return;
            }
            
            // 创建新用户
            const newUser = {
                username,
                password,
                teacherName,
                teacherClass
            };
            
            // 添加用户
            const success = dataService.addUser(newUser);
            if (success) {
                // 注册成功，自动登录
                loginSuccess(newUser);
                registerModal.hide();
                showNotification('注册成功');
            } else {
                showNotification('注册失败，请稍后重试', 'error');
            }
        });
    }

    // 登录成功后更新用户信息
    function loginSuccess(user) {
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.innerHTML = `
                <span>欢迎，${user.teacherName}</span>
                <button class="btn btn-outline-danger btn-sm ms-2" id="logoutBtn">退出</button>
            `;
            
            // 添加退出按钮事件
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function() {
                    userInfo.innerHTML = `
                        <span>未登录</span>
                        <button class="btn btn-primary btn-sm ms-2" id="loginBtn">登录</button>
                    `;
                    // 重新绑定登录按钮事件
                    const newLoginBtn = document.getElementById('loginBtn');
                    if (newLoginBtn) {
                        newLoginBtn.addEventListener('click', function() {
                            loginModal.show();
                        });
                    }
                });
            }
        }
    }

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
            
            // 添加null检查
            if (sidebarLink) sidebarLink.classList.add('active');
            if (bottomTabLink) bottomTabLink.classList.add('active');
            
            // 更新iframe内容
            const iframeSrc = this.getAttribute('data-iframe');
            if (iframeSrc) {
                const targetPane = document.getElementById(targetId);
                if (targetPane) {
                    const iframe = targetPane.querySelector('iframe');
                    if (iframe && iframe.getAttribute('src') !== iframeSrc) {
                        iframe.setAttribute('src', iframeSrc);
                    }
                }
            }
        });
    });

    // 处理iframe高度自适应
    function adjustIframeHeight() {
        const iframes = document.querySelectorAll('.content-iframe');
        const contentArea = document.querySelector('.content-area');
        if (contentArea && iframes.length > 0) {
            const height = contentArea.offsetHeight;
            iframes.forEach(iframe => {
                iframe.style.height = `${height}px`;
            });
        }
    }

    // 初始调整iframe高度
    adjustIframeHeight();

    // 窗口大小改变时调整iframe高度
    window.addEventListener('resize', adjustIframeHeight);
});

// 全局函数：显示通知
function showNotification(message, type = 'success') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} fade-in`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="bx ${type === 'success' ? 'bx-check-circle' : type === 'error' ? 'bx-x-circle' : 'bx-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 全局函数：确认对话框
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// 全局函数：复制到剪贴板
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showNotification('已复制到剪贴板');
}

// 全局函数：导出数据到Word
function exportToWord(data, template, filename) {
    // 实际应用中应该发送到服务器处理
    // 这里仅作为示例
    showNotification(`正在导出 ${filename}...`, 'info');
    setTimeout(() => {
        showNotification(`${filename} 导出成功！`, 'success');
    }, 1500);
}

// 全局函数：批量导出数据
function batchExport(dataList, template) {
    // 实际应用中应该发送到服务器处理
    // 这里仅作为示例
    showNotification(`正在批量导出 ${dataList.length} 个文件...`, 'info');
    setTimeout(() => {
        showNotification(`批量导出完成！`, 'success');
    }, 2000);
}

// 全局函数：导入学生数据
function importStudents(file) {
    // 实际应用中应该读取文件内容并解析
    // 这里仅作为示例
    showNotification('正在导入学生数据...', 'info');
    setTimeout(() => {
        showNotification('学生数据导入成功！', 'success');
    }, 1500);
}

// 全局函数：生成随机ID
function generateId() {
    return Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

// 全局函数：格式化日期
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 全局函数：解析URL参数
function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return params;
}

// 全局函数：设置Cookie
function setCookie(name, value, days) {
    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/';
}

// 全局函数：获取Cookie
function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// 全局函数：删除Cookie
function eraseCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999;';
}

// 全局函数：本地存储操作
const storage = {
    set: function(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    get: function(key) {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    },
    remove: function(key) {
        localStorage.removeItem(key);
    },
    clear: function() {
        localStorage.clear();
    }
};