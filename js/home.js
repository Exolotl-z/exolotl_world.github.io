// ===== 首页特定功能 =====

// 处理头像图片加载
function handleAvatarImage() {
    const avatarImg = document.querySelector('.avatar-img');
    const avatarPlaceholder = document.querySelector('.avatar-placeholder');
    
    if (avatarImg) {
        // 图片加载成功
        avatarImg.addEventListener('load', function() {
            if (avatarPlaceholder) {
                avatarPlaceholder.style.opacity = '0';
            }
        });
        
        // 图片加载失败，显示占位符
        avatarImg.addEventListener('error', function() {
            this.style.display = 'none';
            if (avatarPlaceholder) {
                avatarPlaceholder.style.opacity = '1';
            }
        });
    }
}

// 加载置顶的奇思妙想
function loadPinnedIdeas() {
    const ideas = storage.get('ideas') || [];
    const pinnedIdeas = ideas.filter(i => i.pinned).slice(0, 3);
    
    const grid = document.getElementById('pinnedIdeasGrid');
    const emptyState = document.getElementById('emptyIdeas');
    
    if (!grid) return;
    
    if (pinnedIdeas.length === 0) {
        grid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    grid.innerHTML = '';
    
    pinnedIdeas.forEach(idea => {
        const card = document.createElement('article');
        card.className = 'idea-card-home';
        
        const excerpt = idea.content.length > 100 
            ? idea.content.substring(0, 100) + '...' 
            : idea.content;
        
        card.innerHTML = `
            <h3 class="idea-title">${escapeHtml(idea.title)}</h3>
            <p class="idea-content">${escapeHtml(excerpt)}</p>
            <div class="idea-tags">
                ${idea.tags.map(tag => `<span class="idea-tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
        `;
        
        // 点击卡片跳转到奇思妙想页面
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            window.location.href = 'ideas.html';
        });
        
        grid.appendChild(card);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 技能标签动画
const skillTags = document.querySelectorAll('.skill-tag');
skillTags.forEach((tag, index) => {
    // 随机大小变化效果
    const randomScale = 1 + Math.random() * 0.2;
    tag.style.setProperty('--scale', randomScale);
    
    // 点击技能标签时的效果
    tag.addEventListener('click', function() {
        this.style.transform = 'scale(1.2) rotate(5deg)';
        setTimeout(() => {
            this.style.transform = '';
        }, 300);
    });
});

// 头像圆圈动画
const avatarCircle = document.querySelector('.avatar-circle');
if (avatarCircle) {
    let angle = 0;
    setInterval(() => {
        angle += 0.5;
        const scale = 1 + Math.sin(angle * Math.PI / 180) * 0.05;
        avatarCircle.style.transform = `scale(${scale})`;
    }, 50);
}

// 社交链接悬停效果
const socialLinks = document.querySelectorAll('.social-link');
socialLinks.forEach(link => {
    link.addEventListener('mouseenter', function() {
        const icon = this.querySelector('i');
        icon.style.animation = 'pulse 0.5s ease-in-out';
    });
    
    link.addEventListener('mouseleave', function() {
        const icon = this.querySelector('i');
        icon.style.animation = '';
    });
});

// 项目卡片3D效果
const projectCards = document.querySelectorAll('.project-card');
projectCards.forEach(card => {
    card.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        
        this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = '';
    });
});

// 打字机效果（可选）
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// 滚动时添加视差效果
window.addEventListener('scroll', throttle(() => {
    const scrolled = window.pageYOffset;
    const heroImage = document.querySelector('.hero-image');
    
    if (heroImage) {
        heroImage.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
}, 16));

// 技能标签筛选（可选功能）
let currentFilter = 'all';

function filterSkills(level) {
    currentFilter = level;
    skillTags.forEach(tag => {
        if (level === 'all' || tag.dataset.level === level) {
            tag.style.display = 'inline-block';
            tag.style.animation = 'fadeIn 0.5s ease-out';
        } else {
            tag.style.display = 'none';
        }
    });
}

// 统计项目数量
const projectCount = document.querySelectorAll('.project-card').length;
console.log(`共有 ${projectCount} 个项目展示`);

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
    // 添加加载动画完成类
    document.body.classList.add('loaded');
    
    // 处理头像图片
    handleAvatarImage();
    
    // 加载置顶的奇思妙想
    loadPinnedIdeas();
    
    console.log('首页加载完成');
});
