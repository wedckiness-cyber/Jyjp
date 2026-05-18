let currentCode = "";

function setupEditable(textId, inputId) {
    const txt = document.getElementById(textId);
    const inp = document.getElementById(inputId);
    txt.ondblclick = () => { 
        txt.style.display = 'none'; 
        inp.style.display = 'block'; 
        inp.value = txt.innerText; 
        inp.focus(); 
    };
    document.addEventListener('click', (e) => {
        if (e.target !== inp && inp.style.display === 'block') {
            txt.innerText = inp.value || (textId === 'welcomeMain' ? "欢迎使用" : "锦玉小手机");
            txt.style.display = 'block'; 
            inp.style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    setupEditable('welcomeMain', 'inputMain'); 
    setupEditable('welcomeSub', 'inputSub');

    const leftPaw = document.getElementById('leftPaw');
    const leftMenu = document.getElementById('leftMenu');
    const rightPaw = document.getElementById('rightPaw');
    const rightMenu = document.getElementById('rightMenu');

    leftPaw.onclick = (e) => { 
        e.stopPropagation(); 
        leftMenu.style.display = leftMenu.style.display === 'flex' ? 'none' : 'flex'; 
        rightMenu.style.display = 'none'; 
    };
    
    rightPaw.onclick = (e) => { 
        e.stopPropagation(); 
        rightMenu.style.display = rightMenu.style.display === 'flex' ? 'none' : 'flex'; 
        leftMenu.style.display = 'none'; 
    };

    document.getElementById('optBook').onclick = (e) => {
        e.stopPropagation(); 
        document.querySelectorAll('.mini-notebook').forEach(b => b.classList.toggle('stop-anim'));
        document.getElementById('optBook').style.color = document.getElementById('nbLeft').classList.contains('stop-anim') ? '#ccc' : '#8b7355';
    };
    
    document.getElementById('optPaw').onclick = (e) => {
        e.stopPropagation(); 
        document.querySelectorAll('.cat-paw-svg').forEach(p => p.classList.toggle('stop-anim'));
        document.getElementById('optPaw').style.color = document.getElementById('leftPaw').classList.contains('stop-anim') ? '#ccc' : '#8b7355';
    };
    
    document.getElementById('optInput').onclick = (e) => {
        e.stopPropagation(); 
        document.getElementById('welcomeCard').classList.toggle('stop-anim');
        document.getElementById('optInput').style.color = document.getElementById('welcomeCard').classList.contains('stop-anim') ? '#ccc' : '#8b7355';
    };
    
    document.getElementById('optKeypad').onclick = (e) => {
        e.stopPropagation(); 
        document.getElementById('mainKeypad').classList.toggle('stop-anim');
        document.getElementById('optKeypad').style.color = document.getElementById('mainKeypad').classList.contains('stop-anim') ? '#ccc' : '#8b7355';
    };

    document.addEventListener('click', () => { 
        leftMenu.style.display = 'none'; 
        rightMenu.style.display = 'none'; 
    });

    const flowerBtn = document.getElementById('flowerBtnHome');
    const windowPane = document.getElementById('windowPane');
    const windowShadow = document.getElementById('windowShadow');
    const timeDisplay = document.getElementById('timeDisplay');
    
    if (flowerBtn && windowPane && windowShadow) {
        flowerBtn.addEventListener('click', function(e) {
            console.log('🌺 点击窗户小花');
            windowPane.classList.toggle('turning');
            
            if (windowPane.classList.contains('turning')) {
                windowShadow.classList.add('visible');
                startTimeUpdate();
            } else {
                windowShadow.classList.remove('visible');
                stopTimeUpdate();
            }
        });
    }
    
    if (timeDisplay) {
        timeDisplay.classList.add('ancient-mode');
        updateTimeDisplay();
    }

    const lockEnabled = localStorage.getItem('jy_lock_enabled') !== 'false';
    
    if (lockEnabled) {
        document.getElementById('lockScreen').style.display = 'flex';
        document.getElementById('homeScreen').style.display = 'none';
        
        // 锁屏时隐藏Dock和杏花
        const dockArea = document.getElementById('dockArea');
        const apricotNav = document.getElementById('apricotNav');
        if (dockArea) dockArea.style.display = 'none';
        if (apricotNav) apricotNav.style.display = 'none';
    } else {
        document.getElementById('lockScreen').style.display = 'none';
        document.getElementById('homeScreen').style.display = 'flex';
        
        // 无锁屏时显示Dock和杏花
        const dockArea = document.getElementById('dockArea');
        const apricotNav = document.getElementById('apricotNav');
        if (dockArea) dockArea.style.display = 'flex';
        if (apricotNav) apricotNav.style.display = 'block';
    }

    setTimeout(function() {
        const apricotNav = document.getElementById('apricotNav');
        const dockArea = document.getElementById('dockArea');
        let flowerVisible = false;

        console.log('🌸 杏花初始化:', apricotNav, dockArea);

        if (dockArea && apricotNav) {
            dockArea.addEventListener('dblclick', function(e) {
                console.log('👆👆 双击了 Dock');
                
                // 切换杏花显示/隐藏
                if (flowerVisible) {
                    apricotNav.classList.remove('show');
                    flowerVisible = false;
                    console.log('❌ 隐藏杏花');
                } else {
                    apricotNav.classList.add('show');
                    flowerVisible = true;
                    console.log('✅ 显示杏花');
                }
            });

            apricotNav.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('🌸 点击杏花');
                
                const leftScreen = document.getElementById('leftScreen');
                const rightScreen = document.getElementById('rightScreen');
                
                if (leftScreen && rightScreen) {
                    if (leftScreen.classList.contains('hidden')) {
                        leftScreen.classList.remove('hidden');
                        rightScreen.classList.remove('active');
                        console.log('👈 切到左屏');
                    } else {
                        leftScreen.classList.add('hidden');
                        rightScreen.classList.add('active');
                        console.log('👉 切到右屏');
                    }
                    
                    this.classList.add('clicked');
                    setTimeout(() => this.classList.remove('clicked'), 500);
                }
            });

            console.log('✅ 杏花事件绑定完成');
        } else {
            console.error('❌ 找不到杏花或Dock');
        }
    }, 500);
});

