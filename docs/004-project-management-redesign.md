# 设计文档 — 个人项目管理页面重构

> 编号：`DESIGN-004`
> 标题：个人项目管理（Projects）页面重构：看板/网格双视图 · 状态与技术栈筛选 · 指标概览
> 版本：v1.0（待评审）
> 日期：2026-08-24
> 状态：待评审

## 1. 背景

当前「个人项目管理」页面（`ProjectsPage.jsx` 与 `ProjectBoard.jsx`）仅采用单一的纵向列表展示项目卡片，缺乏：
1. **全局项目指标概览**：无法直观掌握开发中、已完成、搁置项目的整体分布与平均进度。
2. **多视图切换能力**：缺少符合项目管理直觉的**分状态看板（Kanban Board）**与**精美卡片网格（Grid View）**。
3. **检索与筛选工具**：缺乏关键词搜索、状态过滤、技术栈 Tag 过滤与排序功能。
4. **视觉与交互质感**：卡片排版较为拥挤，管理操作入口不够精致。

为了让个人项目展示更有作品集（Portfolio）的专业质感，并提升博主管理项目的效率，现对项目管理页面进行全面重构。

---

## 2. 目标与范围

### 2.1 目标
- **项目指标概览（Overview Stats）**：在页面顶部展示项目总数、开发中、已完成、搁置数量及整体平均完成度。
- **双视图切换（Dual Views）**：
  - **网格视图（Grid View）**：现代化卡片矩阵，突出项目描述、技术栈 Chip、进度条及仓库/演示外链。
  - **看板视图（Kanban View）**：按「开发中」、「已完成」、「搁置」三栏泳道分组展示项目卡片。
- **多维检索与过滤（Search & Filter Bar）**：
  - 实时关键词搜索（项目名称、描述）。
  - 状态快捷 Filter（全部 / 开发中 / 已完成 / 搁置）。
  - 技术栈 Filter（自动聚合项目中出现的所有技术标签）。
  - 排序选择（按最近更新、创建时间、进度高低）。
- **博主管理与快捷入口**：
  - 博主（Admin）顶部一键「＋ 新建项目」；卡片悬浮/菜单提供快速编辑与删除（二次确认）。
- **卡片跳转**：点击卡片平滑进入已有的项目详情页（`/projects/:id`）。

### 2.2 范围
- **在内**：`ProjectsPage.jsx` / `ProjectBoard.jsx` 重构、顶部统计看板、网格/看板视图切换、搜索与筛选器、样式与响应式布局。
- **不在内**：拖拽修改项目状态（本期通过编辑或详情页修改状态，保持代码轻量健壮）、多成员协作权限。

---

## 3. 现状与接口分析

### 3.1 现有接口（`server/src/routes/projects.js`）
| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| GET | `/api/projects` | 获取项目列表（包含 id, name, description, tech_stack, status, progress, repo_url, demo_url, created_at, updated_at） | 公开 |
| POST | `/api/projects` | 创建新项目 | admin |
| PUT | `/api/projects/:id` | 修改项目基本信息 | admin |
| DELETE | `/api/projects/:id` | 删除项目 | admin |
| GET | `/api/projects/:id` | 项目详情（包含 milestones, updates） | 公开 |

> **评估**：现有 `GET /api/projects` 返回的字段已包含完整字段（含 `progress`、`tech_stack`、`status`），前端完全有足够的数据在客户端实现高效的指标计算、双视图渲染及即时响应的搜索与多维过滤，无需额外改动后端接口。

---

## 4. 功能与交互设计

### 4.1 页面结构分区（自上而下）

1. **页头与操作栏（Header & Action Bar）**：
   - 页面主标题「个人项目管理」与副标题「开源作品、实战项目与演进记录」。
   - 右侧：博主专属「＋ 新建项目」主按钮。

