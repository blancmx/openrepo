# 设计文档 — 项目详情页拓展

> 编号：`DESIGN-001`
> 标题：个人项目管理（Projects）详情页拓展：进度 · 详情 · 各方面
> 版本：v1.1（已实现）
> 日期：2026-08-23
> 状态：已实现

## 1. 背景

「个人项目管理」页面当前仅是一张**列表**：项目卡片展示名称、状态徽标、技术栈与仓库/演示链接，管理员可新增、编辑、删除。卡片不可点击进入详情。

用户希望**点击项目卡片进入详情页**，查看该项目的：
- **详细进度** — 项目走到哪一步、已完成哪些阶段
- **详情** — 完整的信息（描述、技术栈、链接、时间等）
- **各个方面** — 里程碑（阶段）、进度动态/日志等维度

## 2. 目标与范围

### 2.1 目标
新增一个项目详情页，围绕单个项目提供「概览 + 进度 + 动态」的一站式查看与（管理员）管理能力，并把列表卡片升级为可点击入口。

### 2.2 范围
- **在内**：详情页、进度（里程碑）管理、动态日志、项目卡片可点击、`GET /：id` 接口修复、数据模型拓展。
- **不在内**：项目成员的权限体系（保持 admin/user 双角色不变）、任务看板（Kanban）类复杂子实体、附件/图片上传。

### 2.3 非目标（本期不做，后续可评估）
- 多人为同一项目协作、审批流。
- 子任务到「下一级 Task」的分解。

## 3. 现状分析

### 3.1 现有数据模型（受限于 `projects` 单表）
```
projects(id, name, description, tech_stack, status, repo_url, demo_url, created_at, updated_at)
status ∈ { 开发中, 已完成, 搁置 }
```

### 3.2 现有接口（server/src/routes/projects.js）
| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| GET | `/api/projects` | 项目列表 | 公开 |
| POST | `/api/projects` | 新增项目 | admin |
| PUT | `/api/projects/:id` | 更新项目 | admin |
| DELETE | `/api/projects/:id` | 删除项目 | admin |

> **缺口**：前端 `api/projects.js` 已定义 `getProject(id) → GET /api/projects/:id`，但后端**从未实现 `GET /:id`**。当前编辑既有项目（`ProjectEditor` 依赖该调用）实际上会 404。这是本设计必须一并修复的既有缺陷。

### 3.3 现有前端
- 路由：`/projects`（列表）、`/projects/new`、`/projects/:id/edit`。**无 `/projects/:id` 详情路由**。
- 组件：`ProjectBoard.jsx`（列表）、`ProjectEditor.jsx`（表单）。

## 4. 功能需求

### 4.1 项目详情页 `/projects/:id`（核心）
页面分区（自上而下）：
1. **返回**：`← 返回列表`
2. **头部**：项目名称 + 状态徽标（复用现有 `status-badge`）
3. **进度概览**：进度条（百分比，由里程碑派生）+ 里程碑统计文字（如 `3/5 阶段完成`）
4. **详情区**：完整描述、技术栈 chips、仓库/演示外链、创建/更新时间
5. **里程碑区（详细进度）**：里程碑卡片列表，每项含标题、描述、状态徽标
6. **动态更新区（各方面/日志）**：按时间倒序的进度动态条目
7. **管理员操作区**：右上角「编辑」「删除」；各子区中部提供对应的增删改入口

### 4.2 列表卡片可点击
- 点击项目卡片主体 → 跳转 `/projects/:id`。
- 卡片内的「编辑」「删除」「仓库」「演示」等链接/按钮**不得**触发行跳转（`stopPropagation`）。

### 4.3 权限
- 读取（列表、详情）对所有人开放。
- 写入（项目增删改、里程碑增删改、动态增删）仅 admin。

## 5. 数据模型设计

### 5.1 projects 表（扩展现有）
在既有列基础上新增：
```sql
-- 整体进度百分比 0-100（见 5.4 派生规则，冗余存储用于无里程碑时的兜底/降级）
ALTER TABLE projects ADD COLUMN progress INTEGER NOT NULL DEFAULT 0;
-- 详细介绍 / README 内容（Markdown 渲染）
ALTER TABLE projects ADD COLUMN notes TEXT NOT NULL DEFAULT '';
```