function press(n) {
    if(n === 'C') currentCode = "";
    else if(n === 'D') currentCode = currentCode.slice(0, -1);
    else if(currentCode.length < 4) currentCode += n;
    updateDots();
    if(currentCode.length === 4) validate();
}

function updateDots() {
    document.querySelectorAll('.dot').forEach((d, i) => d.className = i < currentCode.length ? 'dot filled' : 'dot');
}

function validate() {
    let hsDeviceId = localStorage.getItem('jy_device_id');

if (!hsDeviceId) {
    hsDeviceId = 'device_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('jy_device_id', hsDeviceId);
}

const saved = localStorage.getItem('jy_password_hash');
const hash = btoa(currentCode + hsDeviceId);

if (!saved && currentCode === "1234") {
    const newHash = btoa('1234' + hsDeviceId);
    localStorage.setItem('jy_password_hash', newHash);
    unlock();
}

    else if (saved && hash === saved) {
        unlock();
    } 
    else {
        showError();
    }
}

function unlock() {
    document.getElementById('lockScreen').classList.add('unlocked');
    
    // 显示Dock和杏花
    const dockArea = document.getElementById('dockArea');
    const apricotNav = document.getElementById('apricotNav');
    if (dockArea) dockArea.style.display = 'flex';
    if (apricotNav) apricotNav.style.display = 'block';
    
    setTimeout(() => { 
        document.getElementById('lockScreen').style.display='none'; 
        document.getElementById('homeScreen').style.display='flex'; 
    }, 800);
}

