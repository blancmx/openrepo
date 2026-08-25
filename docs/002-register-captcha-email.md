# 设计文档 — 注册验证码与邮箱字段

> 编号：`DESIGN-002`
> 标题：注册界面防人机验证（图形验证码）+ 可选邮箱
> 版本：v1.0（草稿）
> 日期：2026-08-23
> 状态：待评审

## 1. 背景

注册接口 `POST /api/auth/register` 目前仅需用户名 + 密码，无任何防人机手段，可直接被脚本批量注册。用户希望在**注册界面**加入图形验证码用于防机器人，并顺带补充一个**可选**的邮箱字段。

登录接口本次**不改**（用户仅要求注册界面）。

## 2. 目标与范围

### 2.1 目标
- 注册必须通过**图形验证码**校验才可创建账号。
- 注册时可**可选**填写邮箱（格式校验，可为空）。

### 2.2 范围
- **在内**：`GET /api/auth/captcha` 验证码接口、注册时服务端校验验证码、users 表新增 `email` 列、注册表单新增验证码 UI 与邮箱输入框。
- **不在内**：登录接口加验证码、邮箱验证/找回、邮件发送、第三方验证码服务、滑动/点击式验证码。

### 2.3 非目标
- 不做图形码以外的更复杂人机校验（如行为验证）。
- 不接入短信/邮件发送通道。

## 3. 现状分析

### 3.1 用户表（db.js）
```
users(id, username UNIQUE, password_hash, role)
```

### 3.2 认证接口（server/src/routes/auth.js）
| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| POST | `/api/auth/register` | 注册（仅 username/password） | 公开 |
| POST | `/api/auth/login` | 登录 | 公开 |

注册仅校验用户名长度 2-20、密码 ≥6、用户名唯一。

## 4. 功能需求

### 4.1 图形验证码
- `GET /api/auth/captcha` → `{ captchaId, svg }`。
- 服务端生成随机码（4 位，去除易混字符 `0/O/1/I/l`），绘制为 **SVG**（含旋转、噪声线），以字符串返回。
- 服务端以 `captchaId` 为键**内存存储**码值与过期时间（5 分钟），单人使用（校验后即作废）。
- 前端在注册表单内渲染该 SVG，提供「刷新」按钮重新取码。
- 注册请求须携带 `captchaId` + `captcha`（用户输入文字），服务端校验。

### 4.2 可选邮箱
- 注册表单新增「邮箱（可选）」输入框。
- 提交时若填写则校验格式（`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`），为空则存 `''`。
- `users` 表新增 `email TEXT NOT NULL DEFAULT ''`（幂等迁移，兼容旧库）。

### 4.3 权限与现有流程不变
- 验证码接口公开；注册仍公开；登录不变。
- 用户名唯一约束、密码规则不变。

## 5. 数据模型设计

```sql
-- 幂等迁移：旧库无 email 列时补列（默认空串）
ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT '';
```

`createUser(username, password, email = '')` 插入时写入 email。

## 6. 接口设计

### 6.1 新增验证码
| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| GET | `/api/auth/captcha` | 返回 `{ captchaId, svg }` | 公开 |

- 存内存：`Map<captchaId, { code, exp }>`。`exp = now + 5min`。
- 生成时顺带清理已过期条目，避免无限增长。

### 6.2 修改注册
| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| POST | `/api/auth/register` | 注册；新增必填 `captchaId`/`captcha`、可选 `email` | 公开 |

校验顺序（保证验证码只在最终有效的那次被消耗）：
1. 解析入参。
2. `validateRegisterInput(username, password, email)`（用户名/密码/邮箱格式）→ 400。
3. `usernameExists(username)` → 409。
4. `verifyCaptcha(captchaId, captcha)`（校验并**单次消耗**）→ 400 `验证码错误`。
5. `createUser(username, password, email)` → 201。

约束：
- `captcha` 服务端比对**忽略大小写**。
- 校验通过后立即删除该 `captchaId` 条目（防重放）。

## 7. 前端设计

### 7.1 api 层（client/src/api/articles.js）
```js
export function getCaptcha() {
  return request('/api/auth/captcha')
}
export function register(username, password, email, captchaId, captcha) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, email, captchaId, captcha }),
  })
}
```

### 7.2 注册界面（client/src/pages/LoginPage.jsx）
- 仅在 `mode === 'register'` 时展示：
  - **邮箱（可选）** 输入框 —— 位于密码与确认密码之后。
  - **验证码**区：SVG 图（`dangerouslySetInnerHTML` 渲染服务端返回的 SVG）+ 输入框 + 「刷新」按钮。
- 进入注册模式时拉取一次验证码；「刷新」重新拉取并清空已填码。
- 提交注册时携带 `captchaId` + `captcha`；若返回「验证码错误」，自动刷新验证码并提示。
- 用户名/密码/确认密码现状字段与校验保持不变。

### 7.3 样式（client/src/index.css）
- `.captcha-row`（SVG 图 + 输入框 + 刷新）水平布局。
- 邮箱复用 `.field`；验证码输入框复用 `.field input`。
- 刷新按钮复用 `.link-btn`。

## 8. 关键交互细节

- 验证码每次刷新为**新的 `captchaId`**，旧的随之作废。
- 单次使用：无论校验成功与否，只要提交了用户名密码格式正确的注册请求，验证码即被消耗；失败需重新刷新。
- 服务缺失/超时：验证码 `captchaId` 不存在或过期 → 400 `验证码已失效，请刷新后重试`。

## 9. 实施计划（里程碑）

| 阶段 | 内容 | 依赖 |
|---|---|---|
| M1 数据层 | users.email 迁移 + createUser 支持 email | — |
| M2 验证码模块 | `server/src/captcha.js`（生成 + 校验 + 清理） | — |
| M3 接口层 | `GET /captcha` + register 改造 | M1, M2 |
| M4 前端 api | `getCaptcha` + register 新签名 | M3 |
| M5 前端界面 | 邮箱 + 验证码 UI | M4 |
| M6 样式/联调 | CSS、错误提示、构建 + lint、重启验证 | M1–M5 |

## 10. 边界与异常

- 验证码错误 → 400 `验证码错误`；前端自动刷新验证码。
- 验证码已过期/不存在 → 400 `验证码已失效，请刷新后重试`。
- 邮箱格式错误 → 400 `邮箱格式不正确`。
- 邮箱可选，留空则存 `''`，不参与唯一约束（允许多用户无邮箱）。
- 服务重启后内存验证码丢失 → 旧 `captchaId` 失效，属预期。

## 11. 风险与开放问题

1. **内存存储**：单进程 dev 环境足够；若未来多实例/生产，需改为 Redis 或 DB 存储。
2. **SVG 防爬强度**：本方案为轻量图形码，足以阻挡简单脚本；高强度攻击需换第三方验证码（另开设计文档）。
3. **验证码是否全局**：本期仅注册接入；登录已被账号体系 + JWT 覆盖，未要求。
4. **邮箱用途**：本期仅收集展示位，不触发邮箱验证/找回（后续可另开文档）。

## 12. 评审点

- [ ] 验证码接口返回 SVG 字符串，前端 `dangerouslySetInnerHTML` 渲染 —— 是否可接受（来源为本服务、内容为随机字符）。
- [ ] 邮箱为可选字段，注册成功后是否在响应中返回 `email`。
- [ ] 验证码仅注册接入（登录不加）是否符合预期。

---

## 附：设计文档编号规范（见 DESIGN-001 附录）

> 本期编号沿用 `DESIGN-002`，文件 `docs/002-register-captcha-email.md`。
