# 个人社交网站 | Personal Social Website

一个现代化的响应式个人网站，包含个人介绍、博客系统和数据面板。采用纯HTML、CSS和JavaScript构建，无需后端依赖。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## ✨ 特性

### 🏠 首页/个人介绍
- **响应式导航栏** - 支持移动端折叠菜单
- **动画英雄区域** - 吸引眼球的个人介绍
- **技能标签云** - 可交互的技能展示，支持不同等级标识
- **项目作品集** - 卡片式布局，悬停3D效果
- **社交链接** - 一键访问GitHub、LinkedIn、微博等平台

### 📝 博客系统
- **文章列表** - 优雅的卡片式布局
- **分类筛选** - 按前端、后端、设计、教程分类
- **实时搜索** - 支持标题、内容、标签搜索
- **文章详情** - Markdown渲染，代码高亮
- **评论系统** - 支持发表评论、点赞、回复
- **阅读进度** - 顶部进度条显示阅读位置
- **社交分享** - 一键分享文章

### 📊 数据面板
- **交互式日历** - 月/周/日视图切换
- **TODO列表** - 
  - 优先级标记（高/中/低）
  - 拖拽排序
  - 任务筛选
  - 本地存储
- **数据可视化** - 
  - 周任务完成趋势图（Chart.js）
  - 学习时间分布饼图
- **统计概览** - 已完成任务、学习时间、连续打卡、完成率

## 🎨 设计特点

- **现代简约风格** - 柔和的色彩搭配
- **流畅动画** - CSS3动画和过渡效果
- **卡片式布局** - 优雅的悬停效果
- **响应式设计** - 完美支持桌面、平板、手机
- **暗色模式支持** - 自动适配系统主题
- **无障碍访问** - ARIA标签和键盘导航支持

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/personal-website.git
cd personal-website
```

### 2. 本地运行

由于是纯静态网站，可以直接打开`index.html`文件，或使用本地服务器：

#### 使用Python（推荐）
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

然后在浏览器中访问 `http://localhost:8000`

#### 使用Node.js
```bash
npx http-server
```

#### 使用VS Code
安装 "Live Server" 扩展，右键点击 `index.html` 选择 "Open with Live Server"

### 3. 自定义内容

#### 修改个人信息
编辑 `index.html` 文件：
- 修改导航栏Logo和标题
- 更新英雄区域的介绍文字
- 自定义技能标签
- 添加/删除项目作品
- 更新社交链接

#### 添加博客文章
1. 在 `blog.html` 中添加文章卡片
2. 创建对应的文章详情页或使用 `article.html` 模板
3. 更新 `js/blog.js` 中的文章数据

#### 自定义样式
- `css/main.css` - 全局样式和CSS变量
- `css/home.css` - 首页样式
- `css/blog.css` - 博客列表样式
- `css/article.css` - 文章详情样式
- `css/dashboard.css` - 数据面板样式

#### 修改颜色主题
在 `css/main.css` 中修改CSS变量：
```css
:root {
    --primary-color: #667eea;  /* 主色调 */
    --secondary-color: #764ba2; /* 次要色 */
    /* ... 更多颜色变量 */
}
```

## 📁 项目结构

```
personal-website/
├── index.html              # 首页
├── blog.html              # 博客列表页
├── article.html           # 文章详情页
├── dashboard.html         # 数据面板
├── css/
│   ├── main.css          # 全局样式
│   ├── home.css          # 首页样式
│   ├── blog.css          # 博客样式
│   ├── article.css       # 文章详情样式
│   └── dashboard.css     # 数据面板样式
├── js/
│   ├── main.js           # 全局JavaScript
│   ├── home.js           # 首页功能
│   ├── blog.js           # 博客功能
│   ├── article.js        # 文章详情功能
│   └── dashboard.js      # 数据面板功能
└── README.md             # 项目说明
```

## 🌐 部署到GitHub Pages

### 方法一：通过GitHub网页操作

1. 在GitHub上创建新仓库
2. 上传所有文件到仓库
3. 进入仓库 Settings > Pages
4. Source选择 `main` 分支，文件夹选择 `/ (root)`
5. 点击Save，等待部署完成
6. 访问 `https://yourusername.github.io/repository-name`

### 方法二：通过Git命令行

```bash
# 初始化Git仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 添加远程仓库
git remote add origin https://github.com/yourusername/repository-name.git

# 推送到GitHub
git branch -M main
git push -u origin main
```

然后按照方法一的步骤3-6启用GitHub Pages。

### 自定义域名（可选）

1. 在仓库根目录创建 `CNAME` 文件
2. 文件内容填写你的域名（如：`www.example.com`）
3. 在域名服务商处添加CNAME记录指向 `yourusername.github.io`

## 🛠️ 技术栈

- **HTML5** - 语义化标签
- **CSS3** - Grid、Flexbox、动画、自定义属性
- **JavaScript (ES6+)** - 类、模块、箭头函数
- **Font Awesome** - 图标库
- **Google Fonts** - Poppins、Noto Sans SC字体
- **Chart.js** - 数据可视化
- **Highlight.js** - 代码高亮
- **Marked.js** - Markdown解析（文章详情页）

## 📱 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge
- Opera

最低要求：支持ES6的现代浏览器

## 🎯 功能特性

### 已实现
- ✅ 响应式布局
- ✅ 导航栏滚动效果
- ✅ 技能标签云
- ✅ 项目作品集展示
- ✅ 博客文章列表
- ✅ 文章搜索和筛选
- ✅ 文章详情页
- ✅ 评论系统
- ✅ 代码高亮
- ✅ 日历视图
- ✅ TODO列表（拖拽、优先级）
- ✅ 数据可视化图表
- ✅ 本地存储
- ✅ 暗色模式支持

### 可扩展功能
- 🔄 后端API集成
- 🔄 用户认证系统
- 🔄 Markdown编辑器
- 🔄 文件上传
- 🔄 实时通知
- 🔄 多语言支持

## 📝 自定义指南

### 添加新页面

1. 创建新的HTML文件
2. 复制现有页面的导航栏和页脚
3. 创建对应的CSS文件
4. 在导航栏中添加链接

### 集成后端API

在相应的JavaScript文件中：

```javascript
// 示例：获取博客文章
async function fetchArticles() {
    try {
        const response = await fetch('https://your-api.com/articles');
        const articles = await response.json();
        renderArticles(articles);
    } catch (error) {
        console.error('获取文章失败:', error);
    }
}
```

### 添加新的图表

```javascript
const ctx = document.getElementById('myChart');
new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['标签1', '标签2', '标签3'],
        datasets: [{
            label: '我的数据',
            data: [12, 19, 3],
            backgroundColor: '#667eea'
        }]
    }
});
```


## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证


## 🙏 致谢

- [Font Awesome](https://fontawesome.com/) - 图标
- [Chart.js](https://www.chartjs.org/) - 图表库
- [Highlight.js](https://highlightjs.org/) - 代码高亮
- [Google Fonts](https://fonts.google.com/) - 字体

---

⭐ 如果这个项目对你有帮助，请给个Star！

