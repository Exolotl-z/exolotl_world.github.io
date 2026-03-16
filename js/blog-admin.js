// ===== 博客管理功能 =====

console.log('=== blog-admin.js 开始加载 ===');

class BlogAdmin {
    constructor() {
        console.log('BlogAdmin 构造函数开始');

        // 从存储获取数据（添加容错处理）
        try {
            // 确保storage可用
            if (typeof window.storage === 'undefined') {
                console.warn('storage未定义，创建临时storage');
                window.storage = {
                    get: function(key) { return null; },
                    set: function() { return true; },
                    remove: function() { return true; }
                };
            }
            this.articles = window.storage.get('blog_articles') || [];
            this.categories = window.storage.get('blog_categories') || this.getDefaultCategories();
            console.log('数据加载成功, articles:', this.articles.length);
        } catch (e) {
            console.error('初始化数据失败:', e);
            this.articles = [];
            this.categories = this.getDefaultCategories();
        }

        this.selectedTags = [];
        this.currentEditId = null;
        this.deleteIds = [];

        console.log('BlogAdmin 构造函数完成');

        // 初始化
        this.init();
    }

    getDefaultCategories() {
        return [
            { id: 'frontend', name: '前端开发', icon: 'fa-palette' },
            { id: 'backend', name: '后端开发', icon: 'fa-server' },
            { id: 'devops', name: 'DevOps', icon: 'fa-cloud' },
            { id: 'ai', name: '人工智能', icon: 'fa-robot' },
            { id: 'other', name: '其他', icon: 'fa-folder' }
        ];
    }

    // 生成唯一ID
    generateId() {
        return 'art_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 初始化
    async init() {
        console.log('BlogAdmin 开始初始化...');

        try {
            // 从IndexedDB加载文章内容
            await this.loadArticlesContent();
        } catch (e) {
            console.error('加载文章内容失败:', e);
        }

        try {
            this.render();
        } catch (e) {
            console.error('渲染失败:', e);
        }

        try {
            this.attachEventListeners();
        } catch (e) {
            console.error('绑定事件失败:', e);
        }

        try {
            this.renderCategorySelect();
        } catch (e) {
            console.error('渲染分类下拉框失败:', e);
        }

        console.log('BlogAdmin 初始化完成, 文章数:', this.articles.length);
    }

    // 从IndexedDB加载文章内容
    async loadArticlesContent() {
        if (typeof indexedDB === 'undefined') return;

        const contents = await this.loadAllFromIndexedDB();

        // 更新每篇文章的内容
        this.articles = this.articles.map(article => {
            // 从filePath获取filename
            let filename = article.filePath ? article.filePath.replace('articles/', '') : null;
            if (!filename && article.title) {
                filename = article.title.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.md';
            }

            const content = filename ? (contents[filename] || article.content || '') : (article.content || '');

            // 确保有filePath
            if (!article.filePath && filename) {
                article.filePath = 'articles/' + filename;
            }

            return { ...article, content };
        });

        console.log('已加载文章内容:', this.articles.length);
    }

    // 渲染文章列表
    render() {
        const tableBody = document.getElementById('articlesTableBody');
        const emptyState = document.getElementById('emptyState');

        if (!tableBody) return;

        if (this.articles.length === 0) {
            tableBody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        // 排序：置顶 > 日期
        const sorted = [...this.articles].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.date) - new Date(a.date);
        });

        tableBody.innerHTML = sorted.map(article => {
            const category = this.categories.find(c => c.id === article.category) || { name: article.category, icon: 'fa-folder' };
            const date = new Date(article.date);
            const formattedDate = date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });

