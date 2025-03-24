// @charset UTF-8
// 初始化页面时加载信息
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

// 加载设置
function loadSettings() {
    // 获取保存的API设置
    const apiKey = localStorage.getItem('deepseekApiKey') || '';
    const apiKeyInput = document.getElementById('deepseekApiKey');
    if (apiKeyInput) {
        apiKeyInput.value = apiKey;
    }
    
    // 获取保存的AI评语设置
    const commentLength = localStorage.getItem('commentLength') || 'medium';
    const commentStyle = localStorage.getItem('commentStyle') || 'encouraging';
    const commentLengthSelect = document.getElementById('commentLength');
    const commentStyleSelect = document.getElementById('commentStyle');
    
    if (commentLengthSelect) {
        commentLengthSelect.value = commentLength;
    }
    
    if (commentStyleSelect) {
        commentStyleSelect.value = commentStyle;
    }
    
    // 获取保存的重点关注设置
    const focusSettings = JSON.parse(localStorage.getItem('focusSettings') || '{"academic":true,"behavior":true,"activity":true,"suggestion":true}');
    
    const focusAcademic = document.getElementById('focusAcademic');
    const focusBehavior = document.getElementById('focusBehavior');
    const focusActivity = document.getElementById('focusActivity');
    const focusSuggestion = document.getElementById('focusSuggestion');
    
    if (focusAcademic) focusAcademic.checked = focusSettings.academic !== false;
    if (focusBehavior) focusBehavior.checked = focusSettings.behavior !== false;
    if (focusActivity) focusActivity.checked = focusSettings.activity !== false;
    if (focusSuggestion) focusSuggestion.checked = focusSettings.suggestion !== false;
}

// 绑定事件监听
function bindEventListeners() {
    // 保存DeepSeek API设置
    const saveDeepseekApiBtn = document.getElementById('saveDeepseekApiBtn');
    if (saveDeepseekApiBtn) {
        saveDeepseekApiBtn.addEventListener('click', function() {
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
    }
    
    // 测试DeepSeek API连接
    const testDeepseekApiBtn = document.getElementById('testDeepseekApiBtn');
    if (testDeepseekApiBtn) {
        testDeepseekApiBtn.addEventListener('click', function() {
            const apiKey = document.getElementById('deepseekApiKey').value.trim();
            
            if (!apiKey) {
                showToast('请先输入API密钥', 'warning');
                return;
            }
            
            // 测试API连接
            const apiStatus = document.getElementById('apiStatus');
            if (apiStatus) {
                apiStatus.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> 正在测试连接...';
                apiStatus.className = 'api-status mt-2';
                apiStatus.style.display = 'block';
                apiStatus.style.backgroundColor = '#f8f9fa';
            }
            
            // 发送测试请求到服务器
            fetch('/api/test-deepseek-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ api_key: apiKey })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    if (apiStatus) {
                        apiStatus.innerHTML = '<i class="bx bx-check-circle"></i> 连接成功';
                        apiStatus.className = 'api-status success mt-2';
                    }
                    showToast('API连接测试成功', 'success');
                } else {
                    if (apiStatus) {
                        apiStatus.innerHTML = `<i class="bx bx-error-circle"></i> 连接失败: ${data.message}`;
                        apiStatus.className = 'api-status error mt-2';
                    }
                    showToast('API连接测试失败: ' + data.message, 'error');
                }
            })
            .catch(error => {
                console.error('测试API连接出错:', error);
                if (apiStatus) {
                    apiStatus.innerHTML = '<i class="bx bx-error-circle"></i> 连接错误: 服务器请求失败';
                    apiStatus.className = 'api-status error mt-2';
                }
                showToast('测试API连接出错: 无法连接到服务器', 'error');
            });
        });
    }

    // 保存AI评语设置
    const saveAiSettingsBtn = document.getElementById('saveAiSettingsBtn');
    if (saveAiSettingsBtn) {
        saveAiSettingsBtn.addEventListener('click', function() {
            // 获取设置
            const commentLength = document.getElementById('commentLength').value;
            const commentStyle = document.getElementById('commentStyle').value;
            const focusAcademic = document.getElementById('focusAcademic').checked;
            const focusBehavior = document.getElementById('focusBehavior').checked;
            const focusActivity = document.getElementById('focusActivity').checked;
            const focusSuggestion = document.getElementById('focusSuggestion').checked;
            
            // 保存到本地存储
            localStorage.setItem('commentLength', commentLength);
            localStorage.setItem('commentStyle', commentStyle);
            localStorage.setItem('focusSettings', JSON.stringify({
                academic: focusAcademic,
                behavior: focusBehavior,
                activity: focusActivity,
                suggestion: focusSuggestion
            }));
            
            // 显示保存成功消息
            showToast('AI评语设置已保存', 'success');
        });
    }

    // 切换DeepSeek API密钥显示/隐藏
    const toggleDeepseekKeyBtn = document.getElementById('toggleDeepseekKeyBtn');
    if (toggleDeepseekKeyBtn) {
        toggleDeepseekKeyBtn.addEventListener('click', function() {
            const apiKeyInput = document.getElementById('deepseekApiKey');
            if (apiKeyInput) {
                if (apiKeyInput.type === 'password') {
                    apiKeyInput.type = 'text';
                    toggleDeepseekKeyBtn.innerHTML = '<i class="bx bx-hide"></i>';
                } else {
                    apiKeyInput.type = 'password';
                    toggleDeepseekKeyBtn.innerHTML = '<i class="bx bx-show"></i>';
                }
            }
        });
    }

    // 设置版权年份
    const copyrightYearElem = document.getElementById('copyrightYear');
    if (copyrightYearElem) {
        copyrightYearElem.textContent = new Date().getFullYear();
    }
    
    // 设置最后更新时间
    const lastUpdateTimeElem = document.getElementById('lastUpdateTime');
    if (lastUpdateTimeElem) {
        // 获取最后更新时间，如果没有则使用当前时间
        const lastUpdate = localStorage.getItem('lastUpdateTime') || new Date().toISOString();
        lastUpdateTimeElem.textContent = new Date(lastUpdate).toLocaleDateString();
    }
}

// 添加通知样式
function addToastStyles() {
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

// 显示toast通知
function showToast(message, type = 'info') {
    // 创建通知容器
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        document.body.appendChild(toastContainer);
    }
    
    // 创建新的toast元素
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.minWidth = '300px';
    
    // 设置背景颜色和图标
    let backgroundColor, icon;
    switch (type) {
        case 'success':
            backgroundColor = '#4caf50';
            icon = 'bx-check-circle';
            break;
        case 'error':
            backgroundColor = '#f44336';
            icon = 'bx-error-circle';
            break;
        case 'warning':
            backgroundColor = '#ff9800';
            icon = 'bx-error';
            break;
        default:
            backgroundColor = '#2196f3';
            icon = 'bx-info-circle';
    }
    
    // 设置toast内容
    toast.innerHTML = `
        <div style="display: flex; align-items: center; padding: 12px 15px; color: white; background-color: ${backgroundColor};">
            <i class='bx ${icon}' style="font-size: 20px; margin-right: 10px;"></i>
            <div>${message}</div>
        </div>
    `;
    
    // 添加到容器
    toastContainer.appendChild(toast);
    
    // 显示通知
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);
    
    // 3秒后自动关闭
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 3000);
} 