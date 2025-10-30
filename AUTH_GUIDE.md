# 权限系统使用指南 | Authentication Guide

## 📋 概述

本网站实现了基于密码的权限保护系统，确保部署到GitHub Pages后，只有拥有密码的管理员才能编辑内容，其他访问者只能查看。

## 🔐 默认密码

```
admin123
```

⚠️ **重要提示**：首次使用请立即修改默认密码！

## 🎯 权限保护范围

### 完全保护（需要登录才能访问）
- ✅ **博客管理页面** (`blog-admin.html`)
  - 上传Markdown文件
  - 编辑文章
  - 删除文章
  - 管理分类和标签

### 功能级保护（未登录仅可查看）

#### 奇思妙想页面 (`ideas.html`)
- ✅ 所有人可查看想法卡片
- 🔒 未登录隐藏：
  - "添加想法"按钮
  - 编辑、删除、置顶按钮
- 💡 点击任何编辑操作时弹出登录框

#### 数据面板 (`dashboard.html`)
- ✅ 所有人可查看数据统计和图表
- 🔒 未登录隐藏：
  - "添加任务"表单
  - TODO项的编辑、删除按钮
  - 复选框变为禁用状态
  - 拖拽排序功能
- 💡 点击任何编辑操作时弹出登录框

### 无需保护
- ✅ 首页 (`index.html`)
- ✅ 博客展示页 (`blog.html`)
- ✅ 所有查看功能

## 🔧 如何使用

### 1. 首次登录

访问任何受保护的页面时，会自动弹出登录对话框：

```
请输入密码以继续访问此页面
```

输入密码 `admin123`，登录成功后会话保持24小时。

### 2. 修改密码

打开浏览器开发者工具（F12），切换到Console标签页，执行：

```javascript
await auth.changePassword('admin123', '你的新密码');
```

成功后会提示：
```
✅ 密码修改成功
```

### 3. 重置密码

如果忘记密码，可以执行：

```javascript
await auth.resetPassword();
```

这会将密码重置为默认值 `admin123`。

### 4. 手动登出

如果想要退出登录，执行：

```javascript
auth.logout();
```

然后刷新页面即可。

### 5. 检查登录状态

```javascript
auth.isAuthenticated(); // 返回 true 或 false
```

## 🛠️ 技术细节

### 加密方式
- 使用 **SHA-256** 算法加密密码
- 密码哈希值存储在 `localStorage`
- 永远不会存储明文密码

### 会话管理
- 登录后会话保存在 `sessionStorage`
- 会话有效期：**24小时**
- 关闭浏览器或标签页会清除会话
- 24小时后需要重新登录

### 数据存储位置

```javascript
// localStorage（持久化）
'auth_password_hash'  // 密码的SHA-256哈希值

// sessionStorage（会话级）
'auth_session'        // 登录会话信息
```

### Auth类API

```javascript
const auth = new Auth();

// 密码验证
await auth.verifyPassword(password)      // 验证密码是否正确

// 登录/登出
await auth.login(password)               // 登录
auth.logout()                            // 登出
auth.isAuthenticated()                   // 检查是否已登录

// 密码管理
await auth.changePassword(oldPass, newPass)  // 修改密码
await auth.resetPassword()                   // 重置为默认密码

// 页面保护
await auth.showLoginDialog(message)      // 显示登录对话框
await auth.protectPage()                 // 保护整个页面
```

## 📝 使用场景示例

### 场景1：博客管理
```
1. 访问 blog-admin.html
2. 自动弹出登录框
3. 输入密码登录
4. 可以上传、编辑、删除文章
5. 24小时内再次访问无需登录
```

### 场景2：添加想法
```
1. 访问 ideas.html（任何人都能看）
2. 未登录状态下，看不到"添加想法"按钮
3. 如果点击某个编辑按钮（需要登录才能看到），会提示登录
4. 登录后可以添加、编辑想法
```

### 场景3：管理TODO
```
1. 访问 dashboard.html（任何人都能看）
2. 未登录状态下，看不到"添加任务"表单
3. TODO项的复选框显示但禁用状态
4. 点击任何操作时提示登录
5. 登录后可以完整管理TODO列表
```

## ⚠️ 安全提示

### ✅ 这套系统适用于：
- 个人网站内容管理
- 轻量级权限控制
- GitHub Pages静态网站
- 不涉及敏感数据的场景

### ⚠️ 局限性：
1. **前端验证**：所有代码在客户端运行，技术能力强的用户可以绕过
2. **LocalStorage可见**：任何人都可以查看浏览器存储的数据
3. **无后端支持**：无法实现真正的服务器端验证
4. **适合场景**：适合个人网站，防止普通访客误操作

### 🔒 如何提高安全性：
1. **立即修改默认密码**
2. **使用强密码**（至少12位，包含字母数字符号）
3. **不要在密码中使用个人信息**
4. **定期更换密码**
5. **不要在公共设备上登录**
6. **如果需要真正的安全性，请使用后端服务**

## 🚀 部署到GitHub Pages

### 步骤1：上传代码
```bash
git add .
git commit -m "添加权限保护系统"
git push origin main
```

### 步骤2：启用GitHub Pages
1. 进入仓库 Settings
2. 找到 Pages 选项
3. Source 选择 main 分支
4. 保存

### 步骤3：修改密码
1. 访问你的网站
2. 打开开发者工具
3. 执行 `await auth.changePassword('admin123', '你的新密码')`

### 步骤4：测试
1. 在隐私浏览模式下访问网站
2. 尝试访问管理页面
3. 验证是否需要密码
4. 测试所有编辑功能

## 🐛 常见问题

### Q1：忘记密码怎么办？
A：在浏览器控制台执行 `await auth.resetPassword()`

### Q2：登录后还是无法编辑？
A：检查会话是否过期，尝试刷新页面重新登录

### Q3：如何让其他人也能编辑？
A：分享密码给他们，或者修改代码移除权限保护

### Q4：如何查看当前密码的哈希值？
A：在控制台执行：
```javascript
localStorage.getItem('auth_password_hash');
```

### Q5：如何完全移除权限系统？
A：
1. 删除所有页面中的 `<script src="js/auth.js"></script>`
2. 删除 `auth.protectPage()` 调用
3. 删除 `checkAuth()` 和 `requireAuth()` 相关代码

## 📞 支持

如有问题，请：
1. 查看浏览器控制台的错误信息
2. 检查 `js/auth.js` 是否正确加载
3. 确认localStorage和sessionStorage功能正常
4. 参考 `CHANGELOG.md` 中的更新说明

---

**版本**：v1.4.0  
**更新日期**：2025-10-30
