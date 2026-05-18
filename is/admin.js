// js/admin.js - 锦玉小手机【管理端·终极版】

class CodeManager {
    constructor() {
        // 🌟 核心：统一使用这个名字，绝对不许变！
        this.STORAGE_KEY = 'jy_qualification_codes_v2';
        this.codes = this.loadCodes();
        this.init();
    }

    loadCodes() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        console.log("📂 管理后台加载数据:", data);
        return data ? JSON.parse(data) : [];
    }

    init() {
        this.renderStats();
        this.renderCodeList();
    }

    generateCodes() {
        const count = 5; // 默认生成5个
        const prefix = "JY";
        const newCodes = [];

        for (let i = 0; i < count; i++) {
            const random = Math.random().toString(36).substr(2, 6).toUpperCase();
            const code = `${prefix}${Date.now().toString(36).substr(-4).toUpperCase()}-${random}`;
            
            newCodes.push({
                code: code,
                used: false,
                usedBy: null,
                created: new Date().toISOString()
            });
        }
        
        this.codes = [...this.codes, ...newCodes];
        this.save();
        alert("🎉 成功生成5个码！请点击下方的‘复制’去使用。");
    }

    save() {
        // 🌟 核心：保存到统一宝箱
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.codes));
        console.log("💾 数据已存入宝箱:", this.codes);
        this.renderStats();
        this.renderCodeList();
    }

    renderStats() {
        const total = this.codes.length;
        document.getElementById('totalCodes').textContent = total;
    }

    renderCodeList() {
        const container = document.getElementById('codeListContainer');
        if (this.codes.length === 0) {
            container.innerHTML = '<div style="color:#999">空空如也，快点生成吧！</div>';
            return;
        }
        let html = '';
        // 倒序排列，让最新的码在最上面
        [...this.codes].reverse().forEach(code => {
            html += `
                <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
                    <span><strong>${code.code}</strong> ${code.used ? '🔴已用' : '🟢未用'}</span>
                    <button onclick="copyCode('${code.code}')" style="cursor:pointer">复制</button>
                </div>`;
        });
        container.innerHTML = html;
    }
}

const manager = new CodeManager();
window.generateCodes = () => manager.generateCodes();
window.copyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => alert('复制成功：' + code));
};
