# Quill (OpenRepo)

<div align="center">

<br />

**现代化全栈个人博客与技术资讯追踪系统**
*A Modern Full-Stack Personal Blog, Project Portfolio & Tech Intelligence Platform*

<br />

[![React](https://img.shields.io/badge/React-19.x-61dafb.svg?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000.svg?style=flat-square&logo=express)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3.x-003B57.svg?style=flat-square&logo=sqlite)](https://www.sqlite.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

<br />

</div>

---

## 📖 简介 / Introduction

**Quill** 是一个为开发者量身打造的**现代化全栈个人知识库、项目作品集与技术资讯聚合平台**。前端采用 React 19 + Vite 构建极简雅致的现代排版与丝滑动效，后端基于 Node.js Express 与 SQLite 提供轻量高效的 API 支撑。

系统不仅包含完整的博文发布、标签归档与项目看板管理，还内嵌了**每日 AI / 计算机前沿资讯流**与 **GitHub 热门开源项目（双周期：本周热门 & 今日飙升）追踪系统**。

---

## ✨ 核心特性 / Features

### 📝 1. 沉浸式博客与阅读体验
- **Markdown 完整解析**：支持代码高亮、多级标题、引用块与列表渲染。
- **毛玻璃动态吸顶栏**：滚动时「文章精选」头部平滑过渡为毛玻璃（`backdrop-filter: blur(12px)`）与悬浮立体阴影。
- **瀑布流丝滑动效**：基于 `IntersectionObserver` 实现文章卡片滚动渐进丝滑浮现动效（`cubic-bezier(0.16, 1, 0.3, 1)`）。
- **多维标签与归档索引**：按标签、发布时间（年/月/日）进行精准归档与即时过滤。
- **浮动一键回顶**：向下滚动时右下角自动浮现圆环回顶按钮，支持平滑回滚。

### 🌐 2. 技术资讯与 GitHub 趋势聚合
- **双周期 GitHub Trending**：支持按 **Weekly（本周热门）** 与 **Daily（今日飙升）** 维度探索全球流行仓库。
- **多语言过滤**：可按 JavaScript、TypeScript、Python、Rust、Go 等主流语言一键筛选。
- **前沿 AI & 计算机资讯**：聚合当日大模型、系统架构与开源动态资讯卡片。
- **极速热点摘要**：资讯概览数据智能解析与多维统计。

### 📊 3. 项目作品集与管理看板
- **多视图切换**：支持**卡片网格（Grid）**与**泳道看板（Kanban Board）**双重视图无缝切换。
- **状态工作流**：支持「规划中（Planning）」、「进行中（In Progress）」、「已完成（Completed）」全生命周期流转。
- **富媒体详情**：关联仓库链接、在线演示地址、技术栈标签与长篇项目文档。

### 🎨 4. 极致的双栏视口与侧边栏设计
- **绝对静止 + 独立滚动双栏**：左侧文章流独立滚动，右侧栏主体在文章滑到底部时 100% 绝对静止（0 像素位移）。
- **右侧双卡片独立内嵌滑动**：「GitHub 热点」与「社区博客」两板块均分高度，各自拥有专属轻量内滚动条。
- **左侧边栏内嵌搜索**：搜索图标与折叠按钮优雅并排，支持一键呼出/收起内嵌搜索框并实时检索。
- **自适应响应式**：桌面端提供精细多栏流式体验，移动端自动无缝降级为自然滚动排版。

### 🔒 5. 安全与用户系统
- **JWT 身份凭证**：安全的状态存储与令牌认证机制。
- **图形验证码防刷**：登录与注册流程集成动态矢量 SVG 验证码保护。
- **个人资料与安全中心**：单屏完整展示个人资料、密码重置与安全设置，无需多余页面滚动。
- **优雅的弹窗提示**：全站表单校验与错误反馈采用纯矢量线框 `AlertModal` 对话框，避免破坏页面布局。

---

## 🛠️ 技术栈 / Tech Stack

| 领域 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **前端框架** | React 19 + React Router v7 | 现代化组件开发与客户端单页路由 |
| **构建工具** | Vite 8 + Oxlint | 秒级冷启动与极速热更新 |
| **样式体系** | Pure CSS (CSS Grid / Flexbox / Custom Variables) | 零重型 UI 库依赖，极致性能与自研设计系统 |
| **后端框架** | Node.js + Express 4 | 现代化 RESTful API 架构 |
| **数据库** | SQLite 3 (`better-sqlite3`) | 轻量、免运维且高性能的嵌入式数据库 |
| **安全与认证** | `jsonwebtoken` + `bcryptjs` + `svg-captcha` | 密码哈希、JWT 鉴权与图形验证码 |

---

## 📁 目录结构 / Project Structure

```text
openrepo/
├── client/                     # 前端应用工程 (Vite + React)
│   ├── src/
│   │   ├── api/                # API 客户端与数据获取 (articles, projects, news, auth, external)
│   │   ├── components/         # 公共组件 (Siderail, AlertModal, ConfirmModal, GithubHot, etc.)
│   │   ├── pages/              # 页面视图 (Home, ArticleList, ArticleDetail, NewsPage, ProjectsPage, ProfilePage)
│   │   ├── utils/              # 工具函数 (auth, date formatting)
│   │   ├── App.jsx             # 路由配置与应用主外壳
│   │   └── index.css           # 核心设计系统与响应式样式表
│   ├── package.json
│   └── vite.config.js
├── server/                     # 后端 API 服务工程 (Express + SQLite)
│   ├── src/
│   │   ├── routes/             # RESTful 路由 (articles, projects, news, auth)
│   │   ├── app.js              # Express 实例与中间件装配
│   │   ├── auth.js             # JWT 验证与管理员权限校验
│   │   ├── captcha.js          # SVG 验证码生成器
│   │   ├── db.js               # SQLite 数据表初始化与连接池
│   │   └── server.js           # 服务启动入口 (端口: 3001)
│   └── package.json
├── docs/                       # 架构与功能设计方案文档
│   ├── 001-project-detail-page.md
│   ├── 002-register-captcha-email.md
│   ├── 003-profile-page-redesign.md
│   ├── 004-project-management-redesign.md
│   └── 005-tech-news-intel-design.md
├── .gitignore
├── 个人博客系统_PRD.md           # 完整产品需求规格说明书
└── README.md
```

---

## 🚀 快速开始 / Quick Start

### 1. 环境准备
确保您的计算机上已安装 [Node.js](https://nodejs.org/) (建议版本 `>= 18.0.0`) 和 `npm`。

### 2. 克隆仓库
```bash
git clone https://github.com/blancmx/openrepo.git
cd openrepo
```

### 3. 安装依赖

**安装服务端依赖：**
```bash
cd server
npm install
```

**安装客户端依赖：**
```bash
cd ../client
npm install
```

### 4. 启动开发服务

**启动后端服务 (运行在 http://localhost:3001)：**
```bash
cd server
npm run dev
# 或 node --watch src/server.js
```

**在另一个终端启动前端服务 (运行在 http://localhost:5173)：**
```bash
cd client
npm run dev
```

打开浏览器访问 👉 **[http://localhost:5173/](http://localhost:5173/)** 即可体验。

---

## 🔑 默认管理员账号 / Default Credentials

初次启动时，系统会自动初始化 SQLite 数据库并播种示例数据。您可以使用预置的默认管理员账户进行登录：

- **账号 (Username)**：`admin`
- **密码 (Password)**：`admin123`

*登录后可在「个人中心」修改密码或绑定邮箱。*

---

## 🌐 核心 API 概览 / API Endpoints

| 模块 | 路由 | 方法 | 权限要求 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| **认证** | `/api/auth/captcha` | `GET` | 公开 | 获取图形验证码 SVG |
| **认证** | `/api/auth/login` | `POST` | 公开 | 账号密码 + 验证码登录 |
| **认证** | `/api/auth/register` | `POST` | 公开 | 新用户注册 |
| **文章** | `/api/articles` | `GET` | 公开 | 获取文章列表（支持关键词 `q` 与 `tag` 过滤） |
| **文章** | `/api/articles/:id` | `GET` | 公开 | 获取单篇文章详情与 Markdown 内容 |
| **文章** | `/api/articles` | `POST` | 管理员 | 发布新博文 |
| **资讯** | `/api/news/github-trending`| `GET` | 公开 | 获取 GitHub 趋势项目（参数 `since=daily/weekly`, `language`） |
| **资讯** | `/api/news/feed` | `GET` | 公开 | 获取每日精选 AI 与计算机技术资讯 |
| **资讯** | `/api/news/summary` | `GET` | 公开 | 获取全站资讯概览与多维统计 |
| **项目** | `/api/projects` | `GET` | 公开 | 获取项目作品集列表 |

---

## 📄 开源许可 / License

本项目基于 [MIT License](LICENSE) 许可协议开源。
