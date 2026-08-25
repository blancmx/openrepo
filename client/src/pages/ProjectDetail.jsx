import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import {
  getProject,
  deleteProject,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  createUpdate,
  deleteUpdate,
} from '../api/projects.js'
import { formatDateTime } from '../utils/date.js'
import ProjectEditModal from '../components/ProjectEditModal.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import {
  IconStatus,
  IconCalendar,
  IconRefresh,
  IconCode,
  IconExternal,
  IconEdit,
  IconTrash,
  IconFlag,
  IconFileText,
  IconClock,
  IconPlus,
} from '../components/Icons.jsx'

const PROJECT_STATUS_CLASS = {
  开发中: 'status-developing',
  已完成: 'status-done',
  搁置: 'status-paused',
}

const MILESTONE_STATUS = ['待开始', '进行中', '已完成']
const MILESTONE_STATUS_CLASS = {
  待开始: 'ms-pending',
  进行中: 'ms-doing',
  已完成: 'ms-done',
}

function MilestoneItem({ milestone, isAdmin, onSave, onRequestDelete }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(milestone.title)
  const [desc, setDesc] = useState(milestone.description)
  const [saving, setSaving] = useState(false)

  async function save(patch) {
    setSaving(true)
    try {
      await onSave({ ...milestone, ...patch, title, description: desc })
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(e) {
    await save({ status: e.target.value })
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    if (!title.trim()) return
    await save({ title: title.trim(), description: desc.trim(), status: milestone.status })
    setEditing(false)
  }

  return (
    <li className={`milestone-card-item ms-border-${milestone.status}`}>
      {editing ? (
        <form className="milestone-edit-form" onSubmit={handleSaveEdit}>
          <div className="field">
            <label>里程碑标题 *</label>
            <input
              className="tags-input"
              maxLength={60}
              value={title}
              placeholder="里程碑标题"
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>阶段描述</label>
            <textarea
              className="content-input"
              rows={2}
              maxLength={500}
              value={desc}
              placeholder="说明该阶段要完成的核心任务..."
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <div className="actions">
            <button type="submit" className="btn btn-primary" disabled={saving || !title.trim()}>
              {saving ? '保存中...' : '保存修改'}
            </button>
            <button type="button" className="btn" onClick={() => setEditing(false)}>
              取消
            </button>
          </div>
        </form>
      ) : (
        <div className="milestone-content-wrap">
          <div className="milestone-top-row">
            <div className="milestone-title-group">
              <span className="milestone-dot" />
              <h4 className="milestone-title">{milestone.title}</h4>
            </div>

            {isAdmin ? (
              <span className="ms-status-select-wrap">
                <select
                  className="ms-select"
                  value={milestone.status}
                  onChange={handleStatusChange}
                  disabled={saving}
                >
                  {MILESTONE_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </span>
            ) : (
              <span className={`ms-badge ${MILESTONE_STATUS_CLASS[milestone.status] || ''}`}>
                <IconStatus status={milestone.status} className="badge-line-icon" /> {milestone.status}
              </span>
            )}
          </div>

          {milestone.description && (
            <p className="milestone-desc">{milestone.description}</p>
          )}

          {isAdmin && (
            <div className="milestone-actions-bar">
              <button
                type="button"
                className="link-btn"
                onClick={() => setEditing(true)}
              >
                编辑
              </button>
              <button
                type="button"
                className="link-btn danger"
                onClick={() => onRequestDelete(milestone)}
              >
                删除
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

export default function ProjectDetail({ auth }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const isAdmin = auth?.role === 'admin'

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 添加里程碑
  const [msTitle, setMsTitle] = useState('')
  const [msDesc, setMsDesc] = useState('')
  const [savingMs, setSavingMs] = useState(false)
  const [showAddMs, setShowAddMs] = useState(false)

  // 添加动态
  const [updateText, setUpdateText] = useState('')
  const [savingUpdate, setSavingUpdate] = useState(false)

  // 模态弹窗状态
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteProjectModalOpen, setDeleteProjectModalOpen] = useState(false)
  const [deletingMilestone, setDeletingMilestone] = useState(null)
  const [deletingUpdate, setDeletingUpdate] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function refresh() {
    try {
      setProject(await getProject(id))
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    setLoading(true)
    setError('')
    getProject(id)
      .then(setProject)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleConfirmDeleteProject() {
    setDeleteLoading(true)
    try {
      await deleteProject(id)
      navigate('/projects')
    } catch (err) {
      alert(`删除失败：${err.message}`)
    } finally {
      setDeleteLoading(false)
      setDeleteProjectModalOpen(false)
    }
  }

  async function handleAddMilestone(e) {
    e.preventDefault()
    if (!msTitle.trim()) return
    setSavingMs(true)
    try {
      await createMilestone(id, {
        title: msTitle.trim(),
        description: msDesc.trim(),
        status: '待开始',
        sort_order: 0,
      })
      setMsTitle('')
      setMsDesc('')
      setShowAddMs(false)
      await refresh()
    } catch (err) {
      alert(`添加失败：${err.message}`)
    } finally {
      setSavingMs(false)
    }
  }

  async function handleSaveMilestone(m) {
    try {
      await updateMilestone(id, m.id, {
        title: m.title,
        description: m.description,
        status: m.status,
        sort_order: m.sort_order,
      })
      await refresh()
    } catch (err) {
      alert(`保存失败：${err.message}`)
    }
  }

  async function handleConfirmDeleteMilestone() {
    if (!deletingMilestone) return
    setDeleteLoading(true)
    try {
      await deleteMilestone(id, deletingMilestone.id)
      setDeletingMilestone(null)
      await refresh()
    } catch (err) {
      alert(`删除失败：${err.message}`)
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleAddUpdate(e) {
    e.preventDefault()
    if (!updateText.trim()) return
    setSavingUpdate(true)
    try {
      await createUpdate(id, updateText.trim())
      setUpdateText('')
      await refresh()
    } catch (err) {
      alert(`发布失败：${err.message}`)
    } finally {
      setSavingUpdate(false)
    }
  }

  async function handleConfirmDeleteUpdate() {
    if (!deletingUpdate) return
    setDeleteLoading(true)
    try {
      await deleteUpdate(id, deletingUpdate.id)
      setDeletingUpdate(null)
      await refresh()
    } catch (err) {
      alert(`删除失败：${err.message}`)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) return <p className="panel-status">正在加载项目详情...</p>
  if (error) return <p className="panel-status panel-error">{error}</p>
  if (!project) return null

  const totalMs = project.milestones?.length || 0
  const doneMs = project.milestones?.filter((m) => m.status === '已完成').length || 0
  const progress = project.progress ?? 0

  return (
    <div className="project-detail-container">
      {/* 顶部面包屑返回 */}
      <div className="back-row">
        <Link to="/projects" className="back-btn">
          ← 返回项目看板
        </Link>
      </div>

      {/* 项目头部 Hero 卡片 */}
      <header className="pd-hero-card">
        <div className="pd-hero-main">
          <div className="pd-hero-title-row">
            <h1 className="pd-hero-title">{project.name}</h1>
            <span className={`status-badge ${PROJECT_STATUS_CLASS[project.status] || ''}`}>
              <IconStatus status={project.status} className="status-badge-icon" />
              <span>{project.status}</span>
            </span>
          </div>

          {project.description && (
            <p className="pd-hero-desc">{project.description}</p>
          )}

          {Array.isArray(project.tech_stack) && project.tech_stack.length > 0 && (
            <div className="pd-hero-tech-chips">
              {project.tech_stack.map((t) => (
                <span key={t} className="project-tech-chip">
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="pd-hero-meta-row">
            <span className="pd-meta-date">
              <IconCalendar className="meta-icon" />
              创建于 {formatDateTime(project.created_at)}
            </span>
            <span className="pd-meta-date">
              <IconRefresh className="meta-icon" />
              更新于 {formatDateTime(project.updated_at)}
            </span>
          </div>
        </div>

        <div className="pd-hero-actions">
          {project.repo_url && (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline"
              title="查看开源代码仓库"
            >
              <IconCode className="btn-icon" />
              源码仓库
            </a>
          )}
          {project.demo_url && (
            <a
              href={project.demo_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline"
              title="访问在线演示"
            >
              <IconExternal className="btn-icon" />
              在线演示
            </a>
          )}
          {isAdmin && (
            <>
              <button
                type="button"
                className="btn"
                onClick={() => setEditModalOpen(true)}
              >
                <IconEdit className="btn-icon" />
                编辑
              </button>
              <button
                type="button"
                className="btn btn-danger-outline"
                onClick={() => setDeleteProjectModalOpen(true)}
              >
                <IconTrash className="btn-icon" />
                删除
              </button>
            </>
          )}
        </div>
      </header>

      {/* 进度概览横条 */}
      <section className="pd-progress-card">
        <div className="pd-progress-header">
          <div className="pd-progress-title-wrap">
            <span className="pd-progress-tag">整体推进度</span>
            <span className="pd-progress-percent">{progress}%</span>
          </div>
          <span className="pd-progress-stat">
            阶段进度：<strong>{doneMs}</strong> / {totalMs} 里程碑已完成
          </span>
        </div>
        <div className="pd-progress-track">
          <div className="pd-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </section>

      {/* 双栏布局内容区 */}
      <div className="pd-content-grid">
        {/* 左侧主栏：里程碑演进 + 详细介绍 */}
        <main className="pd-main-col">
          {/* 里程碑模块 */}
          <section className="pd-card-box">
            <div className="pd-card-header">
              <div className="pd-card-title-wrap">
                <h3 className="pd-card-title">
                  <IconFlag className="card-header-icon" />
                  阶段里程碑与任务
                </h3>
                <span className="pd-count-badge">{totalMs} 个阶段</span>
              </div>
              {isAdmin && !showAddMs && (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setShowAddMs(true)}
                >
                  <IconPlus className="btn-icon-xs" /> 添加里程碑
                </button>
              )}
            </div>

            {/* 新增里程碑表单 */}
            {isAdmin && showAddMs && (
              <form className="pd-add-ms-form" onSubmit={handleAddMilestone}>
                <div className="field">
                  <label>阶段标题 *</label>
                  <input
                    type="text"
                    maxLength={60}
                    placeholder="例如：完成全栈接口联调与单元测试"
                    value={msTitle}
                    onChange={(e) => setMsTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label>阶段描述（可选）</label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    placeholder="简述该里程碑目标与交付物..."
                    value={msDesc}
                    onChange={(e) => setMsDesc(e.target.value)}
                  />
                </div>
                <div className="pd-form-btn-row">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingMs || !msTitle.trim()}
                  >
                    {savingMs ? '添加中...' : '确认添加'}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setShowAddMs(false)
                      setMsTitle('')
                      setMsDesc('')
                    }}
                  >
                    取消
                  </button>
                </div>
              </form>
            )}

            {totalMs === 0 ? (
              <div className="pd-empty-hint">
                <p>暂无里程碑阶段{isAdmin ? '，点击右上角「添加里程碑」开启规划。' : '。'}</p>
              </div>
            ) : (
              <ul className="milestone-timeline-list">
                {project.milestones.map((m) => (
                  <MilestoneItem
                    key={m.id}
                    milestone={m}
                    isAdmin={isAdmin}
                    onSave={handleSaveMilestone}
                    onRequestDelete={setDeletingMilestone}
                  />
                ))}
              </ul>
            )}
          </section>

          {/* 详细介绍 Markdown */}
          {project.notes && (
            <section className="pd-card-box">
              <div className="pd-card-header">
                <h3 className="pd-card-title">
                  <IconFileText className="card-header-icon" />
                  详细介绍与技术文档
                </h3>
              </div>
              <div className="markdown-body pd-markdown-content">
                <ReactMarkdown>{project.notes}</ReactMarkdown>
              </div>
            </section>
          )}
        </main>

        {/* 右侧侧栏：动态更新日志 + 项目速览 */}
        <aside className="pd-side-col">
          {/* 动态日志模块 */}
          <section className="pd-card-box">
            <div className="pd-card-header">
              <div className="pd-card-title-wrap">
                <h3 className="pd-card-title">
                  <IconClock className="card-header-icon" />
                  进展动态日志
                </h3>
                <span className="pd-count-badge">
                  {project.updates?.length || 0} 条
                </span>
              </div>
            </div>

            {/* 管理员发布动态 */}
            {isAdmin && (
              <form className="pd-add-update-form" onSubmit={handleAddUpdate}>
                <textarea
                  rows={2}
                  maxLength={500}
                  placeholder="记录今天的新进展或发布的改动..."
                  value={updateText}
                  onChange={(e) => setUpdateText(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={savingUpdate || !updateText.trim()}
                >
                  {savingUpdate ? '发布中...' : '发布动态'}
                </button>
              </form>
            )}

            {project.updates?.length === 0 ? (
              <div className="pd-empty-hint">
                <p>暂无动态记录{isAdmin ? '，在上方输入框记录最新进展吧。' : '。'}</p>
              </div>
            ) : (
              <ul className="pd-updates-timeline">
                {project.updates.map((u) => (
                  <li key={u.id} className="pd-update-item">
                    <div className="pd-update-top">
                      <span className="pd-update-time">
                        <IconClock className="icon-xs" /> {formatDateTime(u.created_at)}
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          className="link-btn danger pd-del-btn"
                          onClick={() => setDeletingUpdate(u)}
                          title="删除该动态"
                        >
                          删除
                        </button>
                      )}
                    </div>
                    <p className="pd-update-content">{u.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {/* 编辑项目弹窗 */}
      <ProjectEditModal
        isOpen={editModalOpen}
        project={project}
        onClose={() => setEditModalOpen(false)}
        onSuccess={() => refresh()}
      />

      {/* 删除项目确认弹窗 */}
      <ConfirmModal
        isOpen={deleteProjectModalOpen}
        title="确认删除项目"
        message={
          project
            ? `确定要删除项目「${project.name}」吗？删除后该项目及其所有里程碑与进度动态将被彻底清除，此操作不可恢复。`
            : ''
        }
        confirmText="确认删除"
        danger
        loading={deleteLoading}
        onConfirm={handleConfirmDeleteProject}
        onClose={() => setDeleteProjectModalOpen(false)}
      />

      {/* 删除里程碑确认弹窗 */}
      <ConfirmModal
        isOpen={Boolean(deletingMilestone)}
        title="确认删除里程碑"
        message={
          deletingMilestone
            ? `确定要删除里程碑「${deletingMilestone.title}」吗？删除后项目进度将重新计算。`
            : ''
        }
        confirmText="确认删除"
        danger
        loading={deleteLoading}
        onConfirm={handleConfirmDeleteMilestone}
        onClose={() => setDeletingMilestone(null)}
      />

      {/* 删除动态日志确认弹窗 */}
      <ConfirmModal
        isOpen={Boolean(deletingUpdate)}
        title="确认删除动态"
        message={
          deletingUpdate
            ? `确定要删除这条发表于「${formatDateTime(deletingUpdate.created_at)}」的动态记录吗？`
            : ''
        }
        confirmText="确认删除"
        danger
        loading={deleteLoading}
        onConfirm={handleConfirmDeleteUpdate}
        onClose={() => setDeletingUpdate(null)}
      />
    </div>
  )
}
