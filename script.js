// EdgeTunnel 管理面板 JavaScript
class EdgeTunnelManager {
    constructor() {
        this.baseUrl = window.location.origin;
        this.config = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
    }

    bindEvents() {
        // 登录表单提交
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // 退出登录
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // 配置表单提交
        document.getElementById('basicConfigForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBasicConfig();
        });

        document.getElementById('subscriptionConfigForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSubscriptionConfig();
        });

        document.getElementById('proxyConfigForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProxyConfig();
        });
    }

    async checkAuthStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/admin/config.json`, {
                credentials: 'include'
            });

            if (response.ok) {
                this.config = await response.json();
                this.showAdminPage();
                this.loadDashboardData();
            } else {
                this.showLoginPage();
            }
        } catch (error) {
            console.error('检查认证状态失败:', error);
            this.showLoginPage();
        }
    }

    async handleLogin() {
        const password = document.getElementById('password').value;
        const messageEl = document.getElementById('loginMessage');

        if (!password) {
            this.showMessage('请输入密码', 'error', messageEl);
            return;
        }

        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `password=${encodeURIComponent(password)}`,
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage('登录成功', 'success', messageEl);
                setTimeout(() => {
                    this.checkAuthStatus();
                }, 1000);
            } else {
                this.showMessage('密码错误', 'error', messageEl);
            }
        } catch (error) {
            console.error('登录失败:', error);
            this.showMessage('登录失败，请重试', 'error', messageEl);
        }
    }

    async handleLogout() {
        try {
            await fetch(`${this.baseUrl}/logout`, {
                credentials: 'include'
            });
            this.showLoginPage();
        } catch (error) {
            console.error('退出登录失败:', error);
        }
    }

    async loadDashboardData() {
        try {
            // 加载配置信息
            const configResponse = await fetch(`${this.baseUrl}/admin/config.json`, {
                credentials: 'include'
            });
            
            if (configResponse.ok) {
                this.config = await configResponse.json();
                this.updateDashboard();
            }

            // 加载使用统计
            this.loadUsageStats();

        } catch (error) {
            console.error('加载数据失败:', error);
        }
    }

    updateDashboard() {
        if (!this.config) return;

        // 更新订阅链接
        const subLink = `${this.baseUrl}/sub?token=${this.config.优选订阅生成?.TOKEN || ''}`;
        document.getElementById('subLink').value = subLink;

        // 更新配置表单
        this.updateConfigForms();
    }

    updateConfigForms() {
        if (!this.config) return;

        // 基本配置
        document.getElementById('subName').value = this.config.优选订阅生成?.SUBNAME || 'EdgeTunnel';
        document.getElementById('subUpdateTime').value = this.config.优选订阅生成?.SUBUpdateTime || 6;
        document.getElementById('skipCertVerify').checked = this.config.跳过证书验证 || false;

        // 订阅配置
        document.getElementById('subApi').value = this.config.订阅转换配置?.SUBAPI || 'https://subapi.cmliussss.net';
        document.getElementById('subConfig').value = this.config.订阅转换配置?.SUBCONFIG || '';
        document.getElementById('subEmoji').checked = this.config.订阅转换配置?.SUBEMOJI || false;

        // 代理配置
        document.getElementById('proxyIP').value = this.config.反代?.PROXYIP || 'auto';
        document.getElementById('socks5Config').value = this.config.反代?.SOCKS5?.账号 || '';
        document.getElementById('globalProxy').checked = this.config.反代?.SOCKS5?.全局 || false;
    }

    async loadUsageStats() {
        try {
            const usage = this.config?.CF?.Usage;
            
            if (usage && usage.success) {
                document.getElementById('pagesUsage').textContent = usage.pages.toLocaleString();
                document.getElementById('workersUsage').textContent = usage.workers.toLocaleString();
                document.getElementById('totalUsage').textContent = usage.total.toLocaleString();
            } else {
                document.getElementById('pagesUsage').textContent = 'N/A';
                document.getElementById('workersUsage').textContent = 'N/A';
                document.getElementById('totalUsage').textContent = 'N/A';
            }
        } catch (error) {
            console.error('加载使用统计失败:', error);
        }
    }

    async saveBasicConfig() {
        try {
            const configData = {
                ...this.config,
                优选订阅生成: {
                    ...this.config.优选订阅生成,
                    SUBNAME: document.getElementById('subName').value,
                    SUBUpdateTime: parseInt(document.getElementById('subUpdateTime').value)
                },
                跳过证书验证: document.getElementById('skipCertVerify').checked
            };

            const response = await fetch(`${this.baseUrl}/admin/config.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(configData),
                credentials: 'include'
            });

            if (response.ok) {
                this.showMessage('基本配置保存成功', 'success');
                this.config = configData;
                this.updateDashboard();
            } else {
                throw new Error('保存失败');
            }
        } catch (error) {
            console.error('保存基本配置失败:', error);
            this.showMessage('保存失败', 'error');
        }
    }

    async saveSubscriptionConfig() {
        try {
            const configData = {
                ...this.config,
                订阅转换配置: {
                    SUBAPI: document.getElementById('subApi').value,
                    SUBCONFIG: document.getElementById('subConfig').value,
                    SUBEMOJI: document.getElementById('subEmoji').checked
                }
            };

            const response = await fetch(`${this.baseUrl}/admin/config.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(configData),
                credentials: 'include'
            });

            if (response.ok) {
                this.showMessage('订阅配置保存成功', 'success');
                this.config = configData;
            } else {
                throw new Error('保存失败');
            }
        } catch (error) {
            console.error('保存订阅配置失败:', error);
            this.showMessage('保存失败', 'error');
        }
    }

    async saveProxyConfig() {
        try {
            const configData = {
                ...this.config,
                反代: {
                    ...this.config.反代,
                    PROXYIP: document.getElementById('proxyIP').value,
                    SOCKS5: {
                        ...this.config.反代?.SOCKS5,
                        账号: document.getElementById('socks5Config').value,
                        全局: document.getElementById('globalProxy').checked
                    }
                }
            };

            const response = await fetch(`${this.baseUrl}/admin/config.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(configData),
                credentials: 'include'
            });

            if (response.ok) {
                this.showMessage('代理配置保存成功', 'success');
                this.config = configData;
            } else {
                throw new Error('保存失败');
            }
        } catch (error) {
            console.error('保存代理配置失败:', error);
            this.showMessage('保存失败', 'error');
        }
    }

    showLoginPage() {
        document.getElementById('loginPage').classList.add('active');
        document.getElementById('adminPage').classList.remove('active');
        document.getElementById('password').value = '';
    }

    showAdminPage() {
        document.getElementById('loginPage').classList.remove('active');
        document.getElementById('adminPage').classList.add('active');
    }

    showMessage(message, type, element = null) {
        const messageEl = element || document.getElementById('loginMessage');
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        
        setTimeout(() => {
            messageEl.textContent = '';
            messageEl.className = 'message';
        }, 3000);
    }
}

