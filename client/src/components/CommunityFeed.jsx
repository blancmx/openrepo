import { useEffect, useState } from 'react'
import { getCommunityPosts } from '../api/external.js'
import { IconFileText, IconExternal } from './Icons.jsx'

export default function CommunityFeed() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load(force = false) {
    setLoading(true)
    setError('')
    try {
      setPosts(await getCommunityPosts(force))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <p className="eyebrow">Community</p>
          <h2 className="panel-title">社区博客精选</h2>
        </div>
        <button type="button" className="link-btn panel-refresh" onClick={() => load(true)}>
          刷新
        </button>
      </header>
      {loading ? (
        <p className="panel-status">加载中...</p>
      ) : error ? (
        <p className="panel-status panel-error">
          {error}{' '}
          <button type="button" className="link-btn" onClick={() => load()}>
            重试
          </button>
        </p>
      ) : (
        <ul className="panel-list side-rich-list">
          {posts.map((p) => (
            <li key={p.id} className="side-rich-item">
              <div className="side-item-top">
                <a
                  className="side-item-title"
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  title={p.title}
                >
                  <IconFileText className="side-title-icon" />
                  <span className="side-title-text">{p.title}</span>
                </a>
              </div>
              <div className="side-item-meta">
                <span className="side-item-author">{p.author}</span>
                <span className="side-meta-divider">·</span>
                <span className="side-item-date">{p.publishedAt}</span>
                <span className="side-item-reactions">
                  {p.reactions} 赞
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