### 5.2 新增：project_milestones（里程碑 / 阶段 —— 承载「详细进度」）
```sql
CREATE TABLE IF NOT EXISTS project_milestones (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER NOT NULL,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT '待开始',  -- 待开始 / 进行中 / 已完成
  sort_order  INTEGER NOT NULL DEFAULT 0,      -- 排序权重，越小越靠前
  created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
```
状态枚举：`待开始` / `进行中` / `已完成`。

### 5.3 新增：project_updates（动态 / 进度日志）
```sql
CREATE TABLE IF NOT EXISTS project_updates (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  content    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
```
动态属于**日志型**数据：只支持新增与删除（不做编辑），保证时间线语义。

### 5.4 进度派生规则（单一事实来源）
进度不从 `progress` 字段手工维护与里程碑双向同步，而是**由里程碑派生**，避免两处不一致：
```
已完成数 = 该项目 status='已完成' 的里程碑数量
总数     = 该项目全部里程碑数量

progress = 总数 > 0 ? round(已完成数 / 总数 * 100) : 0
项目自身 status == '已完成'  → 强制 progress = 100
```
> 说明：`progress` 字段仍冗余存储，仅用于：无里程碑但有状态的旧项目做降级展示；以及列表页快速绘制进度条而无需 join 里程碑。服务端在每次里程碑变更时统一重算并回写该字段。

## 6. 接口设计

所有写接口均走 `requireAdmin`；列表/详情读接口公开。

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| GET | `/api/projects/:id` | 项目详情，**内联**返回 `{ ...project, milestones:[], updates:[] }` | 公开（**修复既有缺口**） |
| POST | `/api/projects/:id/milestones` | 新增里程碑 | admin |
| PUT | `/api/projects/:id/milestones/:mid` | 更新里程碑（含状态→触发进度重算） | admin |
| DELETE | `/api/projects/:id/milestones/:mid` | 删除里程碑 | admin |
| POST | `/api/projects/:id/updates` | 新增动态 | admin |
| DELETE | `/api/projects/:id/updates/:uid` | 删除动态 | admin |

约束：
- 里程碑 `title` 必填（≤60 字），`description` ≤500 字，`status` 校验枚举。
- 动态 `content` 必填（≤500 字）。
- 删除里程碑/动态后，服务端重算 `projects.progress`。
- 所有嵌套资源均校验 `project_id` 存在，否则 404。

## 7. 前端设计

### 7.1 路由（client/src/App.jsx）
新增：
```jsx
<Route path="/projects/:id" element={<ProjectDetail auth={auth} />} />
```

### 7.2 新页面：client/src/pages/ProjectDetail.jsx
- 从 `useParams` 取 `id`，调用 `getProject(id)` 一次性加载详情。
- 结构：`返回 + 头部 + 进度概览 + 详情 + 里程碑 + 动态`。
- 用 `ReactMarkdown` 渲染 `notes`（有则显示，无则隐藏该区）。
- 管理员登录态下：每个里程碑卡片带「状态切换/编辑/删除」；动态区有输入框 + 发布；顶部有项目「编辑」「删除」。
- 删除项目后跳回 `/projects`。

### 7.3 组件调整：client/src/components/ProjectBoard.jsx
- 卡片主体改为可点击（`onClick={() => navigate('/projects/' + p.id)}`，卡片类名加 `cursor:pointer`）。
- 卡片内部的「编辑 / 删除 / 仓库 / 演示」交互处 `e.stopPropagation()` 阻止冒泡到卡片跳转。
- 列表卡片可展示派生进度条（轻量：使用服务端已回写的 `progress` 字段，无需额外请求）。

