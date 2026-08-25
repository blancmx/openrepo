import express from 'express'
import db from '../db.js'
import { requireAdmin } from '../auth.js'

const router = express.Router()
const TITLE_MAX = 100
const CONTENT_MAX = 50000
const SUMMARY_LENGTH = 100
const TAGS_MAX = 5

function getSummary(content) {
  return content.length > SUMMARY_LENGTH ? `${content.slice(0, SUMMARY_LENGTH)}...` : content
}

function normalizeTags(input) {
  if (Array.isArray(input)) {
    input = input.join(',')
  }
  if (typeof input !== 'string') {
    return { error: '标签格式不正确' }
  }
  const tags = [
    ...new Set(
      input
        .split(/[,，\s]+/)
        .map((t) => t.trim())
        .filter(Boolean)
    ),
  ]
  if (tags.length > TAGS_MAX) {
    return { error: `标签最多 ${TAGS_MAX} 个` }
  }
  for (const tag of tags) {
    if (tag.length > 20) {
      return { error: '单个标签不能超过 20 字' }
    }
  }
  return { tags }
}

function toArticleJson(row) {
  const { tags, ...rest } = row
  return {
    ...rest,
    tags: tags ? tags.split(',').filter(Boolean) : [],
  }
}

function validateArticle(body) {
  const errors = []
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const content = typeof body.content === 'string' ? body.content.trim() : ''

  if (!title) errors.push('标题不能为空')
  if (title.length > TITLE_MAX) errors.push(`标题不能超过 ${TITLE_MAX} 字`)
  if (!content) errors.push('正文不能为空')
  if (content.length > CONTENT_MAX) errors.push(`正文不能超过 ${CONTENT_MAX} 字`)

  return { errors, title, content }
}

router.get('/', (req, res) => {
  const { q, tag } = req.query
  let sql = "SELECT id, title, content, tags, created_at, updated_at FROM articles"
  const where = []
  const params = []

  if (q) {
    where.push('(title LIKE ? OR content LIKE ?)')
    params.push(`%${q}%`, `%${q}%`)
  }
  if (tag) {
    where.push("',' || tags || ',' LIKE ?")
    params.push(`%,${tag},%`)
  }
  if (where.length > 0) {
    sql += ' WHERE ' + where.join(' AND ')
  }
  sql += ' ORDER BY created_at DESC, id DESC'

  const rows = db.prepare(sql).all(...params)
  const articles = rows.map((row) => {
    const { content, ...rest } = row
    return { ...toArticleJson(rest), summary: getSummary(content) }
  })
  res.json(articles)
})

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)
  if (!row) {
    return res.status(404).json({ error: '文章不存在' })
  }
  res.json(toArticleJson(row))
})

router.post('/', requireAdmin, (req, res) => {
  const { errors, title, content } = validateArticle(req.body || {})
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('；') })
  }
  const { tags, error } = normalizeTags(req.body?.tags)
  if (error) {
    return res.status(400).json({ error })
  }
  const result = db
    .prepare("INSERT INTO articles (title, content, tags) VALUES (?, ?, ?)")
    .run(title, content, tags.join(','))
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(toArticleJson(article))
})

router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT id FROM articles WHERE id = ?').get(req.params.id)
  if (!existing) {
    return res.status(404).json({ error: '文章不存在' })
  }
  const { errors, title, content } = validateArticle(req.body || {})
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('；') })
  }
  const { tags, error } = normalizeTags(req.body?.tags)
  if (error) {
    return res.status(400).json({ error })
  }
  db.prepare(
    "UPDATE articles SET title = ?, content = ?, tags = ?, updated_at = datetime('now', 'localtime') WHERE id = ?"
  ).run(title, content, tags.join(','), req.params.id)
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)
  res.json(toArticleJson(article))
})

router.delete('/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id)
  if (result.changes === 0) {
    return res.status(404).json({ error: '文章不存在' })
  }
  res.json({ success: true })
})

export default router
