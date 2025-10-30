// ===== 博客管理功能 =====

class BlogAdmin {
    constructor() {
        this.articles = storage.get('blog_articles') || [];
        this.categories = storage.get('blog_categories') || this.getDefaultCategories();
        this.tags = storage.get('blog_tags') || [];
        this.currentEditId = null;
        this.selectedTags = [];
        this.init();
    }

    getDefaultCategories() {
        return [
            { id: 'frontend', name: '前端开发', icon: 'fa-palette' },
            { id: 'backend', name: '后端开发', icon: 'fa-server' },
            { id: 'design', name: 'UI/UX设计', icon: 'fa-paint-brush' },
            { id: 'tutorial', name: '教程', icon: 'fa-book' },
            { id: 'other', name: '其他', icon: 'fa-folder' }
        ];
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    attachEventListeners() {
        const uploadBtn = document.getElementById('uploadBtn');
        const fileInput = document.getElementById('fileInput');
        const modalClose = document.getElementById('modalClose');
        const modalOverlay = document.getElementById('modalOverlay');
        const cancelBtn = document.getElementById('cancelBtn');
        const saveBtn = document.getElementById('saveBtn');
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        const tagsInput = document.getElementById('articleTags');

        // 上传文件
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
            fileInput.value = ''; // 清空文件输入
        });

        // 关闭模态框
        [modalClose, modalOverlay, cancelBtn].forEach(el => {
            el.addEventListener('click', () => this.closeModal());
        });

        // 保存文章
        saveBtn.addEventListener('click', () => this.saveArticle());

        // 添加分类
        addCategoryBtn.addEventListener('click', () => this.addCategory());

