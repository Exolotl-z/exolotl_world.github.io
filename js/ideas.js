// ===== 奇思妙想页面功能 =====

class IdeasManager {
    constructor() {
        this.ideas = storage.get('ideas') || this.getDefaultIdeas();
        this.currentEditId = null;
        this.init();
    }

    getDefaultIdeas() {
        return [
            {
                id: generateId(),
                title: '个人网站重构',
                content: '使用极简北欧风格重新设计整个网站，注重留白和层次感。',
                tags: ['设计', '网站', '极简'],
                pinned: true,
                date: new Date('2025-10-28')
            },
            {
                id: generateId(),
                title: '学习新技术栈',
                content: '深入研究TypeScript和React 18的新特性，提升开发效率。',
                tags: ['技术', '学习', 'TypeScript'],
                pinned: true,
                date: new Date('2025-10-27')
            },
            {
                id: generateId(),
                title: '开源项目计划',
                content: '开发一个轻量级的UI组件库，专注于可访问性和性能优化。',
                tags: ['开源', '组件库', 'UI'],
                pinned: false,
                date: new Date('2025-10-26')
            }
        ];
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        const grid = document.getElementById('ideasGrid');
        const emptyState = document.getElementById('emptyState');

        if (this.ideas.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';
        grid.innerHTML = '';

        // 排序：置顶的在前面，然后按日期倒序
        const sortedIdeas = [...this.ideas].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.date) - new Date(a.date);
        });

        sortedIdeas.forEach(idea => {
            const card = this.createIdeaCard(idea);
            grid.appendChild(card);
        });
    }

    createIdeaCard(idea) {
        const card = document.createElement('div');
        card.className = `idea-card ${idea.pinned ? 'pinned' : ''}`;
        card.dataset.id = idea.id;

        const date = new Date(idea.date);
        const formattedDate = date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        card.innerHTML = `
            <div class="idea-header">
                ${idea.pinned ? '<div class="idea-pin-badge"><i class="fas fa-thumbtack"></i> 已置顶</div>' : ''}
                <h3 class="idea-title">${this.escapeHtml(idea.title)}</h3>
                <div class="idea-date">${formattedDate}</div>
            </div>
            <div class="idea-content">
                <p class="idea-text">${this.escapeHtml(idea.content)}</p>
            </div>
            <div class="idea-tags">
                ${idea.tags.map(tag => `<span class="idea-tag">${this.escapeHtml(tag)}</span>`).join('')}
            </div>
            <div class="idea-actions">
                <button class="idea-action-btn pin-btn ${idea.pinned ? 'active' : ''}" data-action="pin">
                    <i class="fas fa-thumbtack"></i>
                    ${idea.pinned ? '取消置顶' : '置顶'}
                </button>
                <button class="idea-action-btn edit-btn" data-action="edit">
                    <i class="fas fa-edit"></i>
                    编辑
                </button>
                <button class="idea-action-btn delete-btn" data-action="delete">
                    <i class="fas fa-trash"></i>
                    删除
                </button>
            </div>
        `;

        // 添加事件监听
        card.querySelectorAll('.idea-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                if (action === 'pin') this.togglePin(idea.id);
                if (action === 'edit') this.editIdea(idea.id);
                if (action === 'delete') this.deleteIdea(idea.id);
            });
        });

        return card;
    }

    attachEventListeners() {
        const addBtn = document.getElementById('addIdeaBtn');
        const modal = document.getElementById('ideaModal');
        const modalClose = document.getElementById('modalClose');
        const modalOverlay = document.getElementById('modalOverlay');
        const cancelBtn = document.getElementById('cancelBtn');
        const saveBtn = document.getElementById('saveBtn');

        // 打开添加模态框
        addBtn.addEventListener('click', () => {
            this.currentEditId = null;
            this.openModal();
        });

        // 关闭模态框
        [modalClose, modalOverlay, cancelBtn].forEach(el => {
            el.addEventListener('click', () => this.closeModal());
        });

        // 保存
        saveBtn.addEventListener('click', () => this.saveIdea());

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    openModal(idea = null) {
        const modal = document.getElementById('ideaModal');
        const modalTitle = document.getElementById('modalTitle');
        const titleInput = document.getElementById('ideaTitle');
        const contentInput = document.getElementById('ideaContent');
        const tagsInput = document.getElementById('ideaTags');
        const pinnedCheck = document.getElementById('ideaPinned');

        if (idea) {
            modalTitle.textContent = '编辑想法';
            titleInput.value = idea.title;
            contentInput.value = idea.content;
            tagsInput.value = idea.tags.join(', ');
            pinnedCheck.checked = idea.pinned;
        } else {
            modalTitle.textContent = '添加新想法';
            titleInput.value = '';
            contentInput.value = '';
            tagsInput.value = '';
            pinnedCheck.checked = false;
        }

        modal.classList.add('active');
        titleInput.focus();
    }

    closeModal() {
        const modal = document.getElementById('ideaModal');
        modal.classList.remove('active');
        this.currentEditId = null;
    }

    saveIdea() {
        const titleInput = document.getElementById('ideaTitle');
        const contentInput = document.getElementById('ideaContent');
        const tagsInput = document.getElementById('ideaTags');
        const pinnedCheck = document.getElementById('ideaPinned');

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const pinned = pinnedCheck.checked;

        if (!title) {
            alert('请输入标题');
            titleInput.focus();
            return;
        }

        if (!content) {
            alert('请输入内容');
            contentInput.focus();
            return;
        }

        if (this.currentEditId) {
            // 编辑现有想法
            const idea = this.ideas.find(i => i.id === this.currentEditId);
            if (idea) {
                idea.title = title;
                idea.content = content;
                idea.tags = tags;
                idea.pinned = pinned;
            }
        } else {
            // 添加新想法
            const newIdea = {
                id: generateId(),
                title,
                content,
                tags,
                pinned,
                date: new Date()
            };
            this.ideas.unshift(newIdea);
        }

        this.saveToStorage();
        this.render();
        this.closeModal();

        // 显示提示
        this.showToast(this.currentEditId ? '想法已更新' : '想法已添加');
    }

    togglePin(id) {
        const idea = this.ideas.find(i => i.id === id);
        if (idea) {
            idea.pinned = !idea.pinned;
            this.saveToStorage();
            this.render();
            this.showToast(idea.pinned ? '已置顶到首页' : '已取消置顶');
        }
    }

    editIdea(id) {
        this.currentEditId = id;
        const idea = this.ideas.find(i => i.id === id);
        if (idea) {
            this.openModal(idea);
        }
    }

    deleteIdea(id) {
        if (confirm('确定要删除这个想法吗？')) {
            const card = document.querySelector(`.idea-card[data-id="${id}"]`);
            
            // 删除动画
            card.style.animation = 'fadeOut 0.3s ease-out';
            
            setTimeout(() => {
                this.ideas = this.ideas.filter(i => i.id !== id);
                this.saveToStorage();
                this.render();
                this.showToast('想法已删除');
            }, 300);
        }
    }

    saveToStorage() {
        storage.set('ideas', this.ideas);
    }

    getPinnedIdeas() {
        return this.ideas.filter(i => i.pinned).slice(0, 3); // 最多3个
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: var(--text-primary);
            color: var(--bg-primary);
            padding: 1rem 2rem;
            font-size: 0.9375rem;
            z-index: 99999;
            animation: slideInUp 0.3s ease-out;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }
}

// 初始化
let ideasManager;

document.addEventListener('DOMContentLoaded', () => {
    ideasManager = new IdeasManager();
    console.log('奇思妙想页面加载完成');
});

// 导出获取置顶想法的函数（供首页使用）
function getPinnedIdeas() {
    const ideas = storage.get('ideas') || [];
    return ideas.filter(i => i.pinned).slice(0, 3);
}