function showError() {
    document.getElementById('dots').classList.add('shake');
    document.querySelectorAll('.dot').forEach(d => d.classList.add('error'));
    setTimeout(() => { 
        currentCode = ""; 
        updateDots(); 
        document.getElementById('dots').classList.remove('shake'); 
    }, 500);
}

function openApp(appName, appTitle) {
    const overlay = document.getElementById('app-overlay');
    const title = document.querySelector('.app-title');
    
    if (!overlay) return;
    
    title.textContent = appTitle;
    title.style.marginTop = '30px';
    
    const placeholder = document.getElementById('app-placeholder');
    if (placeholder) placeholder.style.display = 'none';
    
    document.querySelectorAll('.app-content [id^="app-"]').forEach(app => {
        app.style.display = 'none';
    });

    const targetApp = document.getElementById('app-' + appName);
    if (targetApp) {
        targetApp.style.display = 'block';
        if (appName === 'settings' && typeof initSettings === 'function') {
            initSettings();
        }
    } else {
        let ph = document.getElementById('app-placeholder');
        if (!ph) {
            ph = document.createElement('div');
            ph.id = 'app-placeholder';
            ph.style.cssText = 'text-align:center; margin-top:50px; color:#8b7355;';
            document.querySelector('.app-content').appendChild(ph);
        }
        ph.textContent = '应用 ' + appName + ' 尚未实现';
        ph.style.display = 'block';
    }
    
    overlay.classList.add('active');
    overlay.style.display = 'flex';
    overlay.style.zIndex = '9999';
}

function closeApp() {
    const overlay = document.getElementById('app-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.style.display = 'none';
    }
}

let timeMode = 'ancient';
let timeUpdateInterval = null;

function getChineseTime() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    const timeMap = {
        23: '子时', 0: '子时', 1: '丑时', 2: '丑时',
        3: '寅时', 4: '寅时', 5: '卯时', 6: '卯时',
        7: '辰时', 8: '辰时', 9: '巳时', 10: '巳时',
        11: '午时', 12: '午时', 13: '未时', 14: '未时',
        15: '申时', 16: '申时', 17: '酉时', 18: '酉时',
        19: '戌时', 20: '戌时', 21: '亥时', 22: '亥时'
    };
    
    let ke = '初刻';
    if (minute >= 15 && minute < 30) ke = '二刻';
    else if (minute >= 30 && minute < 45) ke = '三刻';
    else if (minute >= 45) ke = '四刻';
    
    return timeMap[hour] + ke;
}

function getModernTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function updateTimeDisplay() {
    const timeDisplay = document.getElementById('timeDisplay');
    if (!timeDisplay) return;
    
    if (timeMode === 'ancient') {
        timeDisplay.textContent = getChineseTime();
    } else {
        timeDisplay.textContent = getModernTime();
    }
}

function toggleTimeMode() {
    const timeDisplay = document.getElementById('timeDisplay');
    const windowShadow = document.getElementById('windowShadow');
    if (!timeDisplay || !windowShadow) return;
    
    timeDisplay.style.opacity = '0';
    
    setTimeout(() => {
        if (timeMode === 'ancient') {
            timeMode = 'modern';
            timeDisplay.classList.remove('ancient-mode');
            timeDisplay.classList.add('modern-mode');
            windowShadow.classList.add('modern-time-mode');
        } else {
            timeMode = 'ancient';
            timeDisplay.classList.remove('modern-mode');
            timeDisplay.classList.add('ancient-mode');
            windowShadow.classList.remove('modern-time-mode');
        }
        
        stopTimeUpdate();
        startTimeUpdate();
        updateTimeDisplay();
        timeDisplay.style.opacity = '1';
    }, 150);
}

function startTimeUpdate() {
    stopTimeUpdate();
    if (timeMode === 'ancient') {
        timeUpdateInterval = setInterval(updateTimeDisplay, 60000);
    } else {
        timeUpdateInterval = setInterval(updateTimeDisplay, 1000);
    }
}

function stopTimeUpdate() {
    if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
        timeUpdateInterval = null;
    }
}
