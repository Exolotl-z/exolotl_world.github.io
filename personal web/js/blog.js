// ===== 博客页面功能 =====

class BlogManager {
    constructor() {
        this.articles = [];
        this.categories = this.getCategories();
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.pageSize = 10;
        this.currentPage = 1;
        this.init();
    }

    // 获取分类
    getCategories() {
        const defaultCategories = [
            { id: 'frontend', name: '前端开发', icon: 'fa-palette', count: 0 },
            { id: 'backend', name: '后端开发', icon: 'fa-server', count: 0 },
            { id: 'devops', name: 'DevOps', icon: 'fa-cloud', count: 0 },
            { id: 'ai', name: '人工智能', icon: 'fa-robot', count: 0 },
            { id: 'other', name: '其他', icon: 'fa-folder', count: 0 }
        ];
        const stored = storage.get('blog_categories');
        return stored || defaultCategories;
    }

    // 获取文章（优先从JSON文件加载）
    async getArticles() {
        // 尝试从JSON文件加载
        if (typeof dataManager !== 'undefined') {
            const jsonData = await dataManager.loadBlogData();
            if (jsonData && jsonData.length > 0) {
                console.log('使用JSON文件数据:', jsonData.length, '篇文章');
                return jsonData.filter(article => article.published !== false);
            }
        }

        // 回退到localStorage
        const metadata = storage.get('blog_articles') || [];
        console.log('从存储获取的文章元数据:', metadata);

        // 从IndexedDB加载文章内容
        const articlesWithContent = await this.loadArticlesContent(metadata);
        return articlesWithContent.filter(article => article.published);
    }

