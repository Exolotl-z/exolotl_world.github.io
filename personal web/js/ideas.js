// ===== 奇思妙想页面功能 =====

class IdeasManager {
    constructor() {
        this.ideas = [];
        this.currentEditId = null;
        this.currentDetailId = null;
        this.likedIdeas = JSON.parse(localStorage.getItem('liked_ideas') || '[]');
        this.init();
    }

    // 加载数据（优先从JSON文件）
    async loadIdeas() {
        // 尝试从JSON文件加载
        if (typeof dataManager !== 'undefined') {
            const jsonData = await dataManager.loadIdeasData();
            if (jsonData && jsonData.length > 0) {
                console.log('使用JSON文件数据:', jsonData.length, '条想法');
                return jsonData;
            }
        }

        // 回退到localStorage
        return storage.get('ideas') || this.getDefaultIdeas();
    }

    getDefaultIdeas() {
        return [
            {
                id: generateId(),
                title: '个人网站重构',
                content: '使用极简北欧风格重新设计整个网站，注重留白和层次感。尝试不同的设计方案，找到最适合的视觉风格。',
                tags: ['设计', '网站', '极简'],
                pinned: true,
                date: new Date('2025-10-28'),
                likes: 12
            },
            {
                id: generateId(),
                title: '学习新技术栈',
                content: '深入研究TypeScript和React 18的新特性，提升开发效率。学习新知识的过程总是充满乐趣。',
                tags: ['技术', '学习', 'TypeScript'],
                pinned: true,
                date: new Date('2025-10-27'),
                likes: 8
            },
            {
                id: generateId(),
                title: '开源项目计划',
                content: '开发一个轻量级的UI组件库，专注于可访问性和性能优化。希望能帮助到更多的开发者。',
                tags: ['开源', '组件库', 'UI'],
                pinned: false,
                date: new Date('2025-10-26'),
                likes: 5
            }
        ];
    }

    async init() {
        this.ideas = await this.loadIdeas();
        this.checkAuth();
        this.render();
        this.attachEventListeners();
    }

    async checkAuth() {
        // 检查是否有编辑权限
        this.canEdit = auth.isAuthenticated();

        // 如果没有权限，隐藏添加按钮
        if (!this.canEdit) {
            const addBtn = document.getElementById('addIdeaBtn');
            if (addBtn) {
                addBtn.style.display = 'none';
            }
        }
    }

    async requireAuth() {
        if (!this.canEdit) {
            const success = await auth.showLoginDialog('此操作需要管理员权限');
            if (success) {
                this.canEdit = true;
                const addBtn = document.getElementById('addIdeaBtn');
                if (addBtn) addBtn.style.display = 'inline-flex';
                this.render();
            }
            return success;
        }
        return true;
    }

