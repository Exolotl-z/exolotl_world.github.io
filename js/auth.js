// ===== 权限验证模块 =====

class Auth {
    constructor() {
        // 默认密码的哈希值（SHA-256）
        // 默认密码: "admin123"
        this.defaultPasswordHash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
        this.sessionKey = 'auth_session';
        this.passwordKey = 'auth_password_hash';
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24小时
    }

    // 初始化密码（首次使用或重置）
    initPassword() {
        const savedHash = localStorage.getItem(this.passwordKey);
        if (!savedHash) {
            localStorage.setItem(this.passwordKey, this.defaultPasswordHash);
        }
    }

    // SHA-256哈希函数
    async hashPassword(password) {
        const msgBuffer = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // 验证密码
    async verifyPassword(password) {
        this.initPassword();
        const hash = await this.hashPassword(password);
        const savedHash = localStorage.getItem(this.passwordKey);
        return hash === savedHash;
    }

    // 登录
    async login(password) {
        const isValid = await this.verifyPassword(password);
        if (isValid) {
            const session = {
                timestamp: Date.now(),
                expires: Date.now() + this.sessionTimeout
            };
            sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
            return true;
        }
        return false;
    }

    // 检查是否已登录
    isAuthenticated() {
        const sessionData = sessionStorage.getItem(this.sessionKey);
        if (!sessionData) return false;

        try {
            const session = JSON.parse(sessionData);
            const now = Date.now();
            
            // 检查会话是否过期
            if (now > session.expires) {
                this.logout();
                return false;
            }
            
            return true;
        } catch (e) {
            return false;
        }
    }

    // 登出
    logout() {
        sessionStorage.removeItem(this.sessionKey);
    }

    // 修改密码
    async changePassword(oldPassword, newPassword) {
        const isValid = await this.verifyPassword(oldPassword);
        if (!isValid) {
            return { success: false, message: '原密码错误' };
        }

        if (newPassword.length < 6) {
            return { success: false, message: '新密码至少需要6个字符' };
        }

        const newHash = await this.hashPassword(newPassword);
        localStorage.setItem(this.passwordKey, newHash);
        
        return { success: true, message: '密码修改成功' };
    }

    // 重置为默认密码
    resetPassword() {
        localStorage.setItem(this.passwordKey, this.defaultPasswordHash);
        this.logout();
    }

    // 显示登录对话框
    async showLoginDialog(message = '请输入管理员密码') {
        return new Promise((resolve) => {
            // 创建遮罩层
            const overlay = document.createElement('div');
            overlay.className = 'auth-overlay';
            overlay.innerHTML = `
                <div class="auth-dialog">
                    <div class="auth-header">
                        <i class="fas fa-lock"></i>
                        <h2>权限验证</h2>
                    </div>
                    <div class="auth-body">
                        <p class="auth-message">${message}</p>
                        <input type="password" id="authPassword" class="auth-input" placeholder="请输入密码" autocomplete="off">
                        <p class="auth-hint">默认密码：admin123</p>
                        <p class="auth-error" id="authError" style="display: none;"></p>
                    </div>
                    <div class="auth-footer">
                        <button class="btn btn-secondary" id="authCancel">取消</button>
                        <button class="btn btn-primary" id="authSubmit">确认</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
            document.getElementById('authPassword').focus();

            // 取消按钮
            document.getElementById('authCancel').addEventListener('click', () => {
                document.body.removeChild(overlay);
                resolve(false);
            });

            // 确认按钮
            const submitBtn = document.getElementById('authSubmit');
            const handleSubmit = async () => {
                const password = document.getElementById('authPassword').value;
                const errorEl = document.getElementById('authError');

                if (!password) {
                    errorEl.textContent = '请输入密码';
                    errorEl.style.display = 'block';
                    return;
                }

                submitBtn.disabled = true;
                submitBtn.textContent = '验证中...';

                const success = await this.login(password);

                if (success) {
                    document.body.removeChild(overlay);
                    resolve(true);
                } else {
                    errorEl.textContent = '密码错误，请重试';
                    errorEl.style.display = 'block';
                    submitBtn.disabled = false;
                    submitBtn.textContent = '确认';
                    document.getElementById('authPassword').value = '';
                    document.getElementById('authPassword').focus();
                }
            };

            submitBtn.addEventListener('click', handleSubmit);

            // 支持回车提交
            document.getElementById('authPassword').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSubmit();
                }
            });

            // 点击遮罩层取消
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    document.body.removeChild(overlay);
                    resolve(false);
                }
            });
        });
    }

    // 页面保护 - 需要验证才能访问
    async protectPage() {
        if (!this.isAuthenticated()) {
            const success = await this.showLoginDialog('此页面需要管理员权限访问');
            if (!success) {
                // 跳转回首页
                window.location.href = 'index.html';
                return false;
            }
        }
        return true;
    }
}

// 创建全局实例
const auth = new Auth();

// 添加样式
const style = document.createElement('style');
style.textContent = `
.auth-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    animation: fadeIn 0.3s ease-out;
}

.auth-dialog {
    background: var(--bg-primary);
    width: 90%;
    max-width: 400px;
    border: 1px solid var(--border-color);
    animation: slideInUp 0.3s ease-out;
}

.auth-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.auth-header i {
    font-size: 1.5rem;
    color: var(--text-primary);
}

.auth-header h2 {
    font-size: 1.25rem;
    font-weight: 500;
    margin: 0;
    color: var(--text-primary);
}

.auth-body {
    padding: 2rem 1.5rem;
}

.auth-message {
    margin-bottom: 1.5rem;
    color: var(--text-secondary);
    font-size: 0.9375rem;
}

.auth-input {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 0.9375rem;
    transition: all var(--transition-base);
    outline: none;
}

.auth-input:focus {
    border-color: var(--text-primary);
    background: var(--bg-primary);
}

.auth-hint {
    margin-top: 0.75rem;
    font-size: 0.8125rem;
    color: var(--text-light);
}

.auth-error {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: rgba(220, 38, 38, 0.1);
    border: 1px solid rgba(220, 38, 38, 0.3);
    color: #dc2626;
    font-size: 0.875rem;
}

.auth-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
}

@keyframes slideInUp {
    from {
        transform: translateY(20px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}
`;
document.head.appendChild(style);
