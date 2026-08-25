import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { getArticle, deleteArticle } from '../api/articles.js'
import { formatDateTime } from '../utils/date.js'

export default function ArticleDetail({ auth }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    getArticle(id)
      .then(setArticle)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!window.confirm(`确定删除《${article.title}》吗？此操作不可恢复。`)) return
    try {
      await deleteArticle(id)
      navigate('/')
    } catch (err) {
      alert(`删除失败：${err.message}`)
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
      <p className="meta">
        发布于 {formatDateTime(article.created_at)}
        {auth?.role === 'admin' && (
          <>
            {' · '}
            <Link to={`/articles/${id}/edit`}>编辑</Link>
            {' · '}
            <button type="button" className="link-btn danger" onClick={handleDelete}>
              删除
            </button>
          </>
        )}
      </p>
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
    </article>
  )
}