    render() {
        const grid = document.getElementById('ideasGrid');
        const emptyState = document.getElementById('emptyState');

        if (this.ideas.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        // 使用CSS瀑布流布局
        grid.style.display = 'block';
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

        // 点击卡片打开详情
        card.addEventListener('click', (e) => {
            // 防止点击按钮时触发详情
            if (!e.target.closest('.idea-action-btn')) {
                this.showDetail(idea.id);
            }
        });

        const isLiked = this.likedIdeas.includes(idea.id);

        card.innerHTML = `
            <h3 class="idea-title">${this.escapeHtml(idea.title)}</h3>
            <div class="idea-content">
                ${this.escapeHtml(idea.content)}
            </div>
            <div class="idea-meta">
                <div class="idea-stats">
                    <span><i class="${isLiked ? 'fas' : 'far'} fa-heart"></i> ${idea.likes || 0}</span>
                    <span><i class="far fa-comment"></i> ${this.getCommentCount(idea.id)}</span>
                </div>
            </div>
            <div class="idea-tags">
                ${idea.tags.map(tag => `<span class="idea-tag">${this.escapeHtml(tag)}</span>`).join('')}
            </div>
        `;

        // 添加操作按钮（仅管理员）
        if (this.canEdit) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'idea-actions';
            actionsDiv.innerHTML = `
                <button class="idea-action-btn pin-btn ${idea.pinned ? 'active' : ''}" data-action="pin">
                    <i class="fas fa-thumbtack"></i>
                </button>
                <button class="idea-action-btn edit-btn" data-action="edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="idea-action-btn delete-btn" data-action="delete">
                    <i class="fas fa-trash"></i>
                </button>
            `;

            actionsDiv.querySelectorAll('.idea-action-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    if (action === 'pin') this.togglePin(idea.id);
                    if (action === 'edit') this.editIdea(idea.id);
                    if (action === 'delete') this.deleteIdea(idea.id);
                });
            });

            card.appendChild(actionsDiv);
        }

        return card;
    }

    attachEventListeners() {
        const addBtn = document.getElementById('addIdeaBtn');
        const modal = document.getElementById('ideaModal');
        const modalClose = document.getElementById('modalClose');
        const modalOverlay = document.getElementById('modalOverlay');
        const cancelBtn = document.getElementById('cancelBtn');
        const saveBtn = document.getElementById('saveBtn');

        // 详情模态框
        const detailModal = document.getElementById('detailModal');
        const detailModalClose = document.getElementById('detailModalClose');
        const detailModalOverlay = document.getElementById('detailModalOverlay');

        // 打开添加模态框
        addBtn.addEventListener('click', () => {
            this.currentEditId = null;
            this.openModal();
        });

        // 关闭模态框
        [modalClose, modalOverlay, cancelBtn].forEach(el => {
            el.addEventListener('click', () => this.closeModal());
        });

        // 关闭详情模态框
        [detailModalClose, detailModalOverlay].forEach(el => {
            el.addEventListener('click', () => this.closeDetailModal());
        });

        // 保存
        saveBtn.addEventListener('click', () => this.saveIdea());

        // 详情页操作按钮
        document.getElementById('detailLikeBtn')?.addEventListener('click', () => this.toggleLike());
        document.getElementById('detailShareBtn')?.addEventListener('click', () => this.shareIdea());
        document.getElementById('detailEditBtn')?.addEventListener('click', () => this.editFromDetail());
        document.getElementById('detailDeleteBtn')?.addEventListener('click', () => this.deleteFromDetail());

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (modal.classList.contains('active')) {
                    this.closeModal();
                }
                if (detailModal?.classList.contains('active')) {
                    this.closeDetailModal();
                }
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

    // 显示详情
    showDetail(id) {
        const idea = this.ideas.find(i => i.id === id);
        if (!idea) return;

        this.currentDetailId = id;
        const modal = document.getElementById('detailModal');

        // 填充内容
        document.getElementById('detailTitle').textContent = idea.title;
        document.getElementById('detailContent').textContent = idea.content;

        // 标签
        const tagsContainer = document.getElementById('detailTags');
        tagsContainer.innerHTML = idea.tags.map(tag =>
            `<span class="idea-tag">${this.escapeHtml(tag)}</span>`
        ).join('');

        // 点赞
        const isLiked = this.likedIdeas.includes(idea.id);
        const likeBtn = document.getElementById('detailLikeBtn');
        const likeCount = document.getElementById('detailLikeCount');
        likeCount.textContent = idea.likes || 0;
        likeBtn.classList.toggle('liked', isLiked);
        likeBtn.querySelector('i').className = isLiked ? 'fas fa-heart' : 'far fa-heart';

        // 管理按钮（仅管理员可见）
        const adminActions = document.getElementById('detailAdminActions');
        adminActions.style.display = this.canEdit ? 'flex' : 'none';

        // 隐藏日期显示
        const dateEl = document.getElementById('detailDate');
        if (dateEl) dateEl.style.display = 'none';

        // 更新评论数
        const commentCountEl = document.getElementById('commentCount');
        if (commentCountEl) commentCountEl.textContent = this.getCommentCount(id);

        // 渲染评论
        this.renderComments(id);

        modal.classList.add('active');
    }

    closeDetailModal() {
        const modal = document.getElementById('detailModal');
        modal.classList.remove('active');
        this.currentDetailId = null;
    }

    // ===== 本地评论系统 =====

    async loadComments() {
        // 尝试从JSON文件加载
        if (typeof dataManager !== 'undefined') {
            const jsonData = await dataManager.loadCommentsData();
            if (jsonData) {
                return jsonData;
            }
        }
        return storage.get('idea_comments') || {};
    }

    getComments(ideaId) {
        const allComments = storage.get('idea_comments') || {};
        return allComments[ideaId] || [];
    }

    getCommentCount(ideaId) {
        return this.getComments(ideaId).length;
    }

    saveComment(ideaId, comment) {
        const allComments = storage.get('idea_comments') || {};
        if (!allComments[ideaId]) {
            allComments[ideaId] = [];
        }
        allComments[ideaId].push(comment);
        storage.set('idea_comments', allComments);
    }

    deleteComment(ideaId, commentId) {
        const allComments = storage.get('idea_comments') || {};
        if (allComments[ideaId]) {
            allComments[ideaId] = allComments[ideaId].filter(c => c.id !== commentId);
            storage.set('idea_comments', allComments);
        }
    }

    renderComments(ideaId) {
        const container = document.getElementById('commentsContainer');
        if (!container) return;

        const comments = this.getComments(ideaId);

        let html = `
            <div class="comment-form">
                <textarea id="commentInput" class="comment-input" placeholder="写下你的想法..." rows="3"></textarea>
                <div class="comment-form-actions">
                    <input type="text" id="commentAuthor" class="comment-author-input" placeholder="昵称（可选）" maxlength="20">
                    <button class="btn btn-primary btn-sm" id="submitCommentBtn">
                        <i class="fas fa-paper-plane"></i> 发表
                    </button>
                </div>
            </div>
            <div class="comments-list">
        `;

        if (comments.length === 0) {
            html += `<p class="no-comments">暂无评论，来抢个沙发吧~</p>`;
        } else {
            comments.forEach(comment => {
                const date = new Date(comment.date);
                const formattedDate = date.toLocaleDateString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                html += `
                    <div class="comment-item" data-id="${comment.id}">
                        <div class="comment-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="comment-body">
                            <div class="comment-header">
                                <span class="comment-author">${this.escapeHtml(comment.author || '匿名用户')}</span>
                                <span class="comment-date">${formattedDate}</span>
                                ${this.canEdit ? `<button class="comment-delete-btn" data-id="${comment.id}" title="删除评论"><i class="fas fa-trash"></i></button>` : ''}
                            </div>
                            <div class="comment-content">${this.escapeHtml(comment.content)}</div>
                        </div>
                    </div>
                `;
            });
        }

        html += `</div>`;
        container.innerHTML = html;

        // 绑定事件
        document.getElementById('submitCommentBtn')?.addEventListener('click', () => this.submitComment(ideaId));
        document.getElementById('commentInput')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.submitComment(ideaId);
            }
        });

        // 删除评论按钮
        container.querySelectorAll('.comment-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const commentId = btn.dataset.id;
                if (confirm('确定要删除这条评论吗？')) {
                    this.deleteComment(ideaId, commentId);
                    this.renderComments(ideaId);
                    this.render(); // 更新卡片评论数
                }
            });
        });
    }

    submitComment(ideaId) {
        const input = document.getElementById('commentInput');
        const authorInput = document.getElementById('commentAuthor');
        const content = input.value.trim();
        const author = authorInput.value.trim() || '匿名用户';

        if (!content) {
            alert('请输入评论内容');
            return;
        }

        if (content.length > 500) {
            alert('评论内容不能超过500字');
            return;
        }

        const comment = {
            id: generateId(),
            author: author,
            content: content,
            date: new Date()
        };

        this.saveComment(ideaId, comment);
        input.value = '';

        // 更新评论数显示
        const commentCountEl = document.getElementById('commentCount');
        if (commentCountEl) commentCountEl.textContent = this.getCommentCount(ideaId);

        this.renderComments(ideaId);
        this.render(); // 更新卡片评论数
        this.showToast('评论发表成功');
    }

    // 点赞功能
    toggleLike() {
        const idea = this.ideas.find(i => i.id === this.currentDetailId);
        if (!idea) return;

        const isLiked = this.likedIdeas.includes(idea.id);

        if (isLiked) {
            // 取消点赞
            this.likedIdeas = this.likedIdeas.filter(id => id !== idea.id);
            idea.likes = Math.max(0, (idea.likes || 0) - 1);
        } else {
            // 点赞
            this.likedIdeas.push(idea.id);
            idea.likes = (idea.likes || 0) + 1;
        }

        localStorage.setItem('liked_ideas', JSON.stringify(this.likedIdeas));
        this.saveToStorage();

        // 更新UI
        const likeBtn = document.getElementById('detailLikeBtn');
        const likeCount = document.getElementById('detailLikeCount');
        likeCount.textContent = idea.likes;
        likeBtn.classList.toggle('liked', !isLiked);
        likeBtn.querySelector('i').className = !isLiked ? 'fas fa-heart' : 'far fa-heart';

        // 如果详情页打开，重新渲染以更新卡片
        this.render();
    }

    // 分享功能
    shareIdea() {
        const idea = this.ideas.find(i => i.id === this.currentDetailId);
        if (!idea) return;

        const shareData = {
            title: idea.title,
            text: idea.content.substring(0, 100) + '...',
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData).catch(err => console.log('分享取消'));
        } else {
            // 复制到剪贴板
            const text = `${idea.title}\n\n${idea.content}\n\n来源: ${window.location.href}`;
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('链接已复制到剪贴板');
            });
        }
    }

    // 从详情页编辑
    editFromDetail() {
        if (this.currentDetailId) {
            this.closeDetailModal();
            this.editIdea(this.currentDetailId);
        }
    }

    // 从详情页删除
    deleteFromDetail() {
        if (this.currentDetailId) {
            this.closeDetailModal();
            this.deleteIdea(this.currentDetailId);
        }
    }

    async saveIdea() {
        // 权限检查
        if (!await this.requireAuth()) return;

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
                date: new Date(),
                likes: 0
            };
            this.ideas.unshift(newIdea);
        }

        this.saveToStorage();
        this.render();
        this.closeModal();

        // 显示提示
        this.showToast(this.currentEditId ? '想法已更新' : '想法已添加');
    }

    async togglePin(id) {
        // 权限检查
        if (!await this.requireAuth()) return;

        const idea = this.ideas.find(i => i.id === id);
        if (idea) {
            idea.pinned = !idea.pinned;
            this.saveToStorage();
            this.render();
            this.showToast(idea.pinned ? '已置顶到首页' : '已取消置顶');
        }
    }

    async editIdea(id) {
        // 权限检查
        if (!await this.requireAuth()) return;

        this.currentEditId = id;
        const idea = this.ideas.find(i => i.id === id);
        if (idea) {
            this.openModal(idea);
        }
    }

    async deleteIdea(id) {
        // 权限检查
        if (!await this.requireAuth()) return;

        if (confirm('确定要删除这个想法吗？')) {
            const card = document.querySelector(`.idea-card[data-id="${id}"]`);

            // 删除动画
            if (card) {
                card.style.animation = 'fadeOut 0.3s ease-out';
            }

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
        // 移除已存在的toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

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
            border-radius: var(--radius-md);
            animation: slideInUp 0.3s ease-out;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                toast.remove();
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