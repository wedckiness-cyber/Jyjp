// ==========================================
// 锦玉小手机 - 设置页面功能
// app-settings.js
// ==========================================

// 全局变量
let deviceId = localStorage.getItem('jy_device_id');
if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('jy_device_id', deviceId);
}

// ==========================================
// 1. 黑夜/白天模式
// ==========================================
function applyDarkMode(isDark) {
    const body = document.body;
    const wallpaper = document.querySelector('.wallpaper');
    
    if (isDark) {
        body.style.background = '#2c2416';
        if (wallpaper) {
            wallpaper.style.background = 'linear-gradient(to bottom, #3a2f1f, #2c2416)';
        }
        body.classList.add('dark-mode');
        document.documentElement.style.setProperty('--text-color-light', '#e8dfc4');
    } else {
        body.style.background = '';
        if (wallpaper) {
            wallpaper.style.background = '';
        }
        body.classList.remove('dark-mode');
        document.documentElement.style.setProperty('--text-color-light', '');
    }
}

function toggleDarkMode() {
    const darkModeSwitch = document.getElementById('darkModeSwitch');
    if (!darkModeSwitch) return;
    
    const isDark = darkModeSwitch.checked;
    applyDarkMode(isDark);
    localStorage.setItem('jy_dark_mode', isDark ? 'true' : 'false');
}

// ==========================================
// 2. 全屏模式
// ==========================================
function applyFullscreenMode(isFullscreen) {
    const phoneContainer = document.querySelector('.phone-container');
    if (!phoneContainer) return;
    
    if (isFullscreen) {
        phoneContainer.style.width = '100vw';
        phoneContainer.style.height = '100vh';
        phoneContainer.style.borderRadius = '0';
        phoneContainer.style.boxShadow = 'none';
        phoneContainer.classList.add('fullscreen-mode');
    } else {
        phoneContainer.style.width = '320px';
        phoneContainer.style.height = '711px';
        phoneContainer.style.borderRadius = '';
        phoneContainer.style.boxShadow = '';
        phoneContainer.classList.remove('fullscreen-mode');
    }
}

function toggleFullscreenMode() {
    const fullscreenSwitch = document.getElementById('fullscreenSwitch');
    if (!fullscreenSwitch) return;
    
    const isFullscreen = fullscreenSwitch.checked;
    applyFullscreenMode(isFullscreen);
    localStorage.setItem('jy_fullscreen', isFullscreen ? 'true' : 'false');
}

// ==========================================
// 3. 锁屏密码开关
// ==========================================
function toggleLockScreen() {
    const lockScreenSwitch = document.getElementById('lockScreenSwitch');
    if (!lockScreenSwitch) return;
    
    const isEnabled = lockScreenSwitch.checked;
    localStorage.setItem('jy_lock_enabled', isEnabled ? 'true' : 'false');
    
    if (!isEnabled) {
        alert('⚠️ 已关闭锁屏密码\n下次刷新将直接进入主屏幕');
    } else {
        alert('✅ 已开启锁屏密码\n下次刷新需要输入密码');
    }
}

// ==========================================
// 4. 导出数据
// ==========================================
function exportData() {
    try {
        const exportData = {};
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('jy_')) {
                exportData[key] = localStorage.getItem(key);
            }
        }
        
        exportData._export_time = new Date().toISOString();
        exportData._export_date = new Date().toLocaleString('zh-CN');
        
        const jsonStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        a.download = `jinyu_backup_${dateStr}.json`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('✅ 数据导出成功！\n文件已保存到下载文件夹');
        
    } catch (error) {
        console.error('导出失败:', error);
        alert('❌ 数据导出失败，请重试');
    }
}

// ==========================================
// 5. 导入数据
// ==========================================
function importData() {
    const importFile = document.getElementById('importFile');
    if (importFile) {
        importFile.click();
    }
}

