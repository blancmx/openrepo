import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getProjects, deleteProject } from '../api/projects.js'
import ProjectEditModal from './ProjectEditModal.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import {
  IconDeveloping,
  IconDone,
  IconPaused,
  IconAll,
  IconTrending,
  IconFolder,
  IconSearch,
  IconStatus,
} from './Icons.jsx'

const STATUS_CLASS = {
  开发中: 'status-developing',
  已完成: 'status-done',
  搁置: 'status-paused',
}

const VIEW_MODE_KEY = 'quill_project_view_mode'

export default function ProjectBoard({ auth }) {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 弹窗状态
  const [editingProject, setEditingProject] = useState(null)
  const [deletingProject, setDeletingProject] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 搜索、筛选与视图模式
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | '开发中' | '已完成' | '搁置'
  const [techFilter, setTechFilter] = useState('')
  const [sortBy, setSortBy] = useState('updated') // 'updated' | 'created' | 'progress_desc' | 'progress_asc'
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem(VIEW_MODE_KEY) || 'grid'
  )

  const isAdmin = auth?.role === 'admin'

  async function load() {
    setLoading(true)
    setError('')
    try {
      setProjects(await getProjects())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function handleViewModeChange(mode) {
    setViewMode(mode)
    localStorage.setItem(VIEW_MODE_KEY, mode)
  }

  async function handleConfirmDelete() {
    if (!deletingProject) return
    setDeleteLoading(true)
    try {
      await deleteProject(deletingProject.id)
      setProjects((prev) => prev.filter((p) => p.id !== deletingProject.id))
      setDeletingProject(null)
    } catch (err) {
      alert(`删除失败：${err.message}`)
    } finally {
      setDeleteLoading(false)
    }
  }

  function handleEditSuccess(updated) {
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    )
  }

  // 指标统计
  const metrics = useMemo(() => {
    const total = projects.length
    const dev = projects.filter((p) => p.status === '开发中').length
    const done = projects.filter((p) => p.status === '已完成').length
    const paused = projects.filter((p) => p.status === '搁置').length
    const avgProgress =
      total > 0
        ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / total)
        : 0
    return { total, dev, done, paused, avgProgress }
  }, [projects])

  // 提取所有唯一技术栈标签
  const allTechs = useMemo(() => {
    const set = new Set()
    for (const p of projects) {
      if (Array.isArray(p.tech_stack)) {
        p.tech_stack.forEach((t) => t && set.add(t))
      }
    }
    return Array.from(set).sort()
  }, [projects])

  // 过滤与排序计算
  const filteredProjects = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return projects
      .filter((p) => {
        const matchKw =
          !kw ||
          p.name.toLowerCase().includes(kw) ||
          (p.description && p.description.toLowerCase().includes(kw)) ||
          (Array.isArray(p.tech_stack) &&
            p.tech_stack.some((t) => t.toLowerCase().includes(kw)))
        const matchStatus = statusFilter === 'all' || p.status === statusFilter
        const matchTech =
          !techFilter ||
          (Array.isArray(p.tech_stack) && p.tech_stack.includes(techFilter))
        return matchKw && matchStatus && matchTech
      })
      .sort((a, b) => {
        if (sortBy === 'updated') {
          return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
        }
        if (sortBy === 'created') {
          return new Date(b.created_at) - new Date(a.created_at)
        }
        if (sortBy === 'progress_desc') {
          return (b.progress || 0) - (a.progress || 0)
        }
        if (sortBy === 'progress_asc') {
          return (a.progress || 0) - (b.progress || 0)
        }
        return 0
      })
  }, [projects, keyword, statusFilter, techFilter, sortBy])

  function resetFilters() {
    setKeyword('')
    setStatusFilter('all')
    setTechFilter('')
    setSortBy('updated')
  }

  const hasActiveFilters =
    Boolean(keyword.trim()) || statusFilter !== 'all' || Boolean(techFilter)

  return (
    <div className="projects-container">
      {/* 顶部主标题与操作 */}
      <div className="projects-header">
        <div className="projects-header-text">
          <p className="eyebrow">Projects & Portfolio</p>
          <h1 className="projects-title">个人项目管理</h1>
          <p className="projects-subtitle">
            记录全栈开发作品、开源实战项目与演进路线
          </p>
        </div>
        {isAdmin && (
          <Link to="/projects/new" className="btn btn-primary btn-add-project">
            <svg viewBox="0 0 24 24" className="btn-icon" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            新建项目
          </Link>
        )}
      </div>

      {/* 项目全局指标概览条 */}
      <div className="projects-metrics-strip">
        <div
          className={`project-metric-pill ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
          title="点击筛选全部项目"
        >
          <span className="metric-pill-label">
            <IconAll className="pill-icon" /> 全部项目
          </span>
          <span className="metric-pill-value">{metrics.total}</span>
        </div>
        <div
          className={`project-metric-pill ${statusFilter === '开发中' ? 'active' : ''}`}
          onClick={() => setStatusFilter('开发中')}
          title="点击筛选开发中项目"
        >
          <span className="metric-pill-label">
            <IconDeveloping className="pill-icon" /> 开发中
          </span>
          <span className="metric-pill-value dev">{metrics.dev}</span>
        </div>
        <div
          className={`project-metric-pill ${statusFilter === '已完成' ? 'active' : ''}`}
          onClick={() => setStatusFilter('已完成')}
          title="点击筛选已完成项目"
        >
          <span className="metric-pill-label">
            <IconDone className="pill-icon" /> 已完成
          </span>
          <span className="metric-pill-value done">{metrics.done}</span>
        </div>
        <div
          className={`project-metric-pill ${statusFilter === '搁置' ? 'active' : ''}`}
          onClick={() => setStatusFilter('搁置')}
          title="点击筛选搁置项目"
        >
          <span className="metric-pill-label">
            <IconPaused className="pill-icon" /> 搁置
          </span>
          <span className="metric-pill-value paused">{metrics.paused}</span>
        </div>
        <div className="project-metric-pill no-click">
          <span className="metric-pill-label">
            <IconTrending className="pill-icon" /> 平均进度
          </span>
          <span className="metric-pill-value">{metrics.avgProgress}%</span>
        </div>
      </div>

      {/* 检索、过滤与视图切换工具栏 */}
      <div className="projects-toolbar">
        {/* 搜索框 */}
        <div className="projects-search-box">
          <svg viewBox="0 0 24 24" className="search-icon" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="projects-search-input"
            placeholder="搜索项目名称、描述或技术栈..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          {keyword && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setKeyword('')}
              title="清空搜索"
            >
              ✕
            </button>
          )}
        </div>

        {/* 状态与技术栈筛选器 */}
        <div className="projects-filters-group">
          {/* 技术栈筛选下拉 */}
          <select
            className="select-filter"
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
          >
            <option value="">全部技术栈</option>
            {allTechs.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* 排序下拉 */}
          <select
            className="select-filter"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="updated">按最近更新</option>
            <option value="created">按创建时间</option>
            <option value="progress_desc">按进度从高到低</option>
            <option value="progress_asc">按进度从低到高</option>
          </select>

          {/* 视图模式切换 */}
          <div className="view-switch-group">
            <button
              type="button"
              className={`view-switch-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('grid')}
              title="网格卡片视图"
              aria-label="网格视图"
            >
              <svg viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>网格</span>
            </button>
            <button
              type="button"
              className={`view-switch-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('kanban')}
              title="看板泳道视图"
              aria-label="看板视图"
            >
              <svg viewBox="0 0 24 24">
                <rect x="3" y="3" width="5" height="18" rx="1" />
                <rect x="10" y="3" width="5" height="18" rx="1" />
                <rect x="17" y="3" width="5" height="18" rx="1" />
              </svg>
              <span>看板</span>
            </button>
          </div>
        </div>
      </div>

      {/* 活动筛选提示与重置 */}
      {hasActiveFilters && (
        <div className="active-filters-bar">
          <span className="filter-summary-text">
            筛选结果：共 <strong>{filteredProjects.length}</strong> 个项目
          </span>
          <button type="button" className="reset-filters-btn" onClick={resetFilters}>
            重置所有筛选 ✕
          </button>
        </div>
      )}

      {/* 主展示区 */}
      {loading ? (
        <p className="panel-status">正在加载项目看板...</p>
      ) : error ? (
        <p className="panel-status panel-error">
          {error}{' '}
          <button type="button" className="link-btn" onClick={load}>
            重试
          </button>
        </p>
      ) : projects.length === 0 ? (
        <div className="projects-empty-card">
          <div className="empty-icon-wrap">
            <IconFolder className="empty-svg-icon" />
          </div>
          <h3>还没有创建任何项目</h3>
          <p>开始记录你的第一个全栈作品或开源项目，追踪里程碑与动态演进。</p>
          {isAdmin && (
            <Link to="/projects/new" className="btn btn-primary">
              ＋ 创建第一个项目
            </Link>
          )}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="projects-empty-card">
          <div className="empty-icon-wrap">
            <IconSearch className="empty-svg-icon" />
          </div>
          <h3>没有找到匹配的项目</h3>
          <p>尝试调整搜索关键词、状态或技术栈筛选条件。</p>
          <button type="button" className="btn" onClick={resetFilters}>
            清除筛选条件
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* 网格视图 */
        <div className="projects-grid-view">
          {filteredProjects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              isAdmin={isAdmin}
              onEdit={setEditingProject}
              onDelete={setDeletingProject}
              onNavigate={navigate}
            />
          ))}
        </div>
      ) : (
        /* 看板视图 */
        <div className="projects-kanban-view">
          {['开发中', '已完成', '搁置'].map((status) => {
            const list = filteredProjects.filter((p) => p.status === status)
            return (
              <div key={status} className={`kanban-column kanban-${status}`}>
                <div className="kanban-column-header">
                  <div className="kanban-col-title">
                    <IconStatus status={status} className="kanban-status-icon-svg" />
                    <span>{status}</span>
                  </div>
                  <span className="kanban-col-count">{list.length}</span>
                </div>
                <div className="kanban-card-list">
                  {list.length === 0 ? (
                    <div className="kanban-empty-slot">暂无{status}项目</div>
                  ) : (
                    list.map((p) => (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        isAdmin={isAdmin}
                        onEdit={setEditingProject}
                        onDelete={setDeletingProject}
                        onNavigate={navigate}
                        isKanban
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 编辑项目弹窗 */}
      <ProjectEditModal
        isOpen={Boolean(editingProject)}
        project={editingProject}
        onClose={() => setEditingProject(null)}
        onSuccess={handleEditSuccess}
      />

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={Boolean(deletingProject)}
        title="确认删除项目"
        message={
          deletingProject
            ? `确定要删除项目「${deletingProject.name}」吗？删除后该项目及其所有里程碑与进度动态将被彻底清除，此操作不可恢复。`
            : ''
        }
        confirmText="确认删除"
        danger
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingProject(null)}
      />
    </div>
  )
}

function ProjectCard({
  project: p,
  isAdmin,
  onEdit,
  onDelete,
  onNavigate,
  isKanban,
}) {
  return (
    <div
      className={`project-card-v2 ${isKanban ? 'kanban-item-card' : ''}`}
      onClick={() => onNavigate(`/projects/${p.id}`)}
      title="点击查看项目详情"
    >
      <div className="project-card-header">
        <h3 className="project-card-title">{p.name}</h3>
        <span className={`status-badge ${STATUS_CLASS[p.status] || ''}`}>
          {p.status}
        </span>
      </div>

      {p.description && (
        <p className="project-card-desc" title={p.description}>
          {p.description}
        </p>
      )}

      {Array.isArray(p.tech_stack) && p.tech_stack.length > 0 && (
        <div className="project-card-tags">
          {p.tech_stack.map((t) => (
            <span key={t} className="project-tech-chip">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="project-progress-wrap">
        <div className="project-progress-bar">
          <div
            className="project-progress-bar-fill"
            style={{ width: `${p.progress || 0}%` }}
          />
        </div>
        <span className="project-progress-num">{p.progress || 0}%</span>
      </div>

      <div className="project-card-footer">
        <div className="project-card-links">
          {p.repo_url && (
            <a
              href={p.repo_url}
              target="_blank"
              rel="noreferrer"
              className="project-out-link"
              onClick={(e) => e.stopPropagation()}
              title="查看开源代码仓库"
            >
              <svg viewBox="0 0 24 24" className="link-icon" aria-hidden="true">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
              源码
            </a>
          )}
          {p.demo_url && (
            <a
              href={p.demo_url}
              target="_blank"
              rel="noreferrer"
              className="project-out-link"
              onClick={(e) => e.stopPropagation()}
              title="访问在线演示环境"
            >
              <svg viewBox="0 0 24 24" className="link-icon" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              演示
            </a>
          )}
        </div>

        {isAdmin && (
          <div className="project-card-admin-actions">
            <button
              type="button"
              className="link-btn"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(p)
              }}
              title="弹窗编辑项目基本信息"
            >
              编辑
            </button>
            <button
              type="button"
              className="link-btn danger"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(p)
              }}
              title="删除该项目"
            >
              删除
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
