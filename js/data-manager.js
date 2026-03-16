// ===== 数据同步管理器 =====
// 负责从JSON文件加载数据，以及导出数据供GitHub同步

class DataManager {
    constructor() {
        this.dataPath = 'data/';
        this.blogDataFile = 'blog-data.json';
        this.ideasDataFile = 'ideas-data.json';
        this.commentsDataFile = 'comments.json';
    }

    // 从JSON文件加载博客文章
    async loadBlogData() {
        try {
            const response = await fetch(this.dataPath + this.blogDataFile);
            if (!response.ok) {
                console.warn('无法加载博客数据文件，使用本地存储');
                return storage.get('blog_articles') || [];
            }
            const data = await response.json();
            console.log('从JSON文件加载博客数据:', data.length, '篇文章');

            // 保存到本地存储作为缓存
            storage.set('blog_articles', data);

            return data;
        } catch (error) {
            console.warn('加载博客数据失败:', error);
            return storage.get('blog_articles') || [];
        }
    }

    // 从JSON文件加载奇思妙想
    async loadIdeasData() {
        try {
            const response = await fetch(this.dataPath + this.ideasDataFile);
            if (!response.ok) {
                console.warn('无法加载想法数据文件，使用本地存储');
                return storage.get('ideas') || [];
            }
            const data = await response.json();
            console.log('从JSON文件加载想法数据:', data.length, '条');

            // 保存到本地存储作为缓存
            storage.set('ideas', data);

            return data;
        } catch (error) {
            console.warn('加载想法数据失败:', error);
            return storage.get('ideas') || [];
        }
    }

    // 从JSON文件加载评论
    async loadCommentsData() {
        try {
            const response = await fetch(this.dataPath + this.commentsDataFile);
            if (!response.ok) {
                console.warn('无法加载评论数据文件，使用本地存储');
                return storage.get('idea_comments') || {};
            }
            const data = await response.json();
            console.log('从JSON文件加载评论数据');

            // 保存到本地存储
            storage.set('idea_comments', data.ideas || {});

            return data;
        } catch (error) {
            console.warn('加载评论数据失败:', error);
            return storage.get('idea_comments') || {};
        }
    }

    // 导出所有数据为JSON文件
    exportAllData() {
        const blogData = storage.get('blog_articles') || [];
        const ideasData = storage.get('ideas') || [];
        const commentsData = {
            blog: storage.get('blog_comments') || {},
            ideas: storage.get('idea_comments') || {}
        };

        // 创建下载
        this.downloadJSON(blogData, 'blog-data.json', '博客文章数据已导出');
        this.downloadJSON(ideasData, 'ideas-data.json', '奇思妙想数据已导出');
        this.downloadJSON(commentsData, 'comments.json', '评论数据已导出');

        return true;
    }

    // 导出博客数据
    exportBlogData() {
        const data = storage.get('blog_articles') || [];
        this.downloadJSON(data, 'blog-data.json', '博客数据已导出');
    }

    // 导出想法数据
    exportIdeasData() {
        const data = storage.get('ideas') || [];
        this.downloadJSON(data, 'ideas-data.json', '想法数据已导出');
    }

    // 导出评论数据
    exportCommentsData() {
        const data = {
            blog: storage.get('blog_comments') || {},
            ideas: storage.get('idea_comments') || {}
        };
        this.downloadJSON(data, 'comments.json', '评论数据已导出');
    }

    // 下载JSON文件
    downloadJSON(data, filename, message) {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(message, filename);
    }

