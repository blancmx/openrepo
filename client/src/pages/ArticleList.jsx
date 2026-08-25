import { useEffect, useState, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getArticles, deleteArticle } from '../api/articles.js'
import { formatDateParts } from '../utils/date.js'
import { IconPlus, IconTrash } from '../components/Icons.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'

function ArticleEntry({ article, onTagClick, onDelete, isAdmin, index }) {
  const itemRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = itemRef.current
    if (!el) return

    // 前 3 项无需等待直接显示
    if (index < 3) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      {
        root: document.querySelector('.home-main') || null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.05,
      }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [index])

  const date = formatDateParts(article.created_at)

  return (
    <li
      ref={itemRef}
      className={`entry${isVisible ? ' is-visible' : ''}`}
      style={{ transitionDelay: isVisible && index < 6 ? `${index * 40}ms` : '0ms' }}
    >
      {date && (
        <span className="entry-date" aria-hidden="true">
          <span className="entry-date-ym">{date.ym}</span>
          <span className="entry-date-day">{date.day}</span>
        </span>
      )}
      <div className="entry-body">
        <div className="entry-title-row">
          <h2 className="entry-heading">
            <Link className="entry-title" to={`/articles/${article.id}`}>
              {article.title}
            </Link>
          </h2>

          {/* 带有开盖动效的垃圾桶删除按钮 */}
          {isAdmin && (
            <button
              type="button"
              className="entry-delete-btn"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete(article)
              }}
              title="删除文章"
              aria-label="删除文章"
            >
              <IconTrash className="trash-can-icon" />
            </button>
          )}
        </div>

        <p className="entry-summary">{article.summary}</p>

        {article.tags?.length > 0 && (
          <div className="entry-tags">
            {article.tags.map((t) => (
              <button
                key={t}
                type="button"
                className="filter-chip"
                onClick={() => onTagClick(t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>
    </li>
  )
}

export default function ArticleList({ auth }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const tag = searchParams.get('tag') || ''
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 滚动吸顶状态监听
  const [scrolled, setScrolled] = useState(false)

  // 删除确认弹窗状态
  const [deletingArticle, setDeletingArticle] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getArticles({ q, tag })
      .then(setArticles)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [q, tag])

  useEffect(() => {
    const scrollContainer = document.querySelector('.home-main') || window
    function handleScroll() {
      const isWin = scrollContainer === window
      const scrollTop = isWin ? window.scrollY : scrollContainer.scrollTop
      setScrolled(scrollTop > 20)
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [])

  function clearParam(name) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete(name)
        return next
      },
      { replace: true }
    )
  }

  function handleTagClick(t) {
    setSearchParams({ tag: t })
  }

  function handleBackToTop() {
    const scrollContainer = document.querySelector('.home-main') || window
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 确认删除文章
  async function handleConfirmDelete() {
    if (!deletingArticle) return
    try {
      setDeleteLoading(true)
      await deleteArticle(deletingArticle.id)
      setArticles((prev) => prev.filter((a) => a.id !== deletingArticle.id))
      setDeletingArticle(null)
    } catch (err) {
      alert('删除文章失败：' + err.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (error) return <p className="status status-error">加载失败：{error}</p>

  const isAdmin = auth?.role === 'admin'

  return (
    <div className="article-list-container">
      {/* 滚动动效吸顶栏 */}
      <div className={`article-list-sticky-bar${scrolled ? ' is-scrolled' : ''}`}>
        <div className="article-list-header">
          <div className="article-list-title-wrap">
            <h1 className="article-list-title">文章精选</h1>
            <span className="article-count-badge">{articles.length} 篇</span>
          </div>
          {isAdmin && (
            <Link to="/articles/new" className="btn btn-primary btn-write-article">
              <IconPlus className="btn-icon" />
              写文章
            </Link>
          )}
        </div>

        {(q || tag) && (
          <div className="active-filters">
            {q && (
              <button type="button" className="filter-chip is-active" onClick={() => clearParam('q')}>
                搜索「{q}」 ✕
              </button>
            )}
            {tag && (
              <button type="button" className="filter-chip is-active" onClick={() => clearParam('tag')}>
                标签：{tag} ✕
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <p className="status">加载中...</p>
      ) : articles.length === 0 ? (
        <div className="empty">
          {q || tag ? (
            <p>没有找到匹配的文章。</p>
          ) : (
            <>
              <p>还没有文章。</p>
              {isAdmin ? (
                <p>
                  写下第一篇，<Link to="/articles/new">记录你的全栈之旅</Link>。
                </p>
              ) : (
                <p>博主暂未发布文章，敬请期待！</p>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          <p className="eyebrow">
            归档 · 共 {articles.length} 篇{q ? ` · 关键词「${q}」` : ''}
            {tag ? ` · 标签「${tag}」` : ''}
          </p>
          <ol className="archive">
            {articles.map((a, idx) => (
              <ArticleEntry
                key={a.id}
                article={a}
                index={idx}
                isAdmin={isAdmin}
                onTagClick={handleTagClick}
                onDelete={setDeletingArticle}
              />
            ))}
          </ol>
        </>
      )}

      {/* 滚动浮现的平滑回顶动效按钮 */}
      {scrolled && (
        <button
          type="button"
          className="back-to-top-btn animate-fade-in"
          onClick={handleBackToTop}
          title="返回顶部"
          aria-label="返回顶部"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="back-top-svg">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={!!deletingArticle}
        title="确认删除文章"
        message={`确定要删除文章「${deletingArticle?.title}」吗？删除后内容将无法恢复。`}
        confirmText="删除文章"
        cancelText="取消"
        danger
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingArticle(null)}
      />
    </div>
  )
}