            return `
                <tr data-id="${article.id}">
                    <td>
                        <input type="checkbox" class="article-checkbox" value="${article.id}">
                    </td>
                    <td>
                        <span class="article-title-cell">
                            ${article.pinned ? '<i class="fas fa-thumbtack" style="color: var(--text-primary); margin-right: 0.5rem;"></i>' : ''}
                            ${this.escapeHtml(article.title)}
                        </span>
                    </td>
                    <td>
                        <span class="category-badge">
                            <i class="fas ${category.icon}"></i>
                            ${category.name}
                        </span>
                    </td>
                    <td>
                        <div class="tags-cell">
                            ${(article.tags || []).slice(0, 3).map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                            ${(article.tags || []).length > 3 ? `<span class="tag">+${(article.tags || []).length - 3}</span>` : ''}
                        </div>
                    </td>
                    <td>${formattedDate}</td>
                    <td>
                        <span class="status-badge ${article.published ? 'published' : 'draft'}">
                            ${article.published ? '已发布' : '草稿'}
                        </span>
                    </td>
                    <td>
                        <div class="actions-cell">
                            <button class="action-btn edit-btn" data-id="${article.id}" title="编辑">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-btn" data-id="${article.id}" title="删除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // 渲染分类下拉框
    renderCategorySelect() {
        const selects = ['articleCategory', 'categoryFilter'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;

            const options = this.categories.map(cat =>
                `<option value="${cat.id}">${cat.name}</option>`
            ).join('');

            if (selectId === 'categoryFilter') {
                select.innerHTML = `<option value="all">全部分类</option>${options}`;
            } else {
                select.innerHTML = options;
            }
        });
    }

    // 附加事件监听
    attachEventListeners() {
        console.log('开始绑定事件...');

        // 调试：检查按钮元素是否存在
        const newArticleBtn = document.getElementById('newArticleBtn');
        const uploadBtn = document.getElementById('uploadBtn');
        const exportBtn = document.getElementById('exportBtn');
        const clearDataBtn = document.getElementById('clearDataBtn');
        const manageCategoriesBtn = document.getElementById('manageCategoriesBtn');

        console.log('按钮元素检查:', {
            newArticleBtn: !!newArticleBtn,
            uploadBtn: !!uploadBtn,
            exportBtn: !!exportBtn,
            clearDataBtn: !!clearDataBtn,
            manageCategoriesBtn: !!manageCategoriesBtn
        });

        // 新建文章 - 使用 onclick 直接绑定确保兼容性
        if (newArticleBtn) {
            newArticleBtn.onclick = () => {
                console.log('点击了新建文章按钮');
                this.openNewArticleModal();
            };
            console.log('新建文章按钮事件绑定成功');
        } else {
            console.error('未找到新建文章按钮元素!');
        }

        // 上传文件
        if (uploadBtn) {
            const fileInput = document.getElementById('fileInput');
            uploadBtn.onclick = () => {
                console.log('点击了上传按钮');
                fileInput?.click();
            };
            console.log('上传按钮事件绑定成功');
            if (fileInput) {
                fileInput.onchange = (e) => {
                    this.handleFileUpload(e.target.files);
                    fileInput.value = '';
                };
            }
        } else {
            console.error('未找到上传按钮元素!');
        }

        // 导出文章
        if (exportBtn) {
            exportBtn.onclick = () => {
                console.log('点击了导出按钮');
                this.exportArticles();
            };
            console.log('导出按钮事件绑定成功');
        } else {
            console.error('未找到导出按钮元素!');
        }

        // 清除数据
        if (clearDataBtn) {
            clearDataBtn.onclick = () => {
                console.log('点击了清除数据按钮');
                this.clearAllData();
            };
            console.log('清除数据按钮事件绑定成功');
        } else {
            console.error('未找到清除数据按钮元素!');
        }

        // 分类管理
        if (manageCategoriesBtn) {
            manageCategoriesBtn.onclick = () => {
                console.log('点击了分类管理按钮');
                this.openCategoryModal();
            };
            console.log('分类管理按钮事件绑定成功');
        } else {
            console.error('未找到分类管理按钮元素!');
        }

        // 分类管理模态框按钮
        const categorySaveBtn = document.getElementById('categorySaveBtn');
        const categoryCancelBtn = document.getElementById('categoryCancelBtn');
        const categoryModalOverlay = document.getElementById('categoryModalOverlay');
        const categoryModalClose = document.getElementById('categoryModalClose');

        if (categorySaveBtn) categorySaveBtn.onclick = () => this.addCategory();
        if (categoryCancelBtn) categoryCancelBtn.onclick = () => this.closeCategoryModal();
        if (categoryModalOverlay) categoryModalOverlay.onclick = () => this.closeCategoryModal();
        if (categoryModalClose) categoryModalClose.onclick = () => this.closeCategoryModal();

        // 拖拽上传
        this.initDragAndDrop();

        // 模态框关闭
        ['modalOverlay', 'modalClose', 'cancelBtn'].forEach(id => {
            document.getElementById(id)?.addEventListener('click', () => this.closeModal());
        });

        // 预览
        document.getElementById('previewBtn')?.addEventListener('click', () => this.showPreview());

        // 保存文章
        document.getElementById('saveBtn')?.addEventListener('click', () => this.saveArticle(true));
        document.getElementById('saveDraftBtn')?.addEventListener('click', () => this.saveArticle(false));

        // 添加分类 - 从文章编辑模态框中打开分类管理
        document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
            this.closeModal();
            this.openCategoryModal();
        });

        // 分类模态框
        document.getElementById('categoryModalClose')?.addEventListener('click', () => this.closeCategoryModal());
        document.getElementById('categoryModalOverlay')?.addEventListener('click', () => this.closeCategoryModal());
        document.getElementById('categoryCancelBtn')?.addEventListener('click', () => this.closeCategoryModal());
        document.getElementById('categorySaveBtn')?.addEventListener('click', () => this.addCategory());

        // 删除模态框
        document.getElementById('deleteModalClose')?.addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('deleteModalOverlay')?.addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('deleteCancelBtn')?.addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('deleteConfirmBtn')?.addEventListener('click', () => this.confirmDelete());

        // 预览模态框
        document.getElementById('previewModalClose')?.addEventListener('click', () => this.closePreviewModal());
        document.getElementById('previewModalOverlay')?.addEventListener('click', () => this.closePreviewModal());

        // 标签输入
        const tagsInput = document.getElementById('articleTags');
        tagsInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                this.addTagFromInput();
            }
        });

        // 筛选
        document.getElementById('searchInput')?.addEventListener('input', this.debounce(() => this.filterArticles(), 300));
        document.getElementById('categoryFilter')?.addEventListener('change', () => this.filterArticles());
        document.getElementById('statusFilter')?.addEventListener('change', () => this.filterArticles());

        // 表格操作
        document.getElementById('selectAll')?.addEventListener('change', (e) => {
            document.querySelectorAll('.article-checkbox').forEach(cb => {
                cb.checked = e.target.checked;
            });
            this.updateBatchActions();
        });

        document.getElementById('articlesTableBody')?.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn');
            const checkbox = e.target.closest('.article-checkbox');

            if (editBtn) {
                console.log('点击了编辑按钮, 文章ID:', editBtn.dataset.id);
                this.editArticle(editBtn.dataset.id);
            } else if (deleteBtn) {
                console.log('点击了删除按钮, 文章ID:', deleteBtn.dataset.id);
                this.openDeleteModal([deleteBtn.dataset.id]);
            } else if (checkbox) {
                this.updateBatchActions();
            }
        });

        // 批量操作
        document.getElementById('batchPublish')?.addEventListener('click', () => this.batchPublish());
        document.getElementById('batchDelete')?.addEventListener('click', () => this.openDeleteModal(this.getSelectedIds()));

        // ESC 关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeCategoryModal();
                this.closeDeleteModal();
                this.closePreviewModal();
            }
        });
    }

    // 初始化拖拽上传
    initDragAndDrop() {
        const dropZone = document.getElementById('dropZone');
        if (!dropZone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
            dropZone.addEventListener(event, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(event => {
            dropZone.addEventListener(event, () => dropZone.classList.add('drag-over'));
        });

        ['dragleave', 'drop'].forEach(event => {
            dropZone.addEventListener(event, () => dropZone.classList.remove('drag-over'));
        });

        dropZone.addEventListener('drop', (e) => {
            this.handleFileUpload(e.dataTransfer.files);
        });
    }

    // 处理文件上传
    async handleFileUpload(files) {
        if (!files || files.length === 0) return;

        const progressList = document.getElementById('progressList');
        const uploadProgress = document.getElementById('uploadProgress');

        if (uploadProgress) uploadProgress.style.display = 'block';
        if (progressList) progressList.innerHTML = '';

        for (const file of files) {
            const isMd = file.name.endsWith('.md') || file.name.endsWith('.markdown');

            if (!isMd) {
                this.addProgressItem(file.name, false, '不是Markdown文件');
                continue;
            }

            try {
                const content = await this.readFile(file);
                const article = this.parseMarkdown(content, file.name);

                // 生成唯一的文件名（时间戳 + 随机数 + 原始名称）
                const timestamp = Date.now();
                const random = Math.random().toString(36).substr(2, 6);
                const originalName = file.name.replace(/\.md$/, '').replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-');
                const uniqueFilename = `${timestamp}-${random}-${originalName}.md`;

                // 生成文件路径
                article.filePath = 'articles/' + uniqueFilename;

                console.log('保存文章:', article.title, '->', uniqueFilename);

                // 保存markdown内容到IndexedDB
                await this.saveMarkdownFile(uniqueFilename, content);

                // 保存元数据到localStorage
                this.articles.push(article);
                this.saveToStorage();

                this.addProgressItem(file.name, true, '上传成功');
            } catch (error) {
                console.error('读取文件失败:', error);
                this.addProgressItem(file.name, false, '读取失败');
            }
        }

        // 刷新列表
        setTimeout(() => {
            this.render();
            this.renderCategorySelect();
        }, 500);
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
        // 解析YAML front matter
        let meta = {};
        let body = content;

        if (content.startsWith('---')) {
            const endIndex = content.indexOf('---', 3);
            if (endIndex > 0) {
                const yamlStr = content.slice(3, endIndex).trim();
                body = content.slice(endIndex + 3).trim();

                // 简单解析YAML
                yamlStr.split('\n').forEach(line => {
                    const [key, ...valueParts] = line.split(':');
                    if (key && valueParts.length) {
                        const value = valueParts.join(':').trim();
                        if (key.trim() === 'tags') {
                            meta[key.trim()] = value.split(',').map(t => t.trim());
                        } else {
                            meta[key.trim()] = value.replace(/^["']|["']$/g, '');
                        }
                    }
                });
            }
        }

        // 从文件名生成标题
        const title = meta.title || filename.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');

        // 提取摘要
        let excerpt = meta.excerpt || '';
        if (!excerpt && body) {
            // 取第一段作为摘要
            const firstPara = body.split('\n\n')[0];
            excerpt = firstPara.replace(/^#+\s*/, '').slice(0, 150);
        }

        return {
            id: this.generateId(),
            title: title,
            content: body,
            excerpt: excerpt,
            category: meta.category || 'other',
            tags: meta.tags || [],
            date: meta.date || new Date().toISOString().split('T')[0],
            published: meta.published !== undefined ? meta.published : true,
            pinned: meta.pinned || false,
            views: 0,
            likes: 0
        };
    }

    addProgressItem(filename, success, message) {
        const progressList = document.getElementById('progressList');
        if (!progressList) return;

        const item = document.createElement('div');
        item.className = `progress-item ${success ? 'success' : 'error'}`;
        item.innerHTML = `
            <i class="fas ${success ? 'fa-check-circle' : 'fa-times-circle'}"></i>
            <span>${filename}</span>
            <span>${message}</span>
        `;
        progressList.appendChild(item);
    }

    // 新建文章
    openNewArticleModal() {
        this.currentEditId = null;
        this.selectedTags = [];

        document.getElementById('modalTitle').textContent = '新建文章';
        document.getElementById('articleTitle').value = '';
        document.getElementById('articleCategory').value = 'frontend';
        document.getElementById('articleDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('articleTags').value = '';
        document.getElementById('articleExcerpt').value = '';
        document.getElementById('articleContent').value = '';
        document.getElementById('articlePinned').checked = false;
        document.getElementById('articlePublished').checked = true;

        this.renderSelectedTags();
        this.renderSuggestedTags();

        document.getElementById('articleModal').classList.add('active');
        document.getElementById('articleTitle').focus();
    }

    // 编辑文章
    editArticle(id) {
        const article = this.articles.find(a => a.id === id);
        if (!article) return;

        this.currentEditId = id;
        this.selectedTags = [...(article.tags || [])];

        document.getElementById('modalTitle').textContent = '编辑文章';
        document.getElementById('articleTitle').value = article.title;
        document.getElementById('articleCategory').value = article.category || 'other';
        document.getElementById('articleDate').value = article.date;
        document.getElementById('articleTags').value = '';
        document.getElementById('articleExcerpt').value = article.excerpt || '';
        document.getElementById('articleContent').value = article.content || '';
        document.getElementById('articlePinned').checked = article.pinned || false;
        document.getElementById('articlePublished').checked = article.published !== false;

        this.renderSelectedTags();
        this.renderSuggestedTags();

        document.getElementById('articleModal').classList.add('active');
    }

    // 关闭模态框
    closeModal() {
        document.getElementById('articleModal')?.classList.remove('active');
        this.currentEditId = null;
        this.selectedTags = [];
    }

    // 保存文章（本地存储 + 文件系统）
    async saveArticle(publish = true) {
        const title = document.getElementById('articleTitle').value.trim();
        const category = document.getElementById('articleCategory').value;
        const date = document.getElementById('articleDate').value;
        const excerpt = document.getElementById('articleExcerpt').value.trim();
        const content = document.getElementById('articleContent').value;
        const pinned = document.getElementById('articlePinned').checked;
        const published = publish ? true : (document.getElementById('articlePublished')?.checked || false);

        if (!title) {
            alert('请输入文章标题');
            document.getElementById('articleTitle').focus();
            return;
        }

        // 生成文件路径
        const filename = title.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.md';
        const filePath = 'articles/' + filename;

        // 保存markdown文件到IndexedDB（浏览器无法直接写文件系统）
        // 使用Blob方式模拟文件存储
        await this.saveMarkdownFile(filename, content);

        if (this.currentEditId) {
            // 更新现有文章
            const index = this.articles.findIndex(a => a.id === this.currentEditId);
            if (index !== -1) {
                this.articles[index] = {
                    ...this.articles[index],
                    title,
                    category,
                    date,
                    excerpt,
                    content,
                    filePath: filePath,
                    tags: this.selectedTags,
                    pinned,
                    published
                };
            }
        } else {
            // 新建文章
            const newArticle = {
                id: this.generateId(),
                title,
                category,
                date,
                excerpt,
                content,
                filePath: filePath,
                tags: this.selectedTags,
                pinned,
                published,
                views: 0,
                likes: 0
            };
            this.articles.push(newArticle);
        }

        this.saveToStorage();
        this.render();
        this.closeModal();

        this.showToast(this.currentEditId ? '文章已更新' : '文章已发布');
    }

    // 保存Markdown文件到IndexedDB
    async saveMarkdownFile(filename, content) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('BlogStorage', 1);

            request.onerror = () => reject(request.error);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('articles')) {
                    db.createObjectStore('articles', { keyPath: 'filename' });
                }
            };

            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['articles'], 'readwrite');
                const store = transaction.objectStore('articles');

                store.put({ filename: filename, content: content, updatedAt: new Date().toISOString() });

                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            };
        });
    }

    // 导出文章为Markdown文件
    async exportArticles() {
        if (this.articles.length === 0) {
            this.showToast('没有可导出的文章');
            return;
        }

        this.showToast('正在导出文章...');

        try {
            // 从IndexedDB获取所有文章内容
            const contents = await this.loadAllFromIndexedDB();

            const zip = new JSZip();
            const articlesFolder = zip.folder('articles');

            for (const article of this.articles) {
                // 获取文件名
                let filename = article.filePath ? article.filePath.replace('articles/', '') : null;

                // 如果没有filePath，从标题生成
                if (!filename) {
                    filename = article.title.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.md';
                }

                // 确保有 .md 扩展名
                if (!filename.endsWith('.md')) {
                    filename += '.md';
                }

                // 获取内容（优先从IndexedDB获取）
                const content = contents[filename] || article.content || '';

                // 构建带front matter的markdown文件
                const frontMatter = this.buildFrontMatter(article);
                const fullContent = frontMatter + '\n\n' + content;

                articlesFolder.file(filename, fullContent);
            }

            // 生成并下载zip文件
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'blog-articles-' + new Date().toISOString().split('T')[0] + '.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showToast('文章导出成功');
        } catch (error) {
            console.error('导出失败:', error);
            this.showToast('导出失败: ' + error.message);
        }
    }

    // 从IndexedDB加载所有内容
    loadAllFromIndexedDB() {
        return new Promise((resolve) => {
            if (typeof indexedDB === 'undefined') {
                resolve({});
                return;
            }

            const request = indexedDB.open('BlogStorage', 1);
            request.onerror = () => resolve({});

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('articles')) {
                    db.createObjectStore('articles', { keyPath: 'filename' });
                }
            };

            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['articles'], 'readonly');
                const store = transaction.objectStore('articles');
                const getAllRequest = store.getAll();

                getAllRequest.onsuccess = () => {
                    const files = getAllRequest.result;
                    const fileMap = {};
                    files.forEach(f => fileMap[f.filename] = f.content);
                    resolve(fileMap);
                };

                getAllRequest.onerror = () => resolve({});
            };
        });
    }

    // 清除所有数据
    clearAllData() {
        if (!confirm('确定要清除所有博客数据吗？此操作不可恢复！')) {
            return;
        }

        // 清除 localStorage
        storage.remove('blog_articles');
        storage.remove('blog_categories');

        // 清除 IndexedDB
        if (typeof indexedDB !== 'undefined') {
            indexedDB.deleteDatabase('BlogStorage');
        }

        // 重置文章数组
        this.articles = [];

        // 重新加载默认分类
        this.categories = this.getDefaultCategories();
        storage.set('blog_categories', this.categories);

        // 刷新显示
        this.render();
        this.renderCategorySelect();

        this.showToast('所有数据已清除');
    }

    // 打开分类管理模态框
    openCategoryModal() {
        this.renderCategoryList();
        document.getElementById('categoryModal').classList.add('active');
    }

    // 关闭分类模态框
    closeCategoryModal() {
        document.getElementById('categoryModal').classList.remove('active');
        document.getElementById('newCategoryName').value = '';
    }

    // 渲染分类列表
    renderCategoryList() {
        const list = document.getElementById('categoryList');
        if (!list) return;

        // 统计每个分类的文章数
        const categoryCounts = {};
        this.articles.forEach(article => {
            categoryCounts[article.category] = (categoryCounts[article.category] || 0) + 1;
        });

        list.innerHTML = this.categories.map(cat => `
            <div class="category-item" style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas ${cat.icon}"></i>
                    <span>${cat.name}</span>
                    <span style="font-size: 0.75rem; color: var(--text-light);">(${categoryCounts[cat.id] || 0}篇)</span>
                </div>
                <button class="btn-delete-category" data-id="${cat.id}" style="background: none; border: none; color: var(--text-light); cursor: pointer; padding: 0.25rem;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        // 添加删除事件
        list.querySelectorAll('.btn-delete-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.deleteCategory(id);
            });
        });
    }

    // 添加分类
    addCategory() {
        const name = document.getElementById('newCategoryName').value.trim();
        const icon = document.getElementById('newCategoryIcon').value;

        if (!name) {
            this.showToast('请输入分类名称');
            return;
        }

        // 检查是否已存在
        if (this.categories.some(c => c.name === name)) {
            this.showToast('分类已存在');
            return;
        }

        const newCategory = {
            id: name.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-'),
            name: name,
            icon: icon
        };

        this.categories.push(newCategory);
        storage.set('blog_categories', this.categories);

        document.getElementById('newCategoryName').value = '';
        this.renderCategoryList();
        this.renderCategorySelect();
        this.showToast('分类已添加');
    }

    // 删除分类
    deleteCategory(id) {
        const category = this.categories.find(c => c.id === id);
        if (!category) return;

        // 检查该分类下是否有文章
        const articleCount = this.articles.filter(a => a.category === id).length;

        if (articleCount > 0) {
            if (!confirm(`该分类下有 ${articleCount} 篇文章，删除后这些文章将变为"其他"分类。确定要删除吗？')) {
                return;
            }
            // 将该分类的文章改为 other
            this.articles.forEach(article => {
                if (article.category === id) {
                    article.category = 'other';
                }
            });
            this.saveToStorage();
        }

        // 删除分类
        this.categories = this.categories.filter(c => c.id !== id);
        storage.set('blog_categories', this.categories);

        this.renderCategoryList();
        this.renderCategorySelect();
        this.showToast('分类已删除');
    }
    buildFrontMatter(article) {
        const meta = {
            title: article.title,
            date: article.date,
            category: article.category,
            tags: article.tags,
            published: article.published,
            pinned: article.pinned
        };

        let yaml = '---\n';
        for (const [key, value] of Object.entries(meta)) {
            if (value !== undefined && value !== null && value !== '') {
                if (Array.isArray(value)) {
                    yaml += `${key}: ${value.join(', ')}\n`;
                } else if (typeof value === 'boolean') {
                    yaml += `${key}: ${value}\n`;
                } else {
                    yaml += `${key}: "${value}"\n`;
                }
            }
        }
        yaml += '---';
        return yaml;
    }
    showPreview() {
        const title = document.getElementById('articleTitle').value || '无标题';
        const content = document.getElementById('articleContent').value || '';
        const date = document.getElementById('articleDate').value;
        const category = document.getElementById('articleCategory');

        const categoryName = category?.options?.[category.selectedIndex]?.text || '未分类';

        // 使用 marked 解析 Markdown
        const htmlContent = window.marked ? window.marked.parse(content) : content.replace(/\n/g, '<br>');

        document.getElementById('previewContent').innerHTML = `
            <h1>${this.escapeHtml(title)}</h1>
            <div class="meta">
                <span><i class="fas fa-calendar"></i> ${date}</span>
                <span><i class="fas fa-folder"></i> ${categoryName}</span>
            </div>
            <div class="content">${htmlContent}</div>
        `;

        document.getElementById('previewModal').classList.add('active');
    }

    closePreviewModal() {
        document.getElementById('previewModal')?.classList.remove('active');
    }

    // 添加标签
    addTagFromInput() {
        const input = document.getElementById('articleTags');
        const value = input.value.trim().replace(',', '');

        if (value && !this.selectedTags.includes(value)) {
            this.selectedTags.push(value);
            this.renderSelectedTags();
        }

        input.value = '';
    }

    renderSelectedTags() {
        const container = document.getElementById('selectedTags');
        if (!container) return;

        container.innerHTML = this.selectedTags.map(tag => `
            <span class="tag-item">
                ${this.escapeHtml(tag)}
                <span class="remove-tag" data-tag="${this.escapeHtml(tag)}">&times;</span>
            </span>
        `).join('');

        container.querySelectorAll('.remove-tag').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedTags = this.selectedTags.filter(t => t !== btn.dataset.tag);
                this.renderSelectedTags();
            });
        });
    }

    renderSuggestedTags() {
        const container = document.getElementById('suggestedTags');
        if (!container) return;

        // 从现有文章提取标签
        const allTags = [...new Set(this.articles.flatMap(a => a.tags || []))];
        const unusedTags = allTags.filter(t => !this.selectedTags.includes(t)).slice(0, 10);

        container.innerHTML = unusedTags.map(tag =>
            `<span class="suggested-tag" data-tag="${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</span>`
        ).join('');

        container.querySelectorAll('.suggested-tag').forEach(el => {
            el.addEventListener('click', () => {
                if (!this.selectedTags.includes(el.dataset.tag)) {
                    this.selectedTags.push(el.dataset.tag);
                    this.renderSelectedTags();
                }
            });
        });
    }

    // 删除
    openDeleteModal(ids) {
        this.deleteIds = ids;
        document.getElementById('deleteModal').classList.add('active');
    }

    closeDeleteModal() {
        document.getElementById('deleteModal')?.classList.remove('active');
        this.deleteIds = [];
    }

    confirmDelete() {
        if (this.deleteIds.length === 0) return;

        this.articles = this.articles.filter(a => !this.deleteIds.includes(a.id));
        this.saveToStorage();
        this.render();
        this.closeDeleteModal();

        this.showToast(`已删除 ${this.deleteIds.length} 篇文章`);
    }

    // 批量操作
    getSelectedIds() {
        return [...document.querySelectorAll('.article-checkbox:checked')].map(cb => cb.value);
    }

    updateBatchActions() {
        const selected = this.getSelectedIds();
        const batchActions = document.getElementById('batchActions');
        const selectedCount = document.getElementById('selectedCount');

        if (selected.length > 0) {
            if (batchActions) batchActions.style.display = 'flex';
            if (selectedCount) selectedCount.textContent = selected.length;
        } else {
            if (batchActions) batchActions.style.display = 'none';
        }
    }

    batchPublish() {
        const ids = this.getSelectedIds();
        if (ids.length === 0) return;

        ids.forEach(id => {
            const article = this.articles.find(a => a.id === id);
            if (article) article.published = true;
        });

        this.saveToStorage();
        this.render();
        this.showToast(`已发布 ${ids.length} 篇文章`);
    }

    // 筛选
    filterArticles() {
        const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const category = document.getElementById('categoryFilter')?.value || 'all';
        const status = document.getElementById('statusFilter')?.value || 'all';

        const rows = document.querySelectorAll('#articlesTableBody tr');

        rows.forEach(row => {
            const title = row.querySelector('.article-title-cell')?.textContent.toLowerCase() || '';
            const rowCategory = row.querySelector('.category-badge')?.textContent.trim() || '';
            const isPublished = row.querySelector('.status-badge')?.classList.contains('published');

            const matchSearch = !search || title.includes(search);
            const matchCategory = category === 'all' || this.categories.find(c => c.id === category)?.name === rowCategory;
            const matchStatus = status === 'all' || (status === 'published' && isPublished) || (status === 'draft' && !isPublished);

            row.style.display = matchSearch && matchCategory && matchStatus ? '' : 'none';
        });
    }

    // 保存到存储
    saveToStorage() {
        console.log('保存文章到存储:', this.articles);
        storage.set('blog_articles', this.articles);
        storage.set('blog_categories', this.categories);
    }

    // 工具函数
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    debounce(fn, delay) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
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
            border-radius: var(--radius-md);
            z-index: 99999;
            animation: slideInUp 0.3s ease-out;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded 触发');
    window.blogAdmin = new BlogAdmin();
    console.log('BlogAdmin实例已创建:', !!window.blogAdmin);
});

// 全局错误监听
window.addEventListener('error', function(e) {
    console.error('页面错误:', e.message, '文件:', e.filename, '行号:', e.lineno);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Promise错误:', e.reason);
});

console.log('=== blog-admin.js 加载完成 ===');