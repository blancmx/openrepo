# 设计文档 — 科技资讯与 GitHub 热门项目（Tech Intel & Trending）

> 编号：`DESIGN-005`  
> 标题：左侧栏新增「资讯」板块：每日 AI/计算机前沿动态 · GitHub 本周热门项目精选 · 科技快讯看板  
> 版本：v1.0  
> 日期：2026-08-25  
> 状态：待评审  

---

## 1. 需求背景与目标

### 1.1 背景
当前 Quill 个人空间已具备「技术博文发布」与「个人项目管理（看板/网格）」两大核心板块。为了进一步拓宽博主与读者的技术视野，将个人站点升级为一个兼具**内容创作、作品展示与前沿技术追踪**的极客中枢，需要在左侧导航栏拓展「**资讯**」板块。

### 1.2 目标
1. **聚合每日 AI 与计算机科技前沿资讯**：聚焦大模型（LLMs）、前沿人工智能算法、系统架构、前端/全栈生态与开发者工具，提供高信噪比的每日技术快讯与深度阅读索引。
2. **GitHub 热门开源项目精选（Trending Radar）**：实时追踪 GitHub 本周最具影响力与 Star 爆发力的开源仓库，支持语言过滤与技术栈探索。
3. **今日科技焦点与聚合指标（Daily Digest Strip）**：顶部呈现今日热点快报、聚合追踪数据与即时刷新能力。
4. **统一规范与响应式体验**：
   - 遵从纯矢量线条图标（SVG Line Icons）规范，严禁 Emoji。
   - 遵循全局容器标准（`width: 100%` 对齐 `.container`，两侧留白与首页 100% 同步）。
   - 适配桌面宽屏、平板与手机端。

---

## 2. 架构设计与数据流

### 2.1 整体架构

```
[ 用户端 Siderail 侧边栏 ]
         │
         ▼
[ 资讯页面 /news (NewsPage.jsx) ]
   ├── 顶部今日快讯概览条 (DailyDigestStrip)
   ├── 资讯分类与多维检索栏 (CategoryTabs & SearchBar)
   ├── AI 与计算机资讯流 (NewsFeedGrid)
   └── GitHub 本周热门雷达 (GithubTrendingGrid)
         │ (HTTP REST API)
         ▼
[ 后端代理与缓存服务 server/src/routes/news.js ]
   ├── 内存缓存层 (Memory Cache with 15min TTL)
   ├── 外部数据聚合器 (HackerNews / Dev.to / GitHub API / AI News Feeds)
   └── 高可用智能 Fallback 机制 (保障 API 限流或离线时 100% 可用)
```

---

## 3. 功能模块详细设计

### 3.1 侧边栏入口 ([Siderail.jsx](file:///e:/Aai/AllProject/openrepo/client/src/components/Siderail.jsx))
- 在「首页」与「项目」之间新增「**资讯**」导航项（路由：`/news`）。
- 图标采用专属纯矢量线条绘制的科技雷达/报纸图标 `IconNews`（`stroke: currentColor; stroke-width: 2; fill: none`）。
- 遵从侧边栏折叠态（76px 工具提示）与展开态（200px 标签）统一视觉规范。

### 3.2 资讯主页面（`NewsPage.jsx`）
页面由上至下由四个核心区域构成：

#### 区域 1：页面头部与今日快报（Hero & Daily Digest Strip）
- **标题区**：`前沿资讯 / Tech Radar`，副标题「追踪当日最新的 AI 与计算机前沿动态，洞察 GitHub 本周热门开源趋势」。
- **数据指标条**：
  - 今日追踪热讯（条数统计）
  - AI 与大模型聚焦（更新数与占比）
  - GitHub 热门开源仓库（收录数）
  - 最近更新时间 +「一键刷新」按钮

#### 区域 2：双模视图切换与筛选栏（View Tabs & Filter Bar）
- **主要板块切换 Tabs**：
  1. `🔥 前沿科技资讯 (Tech News Feed)`
  2. `⭐ GitHub 本周热门 (GitHub Trending)`
