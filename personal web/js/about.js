// ===== 关于我页面脚本 =====

document.addEventListener('DOMContentLoaded', () => {
    initGalleryHover();
    initScrollAnimation();
    handleAvatarError();
});

// 处理头像加载失败
function handleAvatarError() {
    const avatarImg = document.querySelector('.hero-avatar img');
    if (avatarImg) {
        avatarImg.onerror = function() {
            this.style.display = 'none';
            const avatarContainer = document.querySelector('.hero-avatar');
            avatarContainer.innerHTML = '<i class="fas fa-user-astronaut"></i>';
            avatarContainer.style.cssText = 'display: flex; align-items: center; justify-content: center; font-size: 4rem; color: var(--text-light);';
        };
    }
}

// 画廊悬停效果
function initGalleryHover() {
    const items = document.querySelectorAll('.gallery-item');
    items.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.zIndex = '10';
        });
        item.addEventListener('mouseleave', () => {
            item.style.zIndex = '1';
        });
    });
}

// 滚动动画
function initScrollAnimation() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // 观察时间轴节点
    document.querySelectorAll('.timeline-node').forEach(node => {
        observer.observe(node);
    });

    // 观察图片墙项
    document.querySelectorAll('.gallery-item').forEach(item => {
        observer.observe(item);
    });
}

// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});