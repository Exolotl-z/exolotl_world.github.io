// ===== 文章详情页功能 =====

// 代码高亮初始化
document.addEventListener('DOMContentLoaded', () => {
    if (typeof hljs !== 'undefined') {
        hljs.highlightAll();
    }
});

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

// 点赞功能
const likeBtn = document.getElementById('likeBtn');
let isLiked = storage.get('article_liked') || false;
let likeCount = 89;

if (likeBtn) {
    // 初始化点赞状态
    if (isLiked) {
        likeBtn.classList.add('active');
        const icon = likeBtn.querySelector('i');
        icon.classList.remove('far');
        icon.classList.add('fas');
    }
    
    likeBtn.addEventListener('click', function() {
        isLiked = !isLiked;
        storage.set('article_liked', isLiked);
        
        const icon = this.querySelector('i');
        const count = this.querySelector('span');
        
        if (isLiked) {
            this.classList.add('active');
            icon.classList.remove('far');
            icon.classList.add('fas');
            likeCount++;
            count.textContent = likeCount;
            
            // 点赞动画
            this.style.animation = 'pulse 0.3s ease-in-out';
            setTimeout(() => {
                this.style.animation = '';
            }, 300);
        } else {
            this.classList.remove('active');
            icon.classList.remove('fas');
            icon.classList.add('far');
            likeCount--;
            count.textContent = likeCount;
        }
    });
}

// 收藏功能
const bookmarkBtn = document.getElementById('bookmarkBtn');
let isBookmarked = storage.get('article_bookmarked') || false;

if (bookmarkBtn) {
    if (isBookmarked) {
        bookmarkBtn.classList.add('active');
        const icon = bookmarkBtn.querySelector('i');
        icon.classList.remove('far');
        icon.classList.add('fas');
    }
    
    bookmarkBtn.addEventListener('click', function() {
        isBookmarked = !isBookmarked;
        storage.set('article_bookmarked', isBookmarked);
        
        const icon = this.querySelector('i');
        const text = this.querySelector('span');
        
        if (isBookmarked) {
            this.classList.add('active');
            icon.classList.remove('far');
            icon.classList.add('fas');
            text.textContent = '已收藏';
        } else {
            this.classList.remove('active');
            icon.classList.remove('fas');
            icon.classList.add('far');
            text.textContent = '收藏';
        }
    });
}

// 分享功能
const shareBtn = document.getElementById('shareBtn');
if (shareBtn) {
    shareBtn.addEventListener('click', async function() {
        const articleTitle = document.getElementById('articleTitle').textContent;
        const articleUrl = window.location.href;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: articleTitle,
                    url: articleUrl
                });
            } catch (err) {
                console.log('分享失败', err);
            }
        } else {
            // 复制链接
            try {
                await navigator.clipboard.writeText(articleUrl);
                showToast('链接已复制到剪贴板');
            } catch (err) {
                console.error('复制失败', err);
            }
        }
    });
}

// Toast提示
function showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: var(--text-primary);
        color: white;
        padding: 1rem 2rem;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 9999;
        animation: fadeIn 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, duration);
}

// 评论功能
const commentInput = document.getElementById('commentInput');
const submitComment = document.getElementById('submitComment');
const commentsList = document.querySelector('.comments-list');

// 获取评论数据
let comments = storage.get('article_comments') || [];

if (submitComment) {
    submitComment.addEventListener('click', function() {
        const content = commentInput.value.trim();
        
        if (!content) {
            showToast('请输入评论内容');
            return;
        }
        
        // 创建新评论
        const newComment = {
            id: generateId(),
            author: '游客' + Math.floor(Math.random() * 1000),
            content: content,
            time: new Date(),
            likes: 0
        };
        
        comments.unshift(newComment);
        storage.set('article_comments', comments);
        
        // 添加评论到列表
        addCommentToList(newComment);
        
        // 清空输入框
        commentInput.value = '';
        
        // 更新评论数
        updateCommentCount();
        
        showToast('评论发表成功');
    });
}

// 添加评论到列表
function addCommentToList(comment) {
    const commentHTML = `
        <div class="comment-item" data-id="${comment.id}">
            <div class="comment-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-time">刚刚</span>
                </div>
                <p class="comment-text">${comment.content}</p>
                <div class="comment-footer">
                    <button class="comment-action like-comment">
                        <i class="far fa-thumbs-up"></i>
                        <span>${comment.likes}</span>
                    </button>
                    <button class="comment-action">
                        <i class="far fa-comment"></i>
                        <span>回复</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    if (commentsList) {
        commentsList.insertAdjacentHTML('afterbegin', commentHTML);
    }
}

// 更新评论数
function updateCommentCount() {
    const countElement = document.querySelector('.comments-count');
    if (countElement) {
        const currentCount = parseInt(countElement.textContent.match(/\d+/)[0]);
        countElement.textContent = `(${currentCount + 1})`;
    }
}

// 评论点赞
document.addEventListener('click', function(e) {
    if (e.target.closest('.like-comment')) {
        const button = e.target.closest('.like-comment');
        const icon = button.querySelector('i');
        const count = button.querySelector('span');
        
        if (icon.classList.contains('far')) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            count.textContent = parseInt(count.textContent) + 1;
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            count.textContent = parseInt(count.textContent) - 1;
        }
    }
});

// 代码复制功能
document.querySelectorAll('pre code').forEach(block => {
    const pre = block.parentElement;
    const button = document.createElement('button');
    button.className = 'copy-code-btn';
    button.innerHTML = '<i class="fas fa-copy"></i> 复制';
    button.style.cssText = `
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        padding: 0.375rem 0.75rem;
        background: var(--bg-secondary);
        border: none;
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: 0.875rem;
        opacity: 0;
        transition: opacity 0.3s;
    `;
    
    pre.style.position = 'relative';
    pre.appendChild(button);
    
    pre.addEventListener('mouseenter', () => {
        button.style.opacity = '1';
    });
    
    pre.addEventListener('mouseleave', () => {
        button.style.opacity = '0';
    });
    
    button.addEventListener('click', async () => {
        const code = block.textContent;
        try {
            await navigator.clipboard.writeText(code);
            button.innerHTML = '<i class="fas fa-check"></i> 已复制';
            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-copy"></i> 复制';
            }, 2000);
        } catch (err) {
            console.error('复制失败', err);
        }
    });
});

// 目录生成（可选功能）
function generateTOC() {
    const article = document.querySelector('.markdown-body');
    const headings = article.querySelectorAll('h2, h3');
    
    if (headings.length === 0) return;
    
    const toc = document.createElement('div');
    toc.className = 'table-of-contents';
    toc.innerHTML = '<h3>目录</h3><ul></ul>';
    
    const list = toc.querySelector('ul');
    
    headings.forEach((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;
        
        const li = document.createElement('li');
        li.className = heading.tagName.toLowerCase();
        li.innerHTML = `<a href="#${id}">${heading.textContent}</a>`;
        list.appendChild(li);
    });
    
    article.insertBefore(toc, article.firstChild);
}

// 页面加载完成
document.addEventListener('DOMContentLoaded', () => {
    // generateTOC(); // 如需目录功能，取消注释
    console.log('文章详情页加载完成');
});