2. **项目指标概览条（Projects Metric Strip）**：
   - 4 个紧凑指标胶囊/卡片：
     - 📁 **全部项目**：`totalCount`
     - 🔨 **开发中**：`developingCount`
     - ✅ **已完成**：`completedCount`
     - ⏸️ **搁置中**：`pausedCount`
     - 📈 **平均进度**：`avgProgress` %

3. **工具栏（Search, Filters & View Switcher）**：
   - **左侧**：搜索框（实时匹配名称/描述）。
   - **中部**：状态过滤（全部 / 开发中 / 已完成 / 搁置）+ 技术栈下拉/标签过滤。
   - **右侧**：视图切换按钮组（`[ ⊞ 网格视图 ]` `[ ▥ 看板视图 ]`）+ 排序下拉（最新更新 / 最早创建 / 进度从高到低）。

4. **主内容展示区（Main Content View）**：
   - **网格视图（Grid Mode）**：
     - 响应式多列卡片网格（1-3 列）。
     - 每张卡片包含：项目名称、状态 Badge、简要描述、技术栈 Chips、进度条与百分比、外链（仓库/演示）及管理操作按钮。
   - **看板视图（Kanban Mode）**：
     - 三列泳道：「🔨 开发中」、「✅ 已完成」、「⏸️ 搁置」。
     - 每列列头展示列名与该状态的项目数量徽标。
     - 列内堆叠项目精简卡片，支持直接点击进入详情。

5. **空状态与异常处理（Empty & Error State）**：
   - 筛选无结果提示及一键「重置筛选」。
   - 无任何项目时引导博主「创建第一个项目」。

---

## 5. 前端组件拆分与实现细节

### 5.1 组件结构
- `client/src/pages/ProjectsPage.jsx`：项目管理主页面，负责接收 `auth` 鉴权状态。
- `client/src/components/ProjectBoard.jsx`：
  - 内部子模块：
    - `ProjectMetrics`：顶部统计指标。
    - `ProjectToolbar`：搜索、状态/技术栈过滤、排序与视图切换。
    - `ProjectGridView`：网格卡片矩阵渲染。
    - `ProjectKanbanView`：三栏泳道看板渲染。
    - `ProjectCard`：可复用的单项目卡片。

### 5.2 状态管理与计算
```js
// 过滤与排序派生逻辑
const filteredProjects = useMemo(() => {
  return projects.filter(p => {
    const matchKeyword = !keyword || p.name.toLowerCase().includes(keyword.toLowerCase()) || p.description.toLowerCase().includes(keyword.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    const matchTech = !techFilter || p.tech_stack.includes(techFilter)
    return matchKeyword && matchStatus && matchTech
  }).sort((a, b) => {
    if (sortBy === 'updated') return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
    if (sortBy === 'created') return new Date(b.created_at) - new Date(a.created_at)
    if (sortBy === 'progress_desc') return (b.progress || 0) - (a.progress || 0)
    if (sortBy === 'progress_asc') return (a.progress || 0) - (b.progress || 0)
    return 0
  })
}, [projects, keyword, statusFilter, techFilter, sortBy])
```

---

## 6. 实施计划

| 阶段 | 内容 | 产出 |
|---|---|---|
| M1 设计评审 | 输出详细设计文档与实施计划 | `docs/004-project-management-redesign.md` |
| M2 组件重构 | 重构 `ProjectBoard.jsx` 与相关子视图逻辑 | 支持指标、筛选、网格/看板双视图 |
| M3 样式与响应式 | 完善网格、看板泳道、进度条与工具栏 CSS | `client/src/index.css` |
| M4 验证与构建 | 测试增删改查、双视图切换、筛选排序与 Vite 构建 | 构建与交互验收 |

---

## 7. 评审点

- [ ] 采用客户端多维过滤与排序（响应速度极快，无需额外频繁请求后端）。
- [ ] 顶部指标概览采用紧凑型设计，兼顾数据信息与页面垂直空间。
- [ ] 默认视图设为网格视图（Grid View），用户可一键无缝切换至看板视图（Kanban View）。