        // 标签输入
        tagsInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                this.addTagFromInput();
            }
        });

        tagsInput.addEventListener('blur', () => {
            this.addTagFromInput();
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('editModal');
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    async handleFileUpload(files) {
        if (!files || files.length === 0) return;

        for (const file of files) {
            if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
                alert(`${file.name} 不是Markdown文件`);
                continue;
            }

            try {
                const content = await this.readFile(file);
                const article = this.parseMarkdown(content, file.name);
                
                // 打开编辑模态框让用户设置分类和标签
                this.currentEditId = null;
                this.openModalWithArticle(article);
                
                // 只处理第一个文件，避免打开多个模态框
                break;
            } catch (error) {
                console.error('读取文件失败:', error);
                alert(`读取 ${file.name} 失败`);
            }
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    parseMarkdown(content, filename) {
        // 提取标题（第一个 # 标题）
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : filename.replace(/\.(md|markdown)$/, '');

        // 提取摘要（第一段文字）
        const lines = content.split('\n');
        let excerpt = '';
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
                excerpt = trimmed.substring(0, 150);
                break;
            }
        }

        return {
            id: generateId(),
            title: title,
            content: content,
            excerpt: excerpt || '暂无摘要',
            category: this.categories[0]?.id || 'other',
            tags: [],
            date: new Date().toISOString().split('T')[0],
            published: false,
            views: 0,
            likes: 0,
            comments: 0
        };
    }

    // 渲染分类下拉框
    renderCategories() {
        const categorySelect = document.getElementById('articleCategory');
        if (!categorySelect) return;

        categorySelect.innerHTML = this.categories.map(cat => 
            `<option value="${cat.id}">${cat.name}</option>`
        ).join('');
    }

    // 添加新分类
    addCategory() {
        const name = prompt('请输入新分类名称：');
        if (!name || !name.trim()) return;

        const trimmedName = name.trim();
        
        // 检查是否已存在
        if (this.categories.some(cat => cat.name === trimmedName)) {
            alert('该分类已存在！');
            return;
        }

        const newCategory = {
            id: this.generateCategoryId(trimmedName),
            name: trimmedName,
            icon: 'fa-folder'
        };

        this.categories.push(newCategory);
        this.saveCategories();
        this.renderCategories();
        
        // 设置为当前选中
        const categorySelect = document.getElementById('articleCategory');
        categorySelect.value = newCategory.id;
        
        this.showToast('分类已添加');
    }

    generateCategoryId(name) {
        // 生成类似 slug 的 id
        return name.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-一-龥]+/g, '')
            .substring(0, 20) + '-' + Date.now().toString(36).slice(-4);
    }

    // 渲染推荐标签
    renderSuggestedTags() {
        const suggestedTagsEl = document.getElementById('suggestedTags');
        if (!suggestedTagsEl) return;

        // 获取所有文章的标签，按使用频率排序
        const tagCounts = {};
        this.articles.forEach(article => {
            article.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        const sortedTags = Object.keys(tagCounts)
            .sort((a, b) => tagCounts[b] - tagCounts[a])
            .slice(0, 10);

        if (sortedTags.length === 0) {
            suggestedTagsEl.innerHTML = '<p style="font-size: 0.875rem; color: var(--text-light);">暂无常用标签</p>';
            return;
        }

        suggestedTagsEl.innerHTML = sortedTags.map(tag => 
            `<span class="suggested-tag" data-tag="${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</span>`
        ).join('');

        // 添加点击事件
        suggestedTagsEl.querySelectorAll('.suggested-tag').forEach(el => {
            el.addEventListener('click', () => {
                const tag = el.dataset.tag;
                if (!this.selectedTags.includes(tag)) {
                    this.selectedTags.push(tag);
                    this.renderSelectedTags();
                }
            });
        });
    }

    // 渲染已选标签
    renderSelectedTags() {
        const selectedTagsEl = document.getElementById('selectedTags');
        if (!selectedTagsEl) return;

        selectedTagsEl.innerHTML = this.selectedTags.map(tag => `
            <span class="tag-item" data-tag="${this.escapeHtml(tag)}">
                ${this.escapeHtml(tag)}
                <span class="remove-tag">×</span>
            </span>
        `).join('');

        // 添加删除事件
        selectedTagsEl.querySelectorAll('.tag-item').forEach(el => {
            el.querySelector('.remove-tag').addEventListener('click', () => {
                const tag = el.dataset.tag;
                this.selectedTags = this.selectedTags.filter(t => t !== tag);
                this.renderSelectedTags();
            });
        });
    }

    // 从输入框添加标签
    addTagFromInput() {
        const tagsInput = document.getElementById('articleTags');
        const value = tagsInput.value.trim();
        
        if (value && !this.selectedTags.includes(value)) {
            this.selectedTags.push(value);
            this.renderSelectedTags();
        }
        
        tagsInput.value = '';
    }

    openModalWithArticle(article) {
        const modal = document.getElementById('editModal');
        const modalTitle = document.getElementById('modalTitle');
        const titleInput = document.getElementById('articleTitle');
        const categorySelect = document.getElementById('articleCategory');
        const dateInput = document.getElementById('articleDate');
        const excerptInput = document.getElementById('articleExcerpt');
        const contentInput = document.getElementById('articleContent');
        const publishedCheck = document.getElementById('articlePublished');

        // 渲染分类选项
        this.renderCategories();
        
        // 设置已选标签
        this.selectedTags = article.tags ? [...article.tags] : [];
        this.renderSelectedTags();
        this.renderSuggestedTags();

        modalTitle.textContent = article.id ? '编辑文章' : '添加文章';
        titleInput.value = article.title;
        categorySelect.value = article.category;
        dateInput.value = article.date;
        excerptInput.value = article.excerpt;
        contentInput.value = article.content;
        publishedCheck.checked = article.published;

        modal.classList.add('active');
        titleInput.focus();
    }

    openModal(articleId = null) {
        if (articleId) {
            this.currentEditId = articleId;
            const article = this.articles.find(a => a.id === articleId);
            if (article) {
                this.openModalWithArticle(article);
            }
        }
    }

    closeModal() {
        const modal = document.getElementById('editModal');
        modal.classList.remove('active');
        this.currentEditId = null;
    }

    saveArticle() {
        const titleInput = document.getElementById('articleTitle');
        const categorySelect = document.getElementById('articleCategory');
        const dateInput = document.getElementById('articleDate');
        const excerptInput = document.getElementById('articleExcerpt');
        const contentInput = document.getElementById('articleContent');
        const publishedCheck = document.getElementById('articlePublished');

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title) {
            alert('请输入文章标题');
            titleInput.focus();
            return;
        }

        if (!content) {
            alert('请输入文章内容');
            contentInput.focus();
            return;
        }

        if (this.currentEditId) {
            // 编辑现有文章
            const article = this.articles.find(a => a.id === this.currentEditId);
            if (article) {
                article.title = title;
                article.category = categorySelect.value;
                article.date = dateInput.value;
                article.tags = [...this.selectedTags];
                article.excerpt = excerptInput.value.trim();
                article.content = content;
                article.published = publishedCheck.checked;
            }
        } else {
            // 添加新文章
            const newArticle = {
                id: generateId(),
                title,
                content,
                excerpt: excerptInput.value.trim() || content.substring(0, 150),
                category: categorySelect.value,
                tags: [...this.selectedTags],
                date: dateInput.value,
                published: publishedCheck.checked,
                views: 0,
                likes: 0,
                comments: 0
            };
            this.articles.unshift(newArticle);
        }

        this.saveToStorage();
        this.render();
        this.closeModal();
        this.showToast(this.currentEditId ? '文章已更新' : '文章已添加');
    }

    editArticle(id) {
        this.openModal(id);
    }

    deleteArticle(id) {
        if (confirm('确定要删除这篇文章吗？')) {
            this.articles = this.articles.filter(a => a.id !== id);
            this.saveToStorage();
            this.render();
            this.showToast('文章已删除');
        }
    }

    togglePublish(id) {
        const article = this.articles.find(a => a.id === id);
        if (article) {
            article.published = !article.published;
            this.saveToStorage();
            this.render();
            this.showToast(article.published ? '文章已发布' : '文章已设为草稿');
        }
    }

    render() {
        const tableBody = document.getElementById('articlesTableBody');
        const emptyState = document.getElementById('emptyState');

        if (this.articles.length === 0) {
            tableBody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        tableBody.innerHTML = '';

        this.articles.forEach(article => {
            const row = document.createElement('tr');
            
            // 获取分类名称
            const category = this.categories.find(c => c.id === article.category);
            const categoryName = category ? category.name : article.category;

            row.innerHTML = `
                <td><strong>${this.escapeHtml(article.title)}</strong></td>
                <td>${categoryName}</td>
                <td>
                    <div class="article-tags-cell">
                        ${article.tags.map(tag => `<span class="article-tag-small">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                </td>
                <td>${article.date}</td>
                <td>
                    <span class="status-badge ${article.published ? 'published' : 'draft'}">
                        ${article.published ? '已发布' : '草稿'}
                    </span>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn" onclick="blogAdmin.togglePublish('${article.id}')">
                            <i class="fas fa-${article.published ? 'eye-slash' : 'eye'}"></i>
                            ${article.published ? '取消发布' : '发布'}
                        </button>
                        <button class="action-btn" onclick="blogAdmin.editArticle('${article.id}')">
                            <i class="fas fa-edit"></i>
                            编辑
                        </button>
                        <button class="action-btn delete" onclick="blogAdmin.deleteArticle('${article.id}')">
                            <i class="fas fa-trash"></i>
                            删除
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    }

    saveToStorage() {
        storage.set('blog_articles', this.articles);
    }

    saveCategories() {
        storage.set('blog_categories', this.categories);
    }

    getPublishedArticles() {
        return this.articles.filter(a => a.published);
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
let blogAdmin;

document.addEventListener('DOMContentLoaded', async () => {
    // 页面保护 - 需要验证才能访问
    const authenticated = await auth.protectPage();
    if (!authenticated) return;
    
    blogAdmin = new BlogAdmin();
    console.log('博客管理页面加载完成');
});
