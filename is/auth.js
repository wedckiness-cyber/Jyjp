// js/auth.js

class AuthenticationSystem {
    constructor() {
        this.STORAGE_KEYS = {
            DEVICE_ID: 'jy_device_id',
            QUALIFICATION_CODE: 'jy_qualification_code',
            IS_VERIFIED: 'jy_is_verified',
            ADMIN_CODES: 'jy_qualification_codes_v2'
        };
        this.init();
    }

    // 🌟 自定义美化提示函数
    showNote(msg) {
        const alertEl = document.getElementById('classicAlert');
        if (alertEl) {
            alertEl.innerText = msg;
            alertEl.style.display = 'block';
            setTimeout(() => { alertEl.style.display = 'none'; }, 3000);
        } else {
            alert(msg); // 兜底
        }
    }

    init() {
        let deviceId = localStorage.getItem(this.STORAGE_KEYS.DEVICE_ID);
        if (!deviceId) {
            deviceId = 'JY-' + Math.random().toString(36).substring(2, 10).toUpperCase();
            localStorage.setItem(this.STORAGE_KEYS.DEVICE_ID, deviceId);
        }
        document.getElementById('deviceId').textContent = deviceId;
        document.getElementById('verifyBtn').onclick = () => this.verifyCode();
    }

    verifyCode() {
        const code = document.getElementById('qualificationCode').value.trim().toUpperCase();
        if (!code) { this.showNote('宝宝，请先填入资格码哦~'); return; }

        const masterKeys = ['JY0003-MLGZ-ZWDU', 'JY0003-MLGZ-ZWDU6W', 'JINYU666', 'JY2024-ABCD-1234'];
        
        if (masterKeys.includes(code)) {
            this.grantAccess(code);
        } else {
            this.showNote('宝宝，这个码无效，请检查一下哦~');
        }
    }

    grantAccess(code) {
        localStorage.setItem(this.STORAGE_KEYS.IS_VERIFIED, 'true');
        localStorage.setItem(this.STORAGE_KEYS.QUALIFICATION_CODE, code);
        this.showNote('🎉 验证成功！正在为您开启...');
        setTimeout(() => { window.location.href = 'book.html'; }, 1200);
    }
}

window.onload = () => { new AuthenticationSystem(); };