    // 显示导出面板
    showExportPanel() {
        // 移除已存在的面板
        const existing = document.getElementById('exportPanel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = 'exportPanel';
        panel.innerHTML = `
            <div class="export-panel-overlay"></div>
            <div class="export-panel-content">
                <div class="export-panel-header">
                    <h3><i class="fas fa-download"></i> 数据导出</h3>
                    <button class="export-close-btn">&times;</button>
                </div>
                <div class="export-panel-body">
                    <p class="export-hint">导出的JSON文件请放入项目的 <code>data/</code> 目录，然后提交到GitHub即可同步数据。</p>
                    <div class="export-options">
                        <button class="export-option-btn" id="exportAllBtn">
                            <i class="fas fa-file-export"></i>
                            <span>导出全部数据</span>
                            <small>包含文章、想法、评论</small>
                        </button>
                        <button class="export-option-btn" id="exportBlogBtn">
                            <i class="fas fa-newspaper"></i>
                            <span>导出博客文章</span>
                            <small>blog-data.json</small>
                        </button>
                        <button class="export-option-btn" id="exportIdeasBtn">
                            <i class="fas fa-lightbulb"></i>
                            <span>导出奇思妙想</span>
                            <small>ideas-data.json</small>
                        </button>
                        <button class="export-option-btn" id="exportCommentsBtn">
                            <i class="fas fa-comments"></i>
                            <span>导出评论</span>
                            <small>comments.json</small>
                        </button>
                    </div>
                    <div class="export-stats">
                        <div class="stat-item">
                            <i class="fas fa-newspaper"></i>
                            <span>博客文章: <strong>${(storage.get('blog_articles') || []).length}</strong> 篇</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-lightbulb"></i>
                            <span>奇思妙想: <strong>${(storage.get('ideas') || []).length}</strong> 条</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-comments"></i>
                            <span>评论: <strong>${Object.keys(storage.get('idea_comments') || {}).length}</strong> 个想法有评论</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // 绑定事件
        panel.querySelector('.export-panel-overlay').addEventListener('click', () => panel.remove());
        panel.querySelector('.export-close-btn').addEventListener('click', () => panel.remove());

        panel.querySelector('#exportAllBtn').addEventListener('click', () => {
            this.exportAllData();
            this.showToast('所有数据已导出，请将文件放入 data/ 目录');
        });

        panel.querySelector('#exportBlogBtn').addEventListener('click', () => {
            this.exportBlogData();
            this.showToast('博客数据已导出');
        });

        panel.querySelector('#exportIdeasBtn').addEventListener('click', () => {
            this.exportIdeasData();
            this.showToast('想法数据已导出');
        });

        panel.querySelector('#exportCommentsBtn').addEventListener('click', () => {
            this.exportCommentsData();
            this.showToast('评论数据已导出');
        });

        // 动画显示
        setTimeout(() => panel.classList.add('active'), 10);
    }

    showToast(message) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: var(--text-primary, #1a1a1a);
            color: var(--bg-primary, #fff);
            padding: 1rem 2rem;
            font-size: 0.9375rem;
            z-index: 99999;
            border-radius: 4px;
            animation: slideInUp 0.3s ease-out;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// 创建全局实例
const dataManager = new DataManager();

// 添加导出面板样式
const exportStyles = document.createElement('style');
exportStyles.textContent = `
    #exportPanel {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    #exportPanel.active {
        opacity: 1;
    }

    .export-panel-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
    }

    .export-panel-content {
        position: relative;
        background: var(--bg-primary, #fff);
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        transform: translateY(20px);
        transition: transform 0.3s ease;
    }

    #exportPanel.active .export-panel-content {
        transform: translateY(0);
    }

    .export-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--border-color, #eee);
    }

    .export-panel-header h3 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .export-close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-light, #888);
        padding: 0;
        line-height: 1;
    }

    .export-close-btn:hover {
        color: var(--text-primary, #1a1a1a);
    }

    .export-panel-body {
        padding: 1.5rem;
    }

    .export-hint {
        font-size: 0.875rem;
        color: var(--text-light, #888);
        margin-bottom: 1.25rem;
        line-height: 1.6;
    }

    .export-hint code {
        background: var(--bg-secondary, #f5f5f5);
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
        font-family: monospace;
    }

    .export-options {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
    }

    .export-option-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        background: var(--bg-secondary, #f5f5f5);
        border: 1px solid var(--border-color, #eee);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
    }

    .export-option-btn:hover {
        background: var(--bg-tertiary, #eee);
        border-color: var(--accent-color, #888);
    }

    .export-option-btn i {
        font-size: 1.25rem;
        margin-bottom: 0.5rem;
        color: var(--text-secondary, #666);
    }

    .export-option-btn span {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary, #1a1a1a);
    }

    .export-option-btn small {
        font-size: 0.6875rem;
        color: var(--text-light, #999);
        margin-top: 0.25rem;
    }

    .export-stats {
        display: flex;
        justify-content: space-around;
        padding-top: 1rem;
        border-top: 1px solid var(--border-color, #eee);
    }

    .stat-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
        color: var(--text-secondary, #666);
    }

    .stat-item i {
        color: var(--text-light, #999);
    }

    .stat-item strong {
        color: var(--text-primary, #1a1a1a);
    }

    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }

    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(exportStyles);

// 导出全局函数
window.dataManager = dataManager;
window.showExportPanel = () => dataManager.showExportPanel();
