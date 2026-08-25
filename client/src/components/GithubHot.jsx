import { useEffect, useState } from 'react'
import { getGithubHot, formatNumber } from '../api/external.js'
import { IconStar, IconCode } from './Icons.jsx'

export default function GithubHot() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load(force = false) {
    setLoading(true)
    setError('')
    try {
      setItems(await getGithubHot(force))
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
          <p className="eyebrow">GitHub</p>
          <h2 className="panel-title">本周热点仓库</h2>
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
          {items.map((r) => (
            <li key={r.fullName} className="side-rich-item">
              <div className="side-item-top">
                <a
                  className="side-item-title"
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  title={r.fullName}
                >
                  <IconCode className="side-title-icon" />
                  <span className="side-title-text">{r.fullName}</span>
                </a>
                <span className="side-item-badge">
                  <IconStar className="side-star-icon" />
                  {formatNumber(r.stars)}
                </span>
              </div>
              {r.description && (
                <p className="side-item-desc" title={r.description}>
                  {r.description}
                </p>
              )}
              {r.language && (
                <div className="side-item-meta">
                  <span className="side-lang-pill">
                    <span
                      className="side-lang-dot"
                      style={{
                        backgroundColor:
                          r.languageColor ||
                          (r.language === 'TypeScript'
                            ? '#3178c6'
                            : r.language === 'Python'
                            ? '#3572A5'
                            : r.language === 'Rust'
                            ? '#dea584'
                            : r.language === 'Go'
                            ? '#00ADD8'
                            : '#8b949e'),
                      }}
                    />
                    {r.language}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
