# CSS Grid布局完全指南

现代Web开发中，布局是最重要的技能之一。CSS Grid为我们提供了一个强大的二维布局系统，让复杂的布局变得简单直观。

## 什么是CSS Grid？

CSS Grid是一个基于网格的布局系统，它允许我们在二维空间中（行和列）排列元素。与Flexbox不同，Grid可以同时控制行和列，使其成为构建整个页面布局的理想选择。

## 基础概念

### Grid容器和Grid项目

要使用Grid布局，首先需要定义一个Grid容器：

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 20px;
}
```

### 定义列和行

使用 `grid-template-columns` 和 `grid-template-rows` 定义网格结构：

```css
.grid-container {
  display: grid;
  grid-template-columns: 200px 1fr 2fr;
  grid-template-rows: 100px auto;
}
```

## 实用技巧

### 1. 响应式网格

使用 `auto-fit` 和 `minmax()` 创建自适应网格：

```css
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
```

### 2. 网格区域命名

使用 `grid-template-areas` 创建直观的布局：

```css
.layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "sidebar main main"
    "footer footer footer";
}
```

### 3. Grid间隙

使用 `gap` 属性设置网格间距：

```css
.grid {
  gap: 20px; /* 行和列间距都是20px */
  row-gap: 10px; /* 只设置行间距 */
  column-gap: 15px; /* 只设置列间距 */
}
```

## 高级特性

### 自动布局

Grid可以自动填充内容：

```css
.auto-grid {
  display: grid;
  grid-auto-flow: dense;
  grid-template-columns: repeat(auto-fill, 200px);
}
```

### 对齐和分布

精确控制内容的对齐方式：

```css
.grid-container {
  justify-items: center; /* 水平对齐 */
  align-items: center; /* 垂直对齐 */
  justify-content: space-between; /* 整体水平分布 */
}
```

## 浏览器支持

CSS Grid在现代浏览器中得到了广泛支持：

- Chrome 57+
- Firefox 52+
- Safari 10.1+
- Edge 16+

对于需要支持旧版浏览器的项目，可以使用 `@supports` 进行渐进增强。

## 总结

CSS Grid是现代Web布局的强大工具。通过掌握其核心概念和实用技巧，我们可以更高效地创建复杂的响应式布局。

**关键要点：**

- Grid适合二维布局（行+列）
- 使用 `fr` 单位创建灵活的网格
- `auto-fit` 和 `minmax()` 实现响应式设计
- 命名网格区域提高代码可读性

建议在实际项目中多加练习，逐步掌握Grid的各种特性。同时，Grid和Flexbox并不是互斥的，它们可以完美配合使用 - Grid用于整体布局，Flexbox用于组件内部布局。