- **资讯筛选维度（当在资讯 Tab 时）**：
  - 分类胶囊：`全部` | `AI / 大模型` | `前端与 Web` | `系统与架构` | `开源与开发工具`
  - 关键词搜索框：实时过滤资讯标题与摘要
- **GitHub 热门筛选维度（当在 GitHub Tab 时）**：
  - 编程语言筛选：`全部语言` | `TypeScript / JS` | `Python / AI` | `Rust` | `Go` | `C++`
  - 时间周期切换：`今日飙升` | `本周热门 (默认)` | `本月精选`

#### 区域 3：AI 与计算机资讯列表（News Feed Matrix）
- 采用双列响应式卡片流：
  - **卡片头部**：分类 Tag（如 `AI / LLM`、`架构与系统`）+ 来源徽标（`HackerNews` / `Dev.to` / `arXiv` / `GitHub Blog` 等）+ 发布时间。
  - **卡片主体**：资讯标题（支持外链直达）+ 核心技术摘要。
  - **卡片底栏**：热度指标（点赞/讨论数）+「阅读原文 ↗」外链。

#### 区域 4：GitHub 热门开源雷达（GitHub Trending Matrix）
- 采用 3 列网格卡片矩阵：
  - **仓库全名与作者**（带 GitHub 纯线条图标）。
  - **项目深度简介**（多行省略文本）。
  - **主要语言徽标与颜色圆点**（如 TypeScript 蓝、Python 黄、Rust 橙、Go 青）。
  - **Star 统计**（总 Stars 与本周新增 Star 趋势标志）。
  - **一键直达 GitHub 仓库**。

---

## 4. 后端 API 接口设计

### 4.1 新增路由：`server/src/routes/news.js`

| 接口 | 方法 | 请求参数 | 说明 | 缓存 TTL |
|---|---|---|---|---|
| `/api/news/feed` | GET | `category` (可选), `q` (可选), `force` (可选) | 获取 AI 与计算机最新前沿资讯列表 | 15 分钟 |
| `/api/news/github-trending` | GET | `language` (可选), `since` (可选), `force` (可选) | 获取 GitHub 本周热门项目列表 | 15 分钟 |
| `/api/news/summary` | GET | - | 获取今日资讯统计与热点概要 | 15 分钟 |

### 4.2 缓存与高可用容灾
- **双层缓存**：后端内存缓存（15 分钟）+ 前端客户端内存缓存，避免频繁跨域请求。
- **高可用 Fallback 机制**：后端内置结构化、高质量的最新 AI 与开源热点资讯种子库，在网络请求受阻或 GitHub API 达到访问频率上限时自动优雅降级，确保 100% 页面可用率。

---

## 5. 样式与布局规范

1. **容器流式对齐**：
   ```css
   .news-container {
     width: 100%;
     padding-bottom: 56px;
   }
   ```
   完美继承全局 `.container`，与首页及项目页两侧留白 100% 对齐。

2. **纯线条图标规范**：
   - 严禁使用任何 Emoji。
   - 新增 `IconNews`（新闻报纸/雷达线条图标）、`IconStar`（纯线条收藏星标）、`IconSparkles`（AI 智能星光线条）。

---

## 6. 实施计划

1. **后端实现**：创建 `server/src/routes/news.js`，注册至 `server/src/app.js`。
2. **矢量图标库扩展**：在 `client/src/components/Icons.jsx` 中添加 `IconNews`、`IconStar`、`IconSparkles`。
3. **API 客户端层**：创建 `client/src/api/news.js`。
4. **前端页面与组件实现**：
   - 创建 `client/src/pages/NewsPage.jsx`（包含资讯流与 GitHub 热门双视图）。
   - 更新 `client/src/components/Siderail.jsx`（新增资讯导航项）。
   - 更新 `client/src/App.jsx`（配置 `/news` 路由）。
5. **样式定义**：在 `client/src/index.css` 中添加 `.news-container`、`.news-hero`、`.news-tabs`、`.news-grid`、`.trending-card` 样式。
6. **自动化构建与验证**：运行 `npm run build` 和代码规范检测。
