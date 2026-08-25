import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getArticle, createArticle, updateArticle } from '../api/articles.js'
import AlertModal from '../components/AlertModal.jsx'

export default function ArticleEditor({ auth }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' })

  useEffect(() => {
    if (!isEdit) return
    getArticle(id)
      .then((a) => {
        setTitle(a.title)
        setContent(a.content)
        setTags((a.tags || []).join(', '))
      })
      .catch((err) => setAlertModal({ isOpen: true, message: `加载文章失败：${err.message}` }))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function validate() {
    const t = title.trim()
    if (!auth) return '请先登录后再操作'
    if (!t) return '标题不能为空'
    if (t.length > 100) return '标题不能超过 100 字'
    if (!content.trim()) return '正文不能为空'
    if (tags.trim().split(/[,，\s]+/).filter(Boolean).length > 5) return '标签最多 5 个'
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
      const payload = { title: title.trim(), content, tags: tags.trim() || '' }
      const article = isEdit
        ? await updateArticle(id, payload)
        : await createArticle(payload)
      navigate(`/articles/${article.id}`)
    } catch (err) {
      setAlertModal({ isOpen: true, message: `保存失败：${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  if (!auth || auth.role !== 'admin') {
    return (
      <div className="empty">
        <p>仅博主可发布或编辑文章。</p>
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
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
        >
          ← 返回
        </button>
      </div>
      <form className="editor-form" onSubmit={handleSubmit}>
        <h1>{isEdit ? '编辑文章' : '写文章'}</h1>
        <input
          className="title-input"
          placeholder="文章标题（1-100 字）"
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="content-input"
          placeholder="正文内容，支持 Markdown 语法"
          rows={18}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <input
          className="tags-input"
          placeholder="标签（可选，用逗号分隔，最多 5 个，如：后端, 随笔）"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <div className="actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '保存中...' : isEdit ? '保存修改' : '发布'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
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
