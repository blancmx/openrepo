import { useEffect, useState } from 'react'
import { updateProject } from '../api/projects.js'

export default function ProjectEditModal({ isOpen, project, onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [techStack, setTechStack] = useState('')
  const [status, setStatus] = useState('开发中')
  const [repoUrl, setRepoUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (project) {
      setName(project.name || '')
      setDescription(project.description || '')
      setTechStack(
        Array.isArray(project.tech_stack)
          ? project.tech_stack.join(', ')
          : project.tech_stack || ''
      )
      setStatus(project.status || '开发中')
      setRepoUrl(project.repo_url || '')
      setDemoUrl(project.demo_url || '')
      setError('')
    }
  }, [project, isOpen])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !saving) {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, saving, onClose])

  if (!isOpen || !project) return null

  function validate() {
    if (!name.trim()) return '项目名称不能为空'
    if (name.trim().length > 60) return '项目名称不能超过 60 字'
    if (techStack.trim().split(/[,，\s]+/).filter(Boolean).length > 6) {
      return '技术栈最多 6 项'
    }
    for (const [label, value] of [
      ['仓库地址', repoUrl.trim()],
      ['演示地址', demoUrl.trim()],
    ]) {
      if (value && !/^https?:\/\/.+/.test(value)) {
        return `${label}必须是合法的 http/https 链接`
      }
    }
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const msg = validate()
    if (msg) {
      setError(msg)
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        tech_stack: techStack.trim(),
        status,
        repo_url: repoUrl.trim(),
        demo_url: demoUrl.trim(),
      }
      const updated = await updateProject(project.id, payload)
      if (onSuccess) {
        onSuccess(updated)
      }
      onClose()
    } catch (err) {
      setError(err.message || '更新项目失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={saving ? undefined : onClose}>
      <div
        className="modal-dialog modal-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-project-modal-title"
      >
        <div className="modal-header">
          <h3 id="edit-project-modal-title" className="modal-title">
            编辑项目 — {project.name}
          </h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={saving}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body modal-form-grid">
            {error && <div className="error-banner span-full">{error}</div>}

            <div className="field span-2-3">
              <label htmlFor="edit-proj-name">项目名称 *</label>
              <input
                id="edit-proj-name"
                type="text"
                maxLength={60}
                placeholder="例如：Quill — 个人博客系统"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="field span-1-3">
              <label htmlFor="edit-proj-status">项目状态</label>
              <select
                id="edit-proj-status"
                className="select-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>开发中</option>
                <option>已完成</option>
                <option>搁置</option>
              </select>
            </div>

            <div className="field span-full">
              <label htmlFor="edit-proj-desc">项目描述</label>
              <textarea
                id="edit-proj-desc"
                rows={2}
                placeholder="一句话介绍这个项目的功能与亮点"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="field span-full">
              <label htmlFor="edit-proj-tech">技术栈（逗号分隔，最多 6 项）</label>
              <input
                id="edit-proj-tech"
                type="text"
                placeholder="React, Express, SQLite"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
              />
            </div>

            <div className="field span-half">
              <label htmlFor="edit-proj-repo">开源仓库地址</label>
              <input
                id="edit-proj-repo"
                type="url"
                placeholder="https://github.com/..."
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
            </div>

            <div className="field span-half">
              <label htmlFor="edit-proj-demo">在线演示地址</label>
              <input
                id="edit-proj-demo"
                type="url"
                placeholder="https://..."
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={saving}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? '保存中...' : '保存修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