// 全局函数
function copySubLink() {
    const subLink = document.getElementById('subLink');
    subLink.select();
    document.execCommand('copy');
    
    // 显示复制成功提示
    const originalText = subLink.value;
    subLink.value = '已复制到剪贴板！';
    setTimeout(() => {
        subLink.value = originalText;
    }, 2000);
}

function showConfig() {
    const configSection = document.getElementById('configSection');
    configSection.scrollIntoView({ behavior: 'smooth' });
}

function refreshStats() {
    const manager = window.edgeTunnelManager;
    if (manager) {
        manager.loadUsageStats();
        manager.showMessage('统计数据已刷新', 'success');
    }
}

function exportConfig() {
    const manager = window.edgeTunnelManager;
    if (manager && manager.config) {
        const configStr = JSON.stringify(manager.config, null, 2);
        const blob = new Blob([configStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'edgetunnel-config.json';
        a.click();
        URL.revokeObjectURL(url);
    }
}

function showTab(tabName) {
    // 隐藏所有标签内容
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 移除所有标签按钮的激活状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 显示选中的标签内容
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // 激活选中的标签按钮
    event.target.classList.add('active');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.edgeTunnelManager = new EdgeTunnelManager();
});

// 添加键盘快捷键支持
document.addEventListener('keydown', (e) => {
    // Ctrl + R 刷新统计
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        refreshStats();
    }
    
    // Ctrl + E 导出配置
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        exportConfig();
    }
    
    // Ctrl + C 复制订阅链接
    if (e.ctrlKey && e.key === 'c') {
        const activeElement = document.activeElement;
        if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            copySubLink();
        }
    }
});

// 添加PWA支持
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((registration) => {
            console.log('SW registered: ', registration);
        }).catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}