function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.json')) {
        alert('❌ 请选择 JSON 格式的备份文件');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            
            const dataKeys = Object.keys(importData).filter(key => 
                key.startsWith('jy_') && !key.startsWith('_')
            );
            
            if (dataKeys.length === 0) {
                alert('❌ 文件中没有找到有效的锦玉数据');
                return;
            }
            
            const confirmMsg = `📦 检测到 ${dataKeys.length} 项数据\n\n确定要导入吗？\n当前数据将被覆盖！`;
            
            if (!confirm(confirmMsg)) {
                return;
            }
            
            let successCount = 0;
            dataKeys.forEach(key => {
                try {
                    localStorage.setItem(key, importData[key]);
                    successCount++;
                } catch (err) {
                    console.error(`导入失败: ${key}`, err);
                }
            });
            
            alert(`✅ 导入成功！\n已恢复 ${successCount} 项数据\n\n页面即将刷新...`);
            
            setTimeout(() => {
                location.reload();
            }, 1500);
            
        } catch (error) {
            console.error('导入失败:', error);
            alert('❌ 文件格式错误，请检查是否为有效的备份文件');
        }
    };
    
    reader.onerror = function() {
        alert('❌ 文件读取失败，请重试');
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

// ==========================================
// 6. 密码修改
// ==========================================
function changePassword() {
    const oldPassword = document.getElementById('oldPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (!oldPassword || !newPassword || !confirmPassword) {
        alert('❌ 密码输入框未找到');
        return;
    }
    
    const oldPwd = oldPassword.value.trim();
    const newPwd = newPassword.value.trim();
    const confirmPwd = confirmPassword.value.trim();
    
    if (!oldPwd || !newPwd || !confirmPwd) {
        alert('❌ 请填写完整的密码信息');
        return;
    }
    
    if (newPwd !== confirmPwd) {
        alert('❌ 两次新密码不一致，请重新输入');
        newPassword.value = '';
        confirmPassword.value = '';
        newPassword.focus();
        return;
    }
    
    if (oldPwd === newPwd) {
        alert('❌ 新密码不能和旧密码相同');
        return;
    }
    
    if (newPwd.length < 4) {
        alert('❌ 密码长度至少为4位');
        return;
    }
    
    const currentHash = localStorage.getItem('jy_password_hash');
    const oldPwdHash = btoa(oldPwd + deviceId);
    
    if (currentHash && currentHash !== oldPwdHash) {
        alert('❌ 旧密码错误，请重新输入');
        oldPassword.value = '';
        oldPassword.focus();
        return;
    }
    
    if (!currentHash) {
        const confirm1 = confirm('🔐 检测到这是您第一次设置密码\n\n确定要设置密码吗？');
        if (!confirm1) return;
    }
    
    const newPwdHash = btoa(newPwd + deviceId);
    localStorage.setItem('jy_password_hash', newPwdHash);
    
    oldPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    
    alert('✅ 密码修改成功！\n请牢记新密码');
}

// ==========================================
// 7. 删除所有数据
// ==========================================
function deleteAllData() {
    const confirm1 = confirm('⚠️ 警告！\n\n确定要删除所有数据吗？\n此操作不可恢复！');
    if (!confirm1) return;
    
    const confirm2 = confirm('⚠️ 最后确认！\n\n删除后将清空：\n• 所有密码\n• 所有设置\n• 所有记录\n\n真的要删除吗？');
    if (!confirm2) return;
    
    try {
        const keysToDelete = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('jy_')) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => {
            localStorage.removeItem(key);
        });
        
        alert(`✅ 已删除 ${keysToDelete.length} 项数据\n\n页面即将刷新...`);
        
        setTimeout(() => {
            location.reload();
        }, 1500);
        
    } catch (error) {
        console.error('删除失败:', error);
        alert('❌ 删除失败，请重试');
    }
}

// ==========================================
// 8. 卡片展开/收起
// ==========================================
function togglePanel(card) {
    const panel = card.nextElementSibling;
    if (panel && panel.classList.contains('settings-panel')) {
        if (panel.style.display === 'block') {
            panel.style.display = 'none';
        } else {
            panel.style.display = 'block';
        }
    }
}

// ==========================================
// 9. 回到顶部按钮
// ==========================================
function initScrollToTop() {
    const scrollToTopBtn = document.getElementById('settingsScrollTop');
    const appContent = document.querySelector('.app-content');

    if (scrollToTopBtn && appContent) {
        appContent.addEventListener('scroll', function() {
            if (this.scrollTop > 100) {
                scrollToTopBtn.classList.add('show');
            } else {
                scrollToTopBtn.classList.remove('show');
            }
        });
        
        scrollToTopBtn.addEventListener('click', function() {
            appContent.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// ==========================================
// 10. 页面加载时初始化
// ==========================================
function initSettings() {
    console.log('🌸 锦玉设置初始化...');
    
    // 恢复黑夜模式
    const darkMode = localStorage.getItem('jy_dark_mode') === 'true';
    const darkModeSwitch = document.getElementById('darkModeSwitch');
    if (darkModeSwitch) {
        darkModeSwitch.checked = darkMode;
        applyDarkMode(darkMode);
        darkModeSwitch.addEventListener('change', toggleDarkMode);
    }
    
    // 恢复全屏模式
    const fullscreen = localStorage.getItem('jy_fullscreen') === 'true';
    const fullscreenSwitch = document.getElementById('fullscreenSwitch');
    if (fullscreenSwitch) {
        fullscreenSwitch.checked = fullscreen;
        applyFullscreenMode(fullscreen);
        fullscreenSwitch.addEventListener('change', toggleFullscreenMode);
    }
    
    // 恢复锁屏开关状态（默认开启）
    const lockEnabled = localStorage.getItem('jy_lock_enabled') !== 'false';
    const lockScreenSwitch = document.getElementById('lockScreenSwitch');
    if (lockScreenSwitch) {
        lockScreenSwitch.checked = lockEnabled;
        lockScreenSwitch.addEventListener('change', toggleLockScreen);
    }
    
    // 绑定导入文件处理
    const importFile = document.getElementById('importFile');
    if (importFile) {
        importFile.addEventListener('change', handleImportFile);
    }
    
    // 初始化回到顶部按钮
    initScrollToTop();
    
    console.log('✅ 设置初始化完成');
}

// ==========================================
// 11. 页面加载时自动执行
// ==========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettings);
} else {
    initSettings();
}

// ==========================================
// 12. 导出函数到全局
// ==========================================
window.exportData = exportData;
window.importData = importData;
window.changePassword = changePassword;
window.deleteAllData = deleteAllData;
window.toggleDarkMode = toggleDarkMode;
window.toggleFullscreenMode = toggleFullscreenMode;
window.toggleLockScreen = toggleLockScreen;
window.togglePanel = togglePanel;
window.initSettings = initSettings;

console.log('🌸 app-settings.js 加载完成');