    // 从IndexedDB加载文章内容
    async loadArticlesContent(articles) {
        if (typeof indexedDB === 'undefined') return articles;

        return new Promise((resolve) => {
            const request = indexedDB.open('BlogStorage', 1);

            request.onerror = () => resolve(articles);

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

                    // 将内容合并到元数据
                    const articlesWithContent = articles.map(article => {
                        if (article.filePath) {
                            const filename = article.filePath.replace('articles/', '');
                            const content = fileMap[filename];
                            console.log('查找文章:', article.title, 'filename:', filename, 'content长度:', content ? content.length : 0);
                            return {
                                ...article,
                                content: content || article.content || ''
                            };
                        }
                        console.log('文章无filePath:', article.title);
                        return article;
                    });

                    console.log('加载文章内容后的数据:', articlesWithContent);
                    resolve(articlesWithContent);
                };

                getAllRequest.onerror = () => resolve(articles);
            };
        });
    }

    // 初始化
    async init() {
        this.articles = await this.getArticles();
        this.renderStats();
        this.renderCategories();
        this.renderTags();
        this.renderArticles();
        this.attachEvents();
        this.checkAdmin();
    }

    // 检查管理员权限
    checkAdmin() {
        if (typeof auth !== 'undefined' && auth.isAuthenticated()) {
            const adminCard = document.getElementById('adminCard');
            if (adminCard) {
                adminCard.style.display = 'block';
            }
        }
    }

    // 渲染统计信息
    renderStats() {
        const articleCount = document.getElementById('articleCount');
        const categoryCount = document.getElementById('categoryCount');
        const tagCount = document.getElementById('tagCount');

        if (articleCount) articleCount.textContent = this.articles.length;

        const activeCategories = [...new Set(this.articles.map(a => a.category))];
        if (categoryCount) categoryCount.textContent = activeCategories.length;

        const allTags = this.articles.flatMap(a => a.tags || []);
        const uniqueTags = [...new Set(allTags)];
        if (tagCount) tagCount.textContent = uniqueTags.length;
    }

    // 渲染分类列表
    renderCategories() {
        const categoryTree = document.getElementById('categoryTree');
        const filterTags = document.getElementById('filterTags');
        if (!categoryTree) return;

        // 统计每个分类的文章数
        const categoryCounts = {};
        this.articles.forEach(article => {
            categoryCounts[article.category] = (categoryCounts[article.category] || 0) + 1;
        });

        // 更新分类数据
        this.categories.forEach(cat => {
            cat.count = categoryCounts[cat.id] || 0;
        });

        // 渲染分类树
        categoryTree.innerHTML = `
            <li class="category-item">
                <a class="category-link active" data-category="all">
                    <span><i class="fas fa-th"></i> 全部文章</span>
                    <span class="count">${this.articles.length}</span>
                </a>
            </li>
            ${this.categories.map(cat => `
                <li class="category-item">
                    <a class="category-link" data-category="${cat.id}">
                        <span><i class="fas ${cat.icon}"></i> ${cat.name}</span>
                        <span class="count">${cat.count}</span>
                    </a>
                </li>
            `).join('')}
        `;

        // 渲染筛选标签
        if (filterTags) {
            filterTags.innerHTML = `
                <button class="filter-tag active" data-category="all">全部</button>
                ${this.categories.map(cat => `
                    <button class="filter-tag" data-category="${cat.id}">${cat.name}</button>
                `).join('')}
            `;
        }
    }

    // 渲染标签云
    renderTags() {
        const tagCloud = document.getElementById('tagCloud');
        if (!tagCloud) return;

        // 统计标签出现次数
        const tagCounts = {};
        this.articles.forEach(article => {
            (article.tags || []).forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        // 排序并取前15个
        const sortedTags = Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 15);

        if (sortedTags.length === 0) {
            tagCloud.innerHTML = '<p style="font-size: 0.875rem; color: var(--text-light);">暂无标签</p>';
            return;
        }

        tagCloud.innerHTML = sortedTags.map(([tag, count]) =>
            `<a class="tag-link" data-tag="${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</a>`
        ).join('');
    }

    // 渲染文章列表
    renderArticles() {
        const articlesList = document.getElementById('articlesList');
        const emptyState = document.getElementById('emptyState');
        const loadMore = document.getElementById('loadMore');

        if (!articlesList) return;

        // 筛选文章
        let filteredArticles = this.filterArticles();

        // 排序：置顶 > 日期
        filteredArticles.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.date) - new Date(a.date);
        });

        if (filteredArticles.length === 0) {
            articlesList.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            if (loadMore) loadMore.style.display = 'none';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        // 只显示当前页的文章
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageArticles = filteredArticles.slice(start, end);

        // 显示加载更多按钮
        if (loadMore) {
            loadMore.style.display = end < filteredArticles.length ? 'block' : 'none';
        }

        // 渲染文章卡片
        articlesList.innerHTML = pageArticles.map((article, index) => {
            const category = this.categories.find(c => c.id === article.category) || { name: article.category, icon: 'fa-folder' };
            const date = new Date(article.date);
            const formattedDate = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

            return `
                <article class="article-card" data-category="${article.category}" data-id="${article.id}" style="animation-delay: ${index * 0.1}s">
                    <div class="article-header">
                        <span class="article-category">
                            <i class="fas ${category.icon}"></i>
                            ${category.name}
                        </span>
                        <span class="article-date">
                            <i class="far fa-calendar"></i>
                            ${formattedDate}
                        </span>
                    </div>
                    <h2 class="article-title">
                        <a href="article.html?id=${article.id}">${this.escapeHtml(article.title)}</a>
                    </h2>
                    <p class="article-excerpt">${this.escapeHtml(article.excerpt || '')}</p>
                    <div class="article-footer">
                        <div class="article-tags">
                            ${(article.tags || []).slice(0, 5).map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                        </div>
                        <a href="article.html?id=${article.id}" class="read-more-link">
                            阅读全文 <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </article>
            `;
        }).join('');

        // 更新统计
        this.renderStats();
    }

    // 筛选文章
    filterArticles() {
        return this.articles.filter(article => {
            // 分类筛选
            const categoryMatch = this.currentCategory === 'all' || article.category === this.currentCategory;

            // 搜索筛选
            const searchLower = this.searchQuery.toLowerCase();
            const searchMatch = !this.searchQuery ||
                article.title.toLowerCase().includes(searchLower) ||
                (article.excerpt || '').toLowerCase().includes(searchLower) ||
                (article.tags || []).some(tag => tag.toLowerCase().includes(searchLower));

            return categoryMatch && searchMatch;
        });
    }

    // 附加事件
    attachEvents() {
        // 搜索
        const searchInput = document.getElementById('searchInput');
        const searchClear = document.getElementById('searchClear');

        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchQuery = e.target.value.trim();
                this.currentPage = 1;
                this.renderArticles();

                if (searchClear) {
                    searchClear.style.display = this.searchQuery ? 'block' : 'none';
                }
            }, 300));
        }

        if (searchClear) {
            searchClear.addEventListener('click', () => {
                this.searchQuery = '';
                searchInput.value = '';
                searchClear.style.display = 'none';
                this.currentPage = 1;
                this.renderArticles();
            });
        }

        // 分类筛选 - 侧边栏
        const categoryTree = document.getElementById('categoryTree');
        if (categoryTree) {
            categoryTree.addEventListener('click', (e) => {
                const link = e.target.closest('.category-link');
                if (!link) return;

                document.querySelectorAll('.category-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                this.currentCategory = link.dataset.category;
                this.currentPage = 1;
                this.renderArticles();
            });
        }

        // 分类筛选 - 顶部标签
        const filterTags = document.getElementById('filterTags');
        if (filterTags) {
            filterTags.addEventListener('click', (e) => {
                const tag = e.target.closest('.filter-tag');
                if (!tag) return;

                document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
                tag.classList.add('active');

                // 同时更新侧边栏
                document.querySelectorAll('.category-link').forEach(l => {
                    l.classList.toggle('active', l.dataset.category === tag.dataset.category);
                });

                this.currentCategory = tag.dataset.category;
                this.currentPage = 1;
                this.renderArticles();
            });
        }

        // 标签云点击
        const tagCloud = document.getElementById('tagCloud');
        if (tagCloud) {
            tagCloud.addEventListener('click', (e) => {
                const link = e.target.closest('.tag-link');
                if (!link) return;

                this.searchQuery = link.dataset.tag;
                if (searchInput) searchInput.value = link.dataset.tag;
                if (searchClear) searchClear.style.display = 'block';
                this.currentPage = 1;
                this.renderArticles();
            });
        }

        // 加载更多
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.currentPage++;
                this.renderArticles();
                window.scrollTo({
                    top: document.body.scrollHeight - 500,
                    behavior: 'smooth'
                });
            });
        }
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
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.blogManager = new BlogManager();
    console.log('博客页面加载完成');
});

// 导出以便其他模块使用
window.BlogManager = BlogManager;