// ===== 博客页面功能 =====

// 从本地存储获取分类数据
function getCategoriesData() {
    const defaultCategories = [
        { id: 'frontend', name: '前端开发', icon: 'fa-palette' },
        { id: 'backend', name: '后端开发', icon: 'fa-server' },
        { id: 'design', name: 'UI/UX设计', icon: 'fa-paint-brush' },
        { id: 'tutorial', name: '教程', icon: 'fa-book' },
        { id: 'other', name: '其他', icon: 'fa-folder' }
    ];
    return storage.get('blog_categories') || defaultCategories;
}

// 从本地存储获取文章数据
function getArticlesData() {
    const storedArticles = storage.get('blog_articles') || [];
    // 只返回已发布的文章
    return storedArticles.filter(article => article.published);
}

const categoriesData = getCategoriesData();
const articlesData = getArticlesData();

let currentCategory = 'all';
let searchQuery = '';

// 阅读进度条
const readingProgress = document.getElementById('readingProgress');

window.addEventListener('scroll', throttle(() => {
    const windowHeight = window.innerHeight;
    const fullHeight = document.documentElement.scrollHeight;
    const scrolled = window.scrollY;
    const progress = (scrolled / (fullHeight - windowHeight)) * 100;
    
    if (readingProgress) {
        readingProgress.style.transform = `scaleX(${progress / 100})`;
    }
}, 16));

// 分类筛选
const categoryButtons = document.querySelectorAll('.category-item');
categoryButtons.forEach(button => {
    button.addEventListener('click', function() {
        // 移除所有active类
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        // 添加active类到当前按钮
        this.classList.add('active');
        
        // 获取选中的分类
        currentCategory = this.dataset.category;
        
        // 筛选文章
        filterArticles();
    });
});

// 搜索功能
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', debounce(function() {
        searchQuery = this.value.toLowerCase().trim();
        filterArticles();
    }, 300));
}

