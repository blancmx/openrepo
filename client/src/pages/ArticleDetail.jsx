import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { getArticle, deleteArticle } from '../api/articles.js'
import { formatDateTime } from '../utils/date.js'
import { IconTrash } from '../components/Icons.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'

export default function ArticleDetail({ auth }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError('')
    getArticle(id)
      .then(setArticle)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleConfirmDelete() {
    try {
      setDeleteLoading(true)
      await deleteArticle(id)
      navigate('/')
    } catch (err) {
      alert(`删除失败：${err.message}`)
    } finally {
      setDeleteLoading(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) return <p className="status">加载中...</p>
  if (error) return <p className="status status-error">{error}</p>

  return (
    <article>
      <div className="back-row">
        <Link to="/" className="back-btn">
          ← 返回列表
        </Link>
      </div>
      <h1>{article.title}</h1>
      <div className="meta">
        <span>发布于 {formatDateTime(article.created_at)}</span>
        {auth?.role === 'admin' && (
          <div className="detail-admin-actions">
            <Link to={`/articles/${id}/edit`} className="detail-edit-link">
              编辑
            </Link>
            <button
              type="button"
              className="detail-delete-btn"
              onClick={() => setShowDeleteModal(true)}
              title="删除文章"
              aria-label="删除文章"
            >
              <IconTrash className="trash-can-icon" />
              <span>删除</span>
            </button>
          </div>
        )}
      </div>
      {article.tags?.length > 0 && (
        <div className="entry-tags detail-tags">
          {article.tags.map((t) => (
            <Link key={t} className="filter-chip" to={`/?tag=${encodeURIComponent(t)}`}>
              {t}
            </Link>
          ))}
        </div>
      )}
      <div className="markdown-body">
        <ReactMarkdown>{article.content}</ReactMarkdown>
      </div>

      {/* 与文章列表完全一致的纯白一体化 ConfirmModal 弹窗 */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="确认删除文章"
        message={`确定要删除文章「${article.title}」吗？删除后内容将无法恢复。`}
        confirmText="删除文章"
        cancelText="取消"
        danger
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => setShowDeleteModal(false)}
      />
    </article>
  )
}
