import express from 'express'
import db from '../db.js'
import { requireAdmin } from '../auth.js'

const router = express.Router()
const STATUSES = ['开发中', '已完成', '搁置']
const MILESTONE_STATUSES = ['待开始', '进行中', '已完成']
const NAME_MAX = 60
const DESC_MAX = 500
const TECH_MAX = 6
const MILESTONE_TITLE_MAX = 60
const MILESTONE_DESC_MAX = 500
const UPDATE_MAX = 500

function normalizeTechStack(input) {
  if (Array.isArray(input)) {
    input = input.join(',')
  }
  if (typeof input !== 'string') {
    return { error: '技术栈格式不正确' }
  }
  const items = [
    ...new Set(
      input
        .split(/[,，\s]+/)
        .map((t) => t.trim())
        .filter(Boolean)
    ),
  ]
  if (items.length > TECH_MAX) {
    return { error: `技术栈最多 ${TECH_MAX} 项` }
  }
  for (const item of items) {
    if (item.length > 30) {
      return { error: '技术栈单项不能超过 30 字' }
    }
  }
  return { items }
}

function toProjectJson(row) {
  const { tech_stack, ...rest } = row
  return {
    ...rest,
    tech_stack: tech_stack ? tech_stack.split(',').filter(Boolean) : [],
  }
}

function validateMilestone(body) {
  const errors = []
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const status = typeof body.status === 'string' ? body.status.trim() : '待开始'
  const sort_order = Number.isInteger(body.sort_order) ? body.sort_order : 0
  if (!title) errors.push('里程碑标题不能为空')
  if (title.length > MILESTONE_TITLE_MAX) errors.push(`里程碑标题不能超过 ${MILESTONE_TITLE_MAX} 字`)
  if (description.length > MILESTONE_DESC_MAX) errors.push(`里程碑描述不能超过 ${MILESTONE_DESC_MAX} 字`)
  if (!MILESTONE_STATUSES.includes(status)) {
    errors.push(`里程碑状态只能是：${MILESTONE_STATUSES.join(' / ')}`)
  }
  return { errors, values: { title, description, status, sort_order } }
}

// 进度由里程碑派生：已完成阶段 / 总阶段 × 100；项目状态为已完成时强制 100
function recomputeProjectProgress(projectId) {
  const total = db
    .prepare('SELECT COUNT(*) AS count FROM project_milestones WHERE project_id = ?')
    .get(projectId).count
  const done = db
    .prepare(
      "SELECT COUNT(*) AS count FROM project_milestones WHERE project_id = ? AND status = '已完成'"
    )
    .get(projectId).count
  const project = db.prepare('SELECT status FROM projects WHERE id = ?').get(projectId)
  let progress = total > 0 ? Math.round((done / total) * 100) : 0
  if (project?.status === '已完成') progress = 100
  db.prepare('UPDATE projects SET progress = ? WHERE id = ?').run(progress, projectId)
  return progress
}

function validateUrl(value, label) {
  if (!value) return ''
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
    return ''
  } catch {
    return `${label}必须是合法的 http/https 链接`
  }
}

function validateProject(body) {
  const errors = []
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const status = typeof body.status === 'string' ? body.status.trim() : ''
  const repo_url = typeof body.repo_url === 'string' ? body.repo_url.trim() : ''
  const demo_url = typeof body.demo_url === 'string' ? body.demo_url.trim() : ''

  if (!name) errors.push('项目名称不能为空')
  if (name.length > NAME_MAX) errors.push(`项目名称不能超过 ${NAME_MAX} 字`)
  if (description.length > DESC_MAX) errors.push(`项目描述不能超过 ${DESC_MAX} 字`)
  if (status && !STATUSES.includes(status)) errors.push(`状态只能是：${STATUSES.join(' / ')}`)

  const repoError = validateUrl(repo_url, '仓库地址')
  const demoError = validateUrl(demo_url, '演示地址')
  if (repoError) errors.push(repoError)
  if (demoError) errors.push(demoError)

  return {
    errors,
    values: {
      name,
      description,
      status: status || '开发中',
      repo_url,
      demo_url,
    },
  }
}

router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM projects ORDER BY created_at DESC, id DESC')
    .all()
  res.json(rows.map(toProjectJson))
})

router.post('/', requireAdmin, (req, res) => {
  const { errors, values } = validateProject(req.body || {})
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('；') })
  }
  const { items, error } = normalizeTechStack(req.body?.tech_stack ?? '')
  if (error) {
    return res.status(400).json({ error })
  }
  const result = db
    .prepare(
      'INSERT INTO projects (name, description, tech_stack, status, repo_url, demo_url) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(values.name, values.description, items.join(','), values.status, values.repo_url, values.demo_url)
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(toProjectJson(project))
})

