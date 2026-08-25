# 设计文档 — 个人中心重构与工作台扩展

> 编号：`DESIGN-003`
> 标题：个人中心（Profile）重构：博主工作台 · 个人资料管理 · 账号安全
> 版本：v1.0（已实现）
> 日期：2026-08-24
> 状态：已实现

## 1. 背景

原有个人中心页面（`ProfilePage.jsx`）仅展示用户名、角色标签以及写文章/添加项目按钮，信息量与功能极为有限。
为了提升系统的完整性、易用性与博主创作管理效率，现对个人中心进行全面重构，打造集「创作数据概览 + 个人资料管理 + 账号安全设置」于一体的用户中心。

## 2. 目标与范围

### 2.1 目标
- **数据概览（Dashboard）**：展示文章总数、项目总数、创作总字数、项目完成度等核心指标，并提供近期创作动态。
- **资料管理（Profile）**：支持查看及修改邮箱、个性签名（Bio），展示注册时间。
- **账号安全（Security）**：提供在线修改密码能力（验证原密码 + scrypt 哈希更新）。
- **角色差异化体验**：博主（Admin）展示创作数据统计与快捷工作台；读者（User）展示个人信息与阅读导航。

### 2.2 范围
- **在内**：`GET /api/auth/me`、`PUT /api/auth/profile`、`PUT /api/auth/password`、数据库字段迁移（`bio`、`created_at`）、前端 `ProfilePage.jsx` Tab 标签页与样式重构。
- **不在内**：第三方 OAuth 登录绑定、双因素认证（2FA）、头像图片上传存储（采用自适应矢量头像）。

## 3. 数据模型设计

### 3.1 users 表拓展
```sql
-- 个性签名 / 简介
ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT '';
-- 注册时间
ALTER TABLE users ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'));
```

## 4. 接口设计

所有接口均需 `Authorization: Bearer <token>` 鉴权（`requireAuth`）。

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|---|---|---|---|---|
| GET | `/api/auth/me` | 获取当前用户信息及统计指标 | 无 | `{ user: { id, username, role, email, bio, created_at }, stats: { articleCount, wordCount, projectCount, completedProjectCount, recentArticles, recentProjects } }` |
| PUT | `/api/auth/profile` | 更新个人资料 | `{ email, bio }` | `{ success: true, user: { ... } }` |
| PUT | `/api/auth/password` | 修改登录密码 | `{ oldPassword, newPassword }` | `{ success: true, message: '密码修改成功' }` |

## 5. 前端设计

### 5.1 页面结构 (`ProfilePage.jsx`)
- **顶部 Hero 区域**：自适应渐变头像、用户名、角色徽章、个性签名、注册时间与快捷退出按钮。
- **Tab 1 - 仪表盘 (Dashboard)**：
  - 数据卡片网格（文章数、创作字数、项目总数、项目完成率）。
  - 快捷操作栏（新建文章、添加项目、浏览主页、项目看板）。
  - 近期创作与项目更新列表。
- **Tab 2 - 个人资料 (Profile)**：
  - 邮箱与个性签名表单，支持实时提交保存。
- **Tab 3 - 账号安全 (Security)**：
  - 原密码、新密码、确认新密码表单，提交后更新密码。

### 5.2 接口层 (`client/src/api/auth.js`)
- `getProfile()`: 获取完整个人信息与统计数据。
- `updateProfile(payload)`: 更新邮箱和个性签名。
- `changePassword(payload)`: 修改密码。

## 6. 边界与异常

- 密码修改：原密码错误返回 400，新密码长度 < 6 返回 400。
- 邮箱格式错误返回 400。
- 未登录访问 `/profile` 自动重定向至 `/login`。
