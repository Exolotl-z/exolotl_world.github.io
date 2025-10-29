# 🚀 GitHub部署快速指南

## 📋 部署前准备

1. **确保你有GitHub账号**
   - 如果没有，前往 [github.com](https://github.com) 注册

2. **安装Git**
   - Windows: 下载 [Git for Windows](https://git-scm.com/download/win)
   - Mac: `brew install git`
   - Linux: `sudo apt-get install git`

## 🎯 部署步骤

### 方法一：通过GitHub Desktop（推荐新手）

1. **下载并安装 GitHub Desktop**
   - 访问 [desktop.github.com](https://desktop.github.com)

2. **创建新仓库**
   - 打开GitHub Desktop
   - File > Add Local Repository
   - 选择你的项目文件夹
   - Publish repository

3. **启用GitHub Pages**
   - 在浏览器中打开你的仓库
   - Settings > Pages
   - Source选择 `main` 分支
   - 点击Save
   - 等待1-2分钟，你的网站就上线了！

### 方法二：通过命令行

1. **在GitHub上创建新仓库**
   ```
   仓库名建议：personal-website 或 yourusername.github.io
   不要勾选 Initialize with README
   ```

2. **在项目文件夹中打开终端/命令提示符**

3. **执行以下命令**
   ```bash
   # 初始化Git仓库
   git init

   # 添加所有文件
   git add .

   # 提交更改
   git commit -m "🎉 Initial commit: Personal website"

   # 添加远程仓库（替换为你的仓库地址）
   git remote add origin https://github.com/你的用户名/仓库名.git

   # 推送到GitHub
   git branch -M main
   git push -u origin main
   ```

4. **启用GitHub Pages**
   - 进入仓库页面
   - Settings > Pages
   - Source: `main` 分支, `/ (root)` 文件夹
   - Save

5. **访问你的网站**
   - 网址：`https://你的用户名.github.io/仓库名`
   - 如果仓库名是 `yourusername.github.io`，则直接访问 `https://yourusername.github.io`

## 🔄 更新网站内容

### 使用GitHub Desktop
1. 修改文件
2. 打开GitHub Desktop
3. 在左侧看到更改列表
4. 填写提交信息
5. 点击"Commit to main"
6. 点击"Push origin"
7. 等待1-2分钟，更新生效

### 使用命令行
```bash
# 添加更改的文件
git add .

# 提交更改
git commit -m "更新说明"

# 推送到GitHub
git push
```

## 🎨 自定义你的网站

### 1. 修改个人信息
编辑 `index.html`:
- 第14行：网站标题
- 第32-33行：导航栏Logo
- 第47-49行：英雄区域标题
- 第50-54行：个人介绍
- 第64-69行：按钮链接
- 第82-93行：技能标签
- 第168-178行：社交链接（重要！）

### 2. 修改联系方式
在 `index.html` 找到 `social-links` 部分（约168行）：
```html
<a href="https://github.com/你的用户名" target="_blank">
<a href="mailto:你的邮箱@example.com">
<a href="https://linkedin.com/in/你的ID" target="_blank">
```

### 3. 添加你的项目
在 `index.html` 的 projects-grid 部分（约107行）：
- 修改项目标题
- 更新项目描述
- 修改技能标签
- 更新项目链接

### 4. 更改颜色主题
编辑 `css/main.css`（第3-14行）：
```css
:root {
    --primary-color: #667eea;  /* 改成你喜欢的颜色 */
    --secondary-color: #764ba2;
}
```

推荐颜色组合：
- 蓝紫色：`#667eea` + `#764ba2`（默认）
- 粉红色：`#f093fb` + `#f5576c`
- 蓝绿色：`#4facfe` + `#00f2fe`
- 绿色：`#43e97b` + `#38f9d7`

### 5. 添加博客文章
1. 复制 `article.html` 并重命名（如 `article-2.html`）
2. 修改文章内容
3. 在 `blog.html` 中添加文章卡片
4. 更新链接

## 🐛 常见问题

### Q: 推送失败，提示权限错误
**A:** 配置Git用户信息：
```bash
git config --global user.name "你的用户名"
git config --global user.email "你的邮箱"
```

### Q: 网站404错误
**A:** 检查：
1. GitHub Pages是否已启用
2. 分支是否选择正确
3. 等待几分钟让GitHub部署

### Q: 样式显示不正常
**A:** 检查：
1. 文件路径是否正确
2. CSS文件是否都上传了
3. 清除浏览器缓存（Ctrl+Shift+R）

### Q: 如何使用自定义域名？
**A:** 
1. 在项目根目录创建 `CNAME` 文件
2. 文件内容填写：`www.你的域名.com`
3. 在域名服务商添加CNAME记录指向 `你的用户名.github.io`

## 📝 检查清单

部署前确认：
- [ ] 已修改所有个人信息
- [ ] 社交链接已更新为真实地址
- [ ] 邮箱地址已修改
- [ ] 项目描述已更新
- [ ] 测试所有链接是否有效
- [ ] 在本地浏览器测试过
- [ ] 检查手机端显示

## 🎉 恭喜！

你的个人网站已成功部署！

**分享你的网站：**
- 添加到GitHub个人资料
- 分享到社交媒体
- 添加到简历中

**持续改进：**
- 定期更新博客内容
- 添加新项目
- 优化SEO
- 收集访问数据

---

需要帮助？查看 [GitHub Pages文档](https://docs.github.com/pages)