router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.id)
  if (!existing) {
    return res.status(404).json({ error: '项目不存在' })
  }
  const { errors, values } = validateProject(req.body || {})
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('；') })
  }
  const { items, error } = normalizeTechStack(req.body?.tech_stack ?? '')
  if (error) {
    return res.status(400).json({ error })
  }
  db.prepare(
    "UPDATE projects SET name = ?, description = ?, tech_stack = ?, status = ?, repo_url = ?, demo_url = ?, updated_at = datetime('now', 'localtime') WHERE id = ?"
  ).run(
    values.name,
    values.description,
    items.join(','),
    values.status,
    values.repo_url,
    values.demo_url,
    req.params.id
  )
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  res.json(toProjectJson(project))
})

router.delete('/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id)
  if (result.changes === 0) {
    return res.status(404).json({ error: '项目不存在' })
  }
  res.json({ success: true })
})

// 项目详情：内联返回里程碑与动态日志
router.get('/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  if (!project) {
    return res.status(404).json({ error: '项目不存在' })
  }
  const milestones = db
    .prepare(
      'SELECT * FROM project_milestones WHERE project_id = ? ORDER BY sort_order ASC, id ASC'
    )
    .all(req.params.id)
  const updates = db
    .prepare(
      'SELECT * FROM project_updates WHERE project_id = ? ORDER BY created_at DESC, id DESC'
    )
    .all(req.params.id)
  res.json({ ...toProjectJson(project), milestones, updates })
})

// ---------- 里程碑（详细进度） ----------
router.post('/:id/milestones', requireAdmin, (req, res) => {
  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.id)
  if (!project) return res.status(404).json({ error: '项目不存在' })
  const { errors, values } = validateMilestone(req.body || {})
  if (errors.length > 0) return res.status(400).json({ error: errors.join('；') })
  const result = db
    .prepare(
      'INSERT INTO project_milestones (project_id, title, description, status, sort_order) VALUES (?, ?, ?, ?, ?)'
    )
    .run(project.id, values.title, values.description, values.status, values.sort_order)
  recomputeProjectProgress(project.id)
  const milestone = db.prepare('SELECT * FROM project_milestones WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(milestone)
})

router.put('/:id/milestones/:mid', requireAdmin, (req, res) => {
  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.id)
  if (!project) return res.status(404).json({ error: '项目不存在' })
  const existing = db
    .prepare('SELECT id FROM project_milestones WHERE id = ? AND project_id = ?')
    .get(req.params.mid, project.id)
  if (!existing) return res.status(404).json({ error: '里程碑不存在' })
  const { errors, values } = validateMilestone(req.body || {})
  if (errors.length > 0) return res.status(400).json({ error: errors.join('；') })
  db.prepare(
    "UPDATE project_milestones SET title = ?, description = ?, status = ?, sort_order = ?, updated_at = datetime('now', 'localtime') WHERE id = ?"
  ).run(values.title, values.description, values.status, values.sort_order, existing.id)
  recomputeProjectProgress(project.id)
  const milestone = db.prepare('SELECT * FROM project_milestones WHERE id = ?').get(existing.id)
  res.json(milestone)
})

router.delete('/:id/milestones/:mid', requireAdmin, (req, res) => {
  const result = db
    .prepare('DELETE FROM project_milestones WHERE id = ? AND project_id = ?')
    .run(req.params.mid, req.params.id)
  if (result.changes === 0) return res.status(404).json({ error: '里程碑不存在' })
  recomputeProjectProgress(req.params.id)
  res.json({ success: true })
})

// ---------- 动态日志 ----------
router.post('/:id/updates', requireAdmin, (req, res) => {
  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.id)
  if (!project) return res.status(404).json({ error: '项目不存在' })
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : ''
  if (!content) return res.status(400).json({ error: '动态内容不能为空' })
  if (content.length > UPDATE_MAX) return res.status(400).json({ error: `动态内容不能超过 ${UPDATE_MAX} 字` })
  const result = db
    .prepare('INSERT INTO project_updates (project_id, content) VALUES (?, ?)')
    .run(project.id, content)
  const update = db.prepare('SELECT * FROM project_updates WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(update)
})

router.delete('/:id/updates/:uid', requireAdmin, (req, res) => {
  const result = db
    .prepare('DELETE FROM project_updates WHERE id = ? AND project_id = ?')
    .run(req.params.uid, req.params.id)
  if (result.changes === 0) return res.status(404).json({ error: '动态不存在' })
  res.json({ success: true })
})

export default router