// 筛选文章
function filterArticles() {
    const articleCards = document.querySelectorAll('.article-card');
    const emptyState = document.getElementById('emptyState');
    let visibleCount = 0;
    
    articleCards.forEach(card => {
        const category = card.dataset.category;
        const title = card.querySelector('.article-title').textContent.toLowerCase();
        const excerpt = card.querySelector('.article-excerpt').textContent.toLowerCase();
        const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase());
        
        // 分类筛选
        const categoryMatch = currentCategory === 'all' || category === currentCategory;
        
        // 搜索筛选
        const searchMatch = !searchQuery || 
            title.includes(searchQuery) || 
            excerpt.includes(searchQuery) ||
            tags.some(tag => tag.includes(searchQuery));
        
        if (categoryMatch && searchMatch) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.5s ease-out';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // 显示/隐藏空状态
    if (emptyState) {
        if (visibleCount === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
        }
    }
}

// 渲染文章列表
function renderArticles() {
    const articlesGrid = document.getElementById('articlesGrid');
    const emptyState = document.getElementById('emptyState');
    const articles = getArticlesData();
    
    if (articles.length === 0) {
        articlesGrid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    // 使用动态分类数据
    const categoryMap = {};
    categoriesData.forEach(cat => {
        categoryMap[cat.id] = { name: cat.name, icon: cat.icon };
    });
    
    articlesGrid.innerHTML = articles.map(article => {
        const category = categoryMap[article.category] || { name: article.category, icon: 'fa-folder' };
        
        return `
        <article class="article-card" data-category="${article.category}">
            <div class="article-header">
                <div class="article-meta">
                    <span class="article-category">
                        <i class="fas ${category.icon}"></i>
                        ${category.name}
                    </span>
                    <span class="article-date">
                        <i class="far fa-calendar"></i>
                        ${article.date}
                    </span>
                </div>
            </div>
            <div class="article-content">
                <h2 class="article-title">
                    <a href="article.html?id=${article.id}">${escapeHtml(article.title)}</a>
                </h2>
                <p class="article-excerpt">
                    ${escapeHtml(article.excerpt)}
                </p>
                <div class="article-tags">
                    ${article.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            </div>
            <div class="article-footer">
                <div class="article-stats">
                    <span><i class="far fa-eye"></i> ${formatNumber(article.views || 0)}</span>
                    <span><i class="far fa-heart"></i> ${article.likes || 0}</span>
                    <span><i class="far fa-comment"></i> ${article.comments || 0}</span>
                </div>
                <a href="article.html?id=${article.id}" class="read-more">
                    阅读更多
                    <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </article>
    `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

// 标签点击
const tagItems = document.querySelectorAll('.tag-item');
tagItems.forEach(tag => {
    tag.addEventListener('click', function() {
        searchQuery = this.textContent.toLowerCase();
        if (searchInput) {
            searchInput.value = this.textContent;
        }
        filterArticles();
    });
});

// 文章卡片悬停效果增强
const articleCards = document.querySelectorAll('.article-card');
articleCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = '';
    });
});

// 统计信息动画
function animateStats() {
    const stats = document.querySelectorAll('.article-stats span');
    stats.forEach(stat => {
        stat.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
        });
        
        stat.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
}

// 懒加载图片（如果有的话）
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// 无限滚动加载（可选功能）
let page = 1;
let isLoading = false;

function loadMoreArticles() {
    if (isLoading) return;
    
    const articlesGrid = document.getElementById('articlesGrid');
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight - 500;
    
    if (scrollPosition >= threshold) {
        isLoading = true;
        
        // 模拟加载更多文章
        setTimeout(() => {
            console.log(`加载第 ${++page} 页文章`);
            isLoading = false;
        }, 1000);
    }
}

// window.addEventListener('scroll', throttle(loadMoreArticles, 200));

// 分享文章
function shareArticle(articleId) {
    const article = articlesData.find(a => a.id === articleId);
    
    if (navigator.share) {
        navigator.share({
            title: article.title,
            text: article.excerpt,
            url: window.location.href
        }).catch(err => console.log('分享失败', err));
    } else {
        // 复制链接到剪贴板
        const url = `${window.location.origin}/article.html?id=${articleId}`;
        navigator.clipboard.writeText(url).then(() => {
            alert('链接已复制到剪贴板');
        });
    }
}

// 渲染分类筛选器
function renderCategoryFilters() {
    const categoryFilters = document.querySelector('.category-filters');
    if (!categoryFilters) return;

    // 清空现有的筛选器
    categoryFilters.innerHTML = '';

    // 添加“全部”选项
    const allFilter = document.createElement('button');
    allFilter.className = 'category-filter active';
    allFilter.dataset.category = 'all';
    allFilter.innerHTML = '<i class="fas fa-th"></i> 全部';
    categoryFilters.appendChild(allFilter);

    // 添加其他分类
    categoriesData.forEach(cat => {
        const filter = document.createElement('button');
        filter.className = 'category-filter';
        filter.dataset.category = cat.id;
        filter.innerHTML = `<i class="fas ${cat.icon}"></i> ${cat.name}`;
        categoryFilters.appendChild(filter);
    });

    // 添加点击事件
    attachCategoryFilterEvents();
}

// 附加分类筛选器事件
function attachCategoryFilterEvents() {
    const categoryFilters = document.querySelectorAll('.category-filter, .category-item');
    
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            const category = filter.dataset.category;
            currentCategory = category;
            
            // 更新激活状态
            categoryFilters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            
            // 筛选文章
            filterArticles();
        });
    });
}

// 渲染热门标签
function renderPopularTags() {
    const popularTagsEl = document.getElementById('popularTags');
    if (!popularTagsEl) return;

    // 统计所有标签出现次数
    const tagCounts = {};
    articlesData.forEach(article => {
        if (article.tags && Array.isArray(article.tags)) {
            article.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });

    // 按出现次数排序，取前10个
    const sortedTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag);

    if (sortedTags.length === 0) {
        popularTagsEl.innerHTML = '<p style="font-size: 0.875rem; color: var(--text-light);">暂无标签</p>';
        return;
    }

    popularTagsEl.innerHTML = sortedTags.map(tag => 
        `<span class="tag-item" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</span>`
    ).join('');

    // 添加点击事件
    popularTagsEl.querySelectorAll('.tag-item').forEach(el => {
        el.addEventListener('click', () => {
            const tag = el.dataset.tag;
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = tag;
                searchQuery = tag.toLowerCase();
                filterArticles();
            }
        });
    });
}

// 页面加载完成
document.addEventListener('DOMContentLoaded', () => {
    renderCategoryFilters();
    renderArticles();
    renderPopularTags();
    animateStats();
    lazyLoadImages();
    
    console.log('博客页面加载完成');
    console.log(`共有 ${articlesData.length} 篇文章`);
});
