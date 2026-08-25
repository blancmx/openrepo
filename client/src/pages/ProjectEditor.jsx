import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getProject, createProject, updateProject } from '../api/projects.js'
import AlertModal from '../components/AlertModal.jsx'

export default function ProjectEditor({ auth }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [techStack, setTechStack] = useState('')
  const [status, setStatus] = useState('开发中')
  const [repoUrl, setRepoUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' })

  useEffect(() => {
    if (!isEdit) return
    getProject(id)
      .then((p) => {
        setName(p.name)
        setDescription(p.description)
        setTechStack((p.tech_stack || []).join(', '))
        setStatus(p.status)
        setRepoUrl(p.repo_url)
        setDemoUrl(p.demo_url)
      })
      .catch((err) => setAlertModal({ isOpen: true, message: `加载项目失败：${err.message}` }))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function validate() {
    if (!name.trim()) return '项目名称不能为空'
    if (name.trim().length > 60) return '项目名称不能超过 60 字'
    if (techStack.trim().split(/[,，\s]+/).filter(Boolean).length > 6) return '技术栈最多 6 项'
    for (const [label, value] of [
      ['仓库地址', repoUrl.trim()],
      ['演示地址', demoUrl.trim()],
    ]) {
      if (value && !/^https?:\/\/.+/.test(value)) return `${label}必须是合法的 http/https 链接`
    }
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const message = validate()
    if (message) {
      setAlertModal({ isOpen: true, message })
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        tech_stack: techStack.trim(),
        status,
        repo_url: repoUrl.trim(),
        demo_url: demoUrl.trim(),
      }
      if (isEdit) {
        await updateProject(id, payload)
      } else {
        await createProject(payload)
      }
      navigate('/projects')
    } catch (err) {
      setAlertModal({ isOpen: true, message: `保存失败：${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  if (!auth || auth.role !== 'admin') {
    return (
      <div className="empty">
        <p>仅博主可管理项目。</p>
        {!auth && (
          <p>
            请先<Link to="/login">登录</Link>。
          </p>
        )}
      </div>
    )
  }

  if (loading) return <p className="status">加载中...</p>

  return (
    <div className="editor-container">
      <div className="back-row">
        <button
          type="button"
          className="back-btn"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/projects'))}
        >
          ← 返回
        </button>
      </div>
      <form className="editor-form" onSubmit={handleSubmit}>
        <h1>{isEdit ? '编辑项目' : '添加项目'}</h1>
        <label className="field">
          <span>项目名称 *</span>
          <input
            className="title-input"
            maxLength={60}
            placeholder="例如：Quill — 个人博客系统"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="field">
          <span>项目描述</span>
          <textarea
            className="content-input"
            rows={4}
            placeholder="一句话介绍这个项目"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="field">
          <span>技术栈（逗号分隔，最多 6 项）</span>
          <input
            className="tags-input"
            placeholder="React, Express, SQLite"
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
          />
        </label>
        <label className="field">
          <span>状态</span>
          <select className="select-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>开发中</option>
            <option>已完成</option>
            <option>搁置</option>
          </select>
        </label>
        <label className="field">
          <span>仓库地址</span>
          <input
            className="tags-input"
            placeholder="https://github.com/..."
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />
        </label>
        <label className="field">
          <span>演示地址</span>
          <input
            className="tags-input"
            placeholder="https://..."
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
          />
        </label>
        <div className="actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '保存中...' : isEdit ? '保存修改' : '添加项目'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/projects'))}
          >
            取消
          </button>
        </div>
      </form>

      <AlertModal
        isOpen={alertModal.isOpen}
        title="提示"
        message={alertModal.message}
        onClose={() => setAlertModal({ isOpen: false, message: '' })}
      />
    </div>
  )
}
