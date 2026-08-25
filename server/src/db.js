import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = process.env.DATA_DIR || path.join(__dirname, '../data')
fs.mkdirSync(dataDir, { recursive: true })

export const db = new DatabaseSync(path.join(dataDir, 'blog.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    tech_stack TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT '开发中',
    repo_url TEXT NOT NULL DEFAULT '',
    demo_url TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS project_milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT '待开始',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS project_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
`)

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = crypto.scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${derived}`
}

function verifyPassword(password, stored) {
  const [scheme, salt, derived] = String(stored).split(':')
  if (scheme !== 'scrypt' || !salt || !derived) return false
  const candidate = crypto.scryptSync(password, salt, 64)
  const expected = Buffer.from(derived, 'hex')
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected)
}

function addColumnIfMissing(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all()
  if (!columns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

addColumnIfMissing('articles', 'tags', "TEXT NOT NULL DEFAULT ''")
addColumnIfMissing('users', 'role', "TEXT NOT NULL DEFAULT 'user'")
addColumnIfMissing('users', 'email', "TEXT NOT NULL DEFAULT ''")
addColumnIfMissing('users', 'bio', "TEXT NOT NULL DEFAULT ''")
addColumnIfMissing('users', 'created_at', "TEXT NOT NULL DEFAULT ''")
addColumnIfMissing('projects', 'progress', 'INTEGER NOT NULL DEFAULT 0')
addColumnIfMissing('projects', 'notes', "TEXT NOT NULL DEFAULT ''")

// 回填 users created_at 为当前时间
db.exec(
  "UPDATE users SET created_at = datetime('now', 'localtime') WHERE created_at = ''"
)

// 回填：旧库中"已完成"的项目此前无 progress 字段，进度补为 100（幂等）
db.exec(
  "UPDATE projects SET progress = 100 WHERE status = '已完成' AND progress = 0"
)

const adminCount = db
  .prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'")
  .get().count
if (adminCount === 0) {
  const updated = db
    .prepare("UPDATE users SET role = 'admin' WHERE id = (SELECT MIN(id) FROM users)")
    .run()
  if (updated.changes > 0) {
    console.log('已将最早注册的用户提升为博主（admin）')
  }
}

const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count
if (userCount === 0) {
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
  db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')").run(
    username,
    hashPassword(password)
  )
  console.log(`已创建博主账号: ${username} / ${password}（请尽快修改）`)
}

const projectCount = db.prepare('SELECT COUNT(*) AS count FROM projects').get().count
if (projectCount === 0) {
  db.prepare(
    "INSERT INTO projects (name, description, tech_stack, status, progress) VALUES (?, ?, ?, ?, ?)"
  ).run(
    'Quill — 个人博客系统',
    'React + Express + SQLite 的全栈博客，支持 Markdown 写作、标签筛选与关键词搜索。',
    'React,Express,SQLite,JWT',
    '已完成',
    100
  )
  console.log('已创建示例项目: Quill')
}

export function findUserByCredentials(username, password) {
  const row = db
    .prepare('SELECT id, username, role, password_hash FROM users WHERE username = ?')
    .get(username)
  if (!row || !verifyPassword(password, row.password_hash)) {
    return null
  }
  return row
}

export function createUser(username, password, email = '') {
  const result = db
    .prepare("INSERT INTO users (username, password_hash, role, email) VALUES (?, ?, 'user', ?)")
    .run(username, hashPassword(password), email)
  return db
    .prepare('SELECT id, username, role, email, bio, created_at FROM users WHERE id = ?')
    .get(result.lastInsertRowid)
}

export function usernameExists(username) {
  return Boolean(db.prepare('SELECT id FROM users WHERE username = ?').get(username))
}

export function getUserById(id) {
  return db
    .prepare('SELECT id, username, role, email, bio, created_at FROM users WHERE id = ?')
    .get(id)
}

export function updateUserProfile(id, { email, bio }) {
  db.prepare('UPDATE users SET email = ?, bio = ? WHERE id = ?').run(
    email ?? '',
    bio ?? '',
    id
  )
  return getUserById(id)
}

export function updateUserPassword(id, oldPassword, newPassword) {
  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(id)
  if (!row || !verifyPassword(oldPassword, row.password_hash)) {
    return { success: false, error: '原密码不正确' }
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
    hashPassword(newPassword),
    id
  )
  return { success: true }
}

export function getUserStats() {
  const articleCount = db.prepare('SELECT COUNT(*) AS count FROM articles').get().count
  const projectCount = db.prepare('SELECT COUNT(*) AS count FROM projects').get().count
  const completedProjectCount = db
    .prepare("SELECT COUNT(*) AS count FROM projects WHERE status = '已完成'")
    .get().count

  const articleRows = db.prepare('SELECT content, tags FROM articles').all()
  let wordCount = 0
  const tagsSet = new Set()
  for (const a of articleRows) {
    if (a.content) wordCount += a.content.length
    if (a.tags) {
      a.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((t) => tagsSet.add(t))
    }
  }

  const recentArticles = db
    .prepare('SELECT id, title, created_at, tags FROM articles ORDER BY id DESC LIMIT 5')
    .all()
  const recentProjects = db
    .prepare('SELECT id, name, status, progress, updated_at FROM projects ORDER BY id DESC LIMIT 5')
    .all()

  return {
    articleCount,
    wordCount,
    projectCount,
    completedProjectCount,
    tagCount: tagsSet.size,
    recentArticles,
    recentProjects,
  }
}

export default db