### 7.4 接口层：client/src/api/projects.js
新增：
```js
export function createMilestone(projectId, payload) {
  return request(`/api/projects/${projectId}/milestones`, { method: 'POST', body: JSON.stringify(payload) })
}
export function updateMilestone(projectId, mid, payload) {
  return request(`/api/projects/${projectId}/milestones/${mid}`, { method: 'PUT', body: JSON.stringify(payload) })
}
export function deleteMilestone(projectId, mid) {
  return request(`/api/projects/${projectId}/milestones/${mid}`, { method: 'DELETE' })
}
export function createUpdate(projectId, content) {
  return request(`/api/projects/${projectId}/updates`, { method: 'POST', body: JSON.stringify({ content }) })
}
export function deleteUpdate(projectId, uid) {
  return request(`/api/projects/${projectId}/updates/${uid}`, { method: 'DELETE' })
}
```

### 7.5 样式（client/src/index.css）
- 新增 `.project-detail`、`.progress-track / .progress-fill`、`.milestone-*`、`.update-*` 等。
- 复用现有 `.status-badge`、`.filter-chip`、`.markdown-body`、`.link-btn`。

## 8. 关键交互细节

- 进度条动画（宽度 `transition: width .2s`）。
- 里程碑 `sort_order` 用于拖拽/排序？本期**不做拖拽**，仅按 `sort_order, id` 排序即可（简单起见可选值输入）。
- 乐观更新（UI 先行 + 失败回滚）仅用于轻量操作（切换状态、删除动态）；新增类操作等待接口返回后刷新。
- 空态文案：无里程碑→「还没有里程碑」；无动态→「还没有动态记录」。

## 9. 实施计划（里程碑）

| 阶段 | 内容 | 依赖 |
|---|---|---|
| M1 数据层 | 建表 + 列迁移 + 进度派生函数 | — |
| M2 接口层 | `GET /：id`（修复）+ 里程碑/动态的 CRUD | M1 |
| M3 前端详情页 | `ProjectDetail.jsx` + 路由 + 接口层函数 | M2 |
| M4 列表可点击 | `ProjectBoard` 跳转 + 进度条 + 冒泡处理 | M3 |
| M5 样式与联调 | 样式、空态、边界校验、构建 + lint | M1–M4 |

## 10. 边界与异常

- 访问不存在项目 → `404 项目不存在`；前端显示错误态。
- 非 admin 尝试写操作 → `403`；前端隐藏入口。
- `notes` 缺失/为空 → 隐藏详情扩展区，不报错。
- 动态/里程碑删除后，进度条立即反映重算结果。

## 11. 风险与开放问题

1. **进度派生 vs 手工**：本设计采用"里程碑驱动进度"。若未来需要"无里程碑也能精确控百分比"，可退化为手工维护 `progress`（届时移除派生）。
2. **`notes` 是否用 Markdown**：暂定为 Markdown（复用博客渲染链路），若希望纯文本可简化。
3. **里程碑是否需要排序/拖拽**：本期按 `sort_order` 值排序，不做拖拽交互；如需要可另开设计文档。
4. **数据迁移**：现网库需执行 5.1 的 `ALTER`，5.2/5.3 用 `CREATE TABLE IF NOT EXISTS`，已存在的示例项目无里程碑，进度将显示 `0%`（除非状态为已完成 → `100%`）。

## 12. 评审点

- [x] 里程碑驱动的进度派生规则符合预期（已实现；项目状态为"已完成"时强制 100%）。
- [x] 详情页"仓库/演示"作为 chip 放在进度概览下方（默认方案）。
- [x] 动态日志支持新增 + 删除（时间线语义，不编辑）。

---

## 附：设计文档编号规范（本期起生效）

| 项 | 约定 |
|---|---|
| 存放位置 | 仓库根目录 `docs/` |
| 文件名 | `MMM-短横线标题.md`，数字前缀全局递增（如 `001-`、`002-`） |
| 文内编号 | `DESIGN-MMM`，与文件名数字一致 |
| 适用范围 | **每个大型拓展功能**（涉及新增页面、数据模型、接口或显著改动的功能）撰写前必须产出本类文档 |
| 小改动 | 单一修复、文案、样式微调等无需编号文档，可直接标注"无设计文档（小改动）" |

**后续任何大型功能开发，需先在此文档体系下新建对应编号的 `DESIGN-xxx` 文档，评审通过后再动工。**
