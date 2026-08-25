import { useEffect, useState } from 'react'
import { getNewsFeed, getGithubTrending, getNewsSummary } from '../api/news.js'
import {
  IconNews,
  IconStar,
  IconSparkles,
  IconRefresh,
  IconSearch,
  IconExternal,
  IconCode,
  IconTrending,
  IconCalendar,
  IconFolder,
  IconFire,
} from '../components/Icons.jsx'

function formatDateTime(str) {
  if (!str) return ''
  return str.replace('T', ' ').slice(0, 16)
}

const CATEGORIES = [
  { key: 'all', label: '全部资讯' },
  { key: 'ai', label: 'AI 与大模型' },
  { key: 'frontend', label: '前端与 Web' },
  { key: 'architecture', label: '系统与架构' },
  { key: 'tools', label: '开发工具与开源' },
]

const LANGUAGES = [
  { key: 'all', label: '全部语言' },
  { key: 'js', label: 'JavaScript / TypeScript' },
  { key: 'python', label: 'Python / AI' },
  { key: 'rust', label: 'Rust' },
  { key: 'go', label: 'Go' },
  { key: 'c++', label: 'C++' },
]

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState('feed') // 'feed' | 'github'
  const [category, setCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [trendingPeriod, setTrendingPeriod] = useState('weekly') // 'weekly' | 'daily'
  const [language, setLanguage] = useState('all')

  const [newsList, setNewsList] = useState([])
  const [trendingList, setTrendingList] = useState([])
  const [summary, setSummary] = useState({
    totalNews: 0,
    aiCount: 0,
    aiRatio: 0,
    trendingCount: 0,
    lastUpdated: '',
  })

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  async function loadData(force = false) {
    if (force) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError('')

    try {
      const [feedData, githubData, summaryData] = await Promise.all([
        getNewsFeed({ category, q: searchQuery, force }),
        getGithubTrending({ language, since: trendingPeriod, force }),
        getNewsSummary(force),
      ])
      setNewsList(feedData)
      setTrendingList(githubData)
      setSummary(summaryData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // 依赖变化时重新加载
  useEffect(() => {
    loadData(false)
  }, [category, searchQuery, language, trendingPeriod])

  return (
    <div className="news-container">
      {/* 头部 Hero 卡片与数据概览 */}
      <header className="news-hero-card">
        <div className="news-hero-content">
          <div className="news-hero-text">
            <div className="eyebrow">
              <IconNews className="meta-icon" /> 科技雷达 / Tech Intel
            </div>
            <h1 className="news-title">前沿资讯与热门开源</h1>
            <p className="news-subtitle">
              实时聚合当日 AI 与计算机前沿技术动态，洞察 GitHub 本周高热度与高增长开源项目。
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-refresh"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
          >
            <IconRefresh className={`btn-icon${refreshing ? ' spin' : ''}`} />
            {refreshing ? '正在刷新...' : '一键刷新'}
          </button>
        </div>

        {/* 顶部指标概览条 */}
        <div className="news-metrics-strip">
          <div className="news-metric-pill">
            <span className="metric-pill-label">
              <IconNews className="pill-icon" /> 今日追踪资讯
            </span>
            <span className="metric-pill-value">{summary.totalNews} 篇</span>
          </div>

          <div className="news-metric-pill">
            <span className="metric-pill-label">
              <IconSparkles className="pill-icon text-cinnabar" /> AI 与大模型聚焦
            </span>
            <span className="metric-pill-value text-cinnabar">
              {summary.aiCount} 篇 ({summary.aiRatio}%)
            </span>
          </div>

          <div className="news-metric-pill">
            <span className="metric-pill-label">
              <IconStar className="pill-icon text-amber" /> GitHub 本周热门
            </span>
            <span className="metric-pill-value">{summary.trendingCount} 仓库</span>
          </div>

          <div className="news-metric-pill">
            <span className="metric-pill-label">
              <IconCalendar className="pill-icon" /> 最近更新时间
            </span>
            <span className="metric-pill-value font-mono text-sm">
              {formatDateTime(summary.lastUpdated || new Date().toISOString()).slice(5, 16)}
            </span>
          </div>
        </div>
      </header>

      {/* 主视图切换 Tabs */}
      <nav className="news-view-tabs">
        <button
          type="button"
          className={`news-tab-btn${activeTab === 'feed' ? ' active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          <IconNews className="tab-icon" />
          <span>前沿科技资讯</span>
          <span className="count-tag">{newsList.length}</span>
        </button>

        <button
          type="button"
          className={`news-tab-btn${activeTab === 'github' ? ' active' : ''}`}
          onClick={() => setActiveTab('github')}
        >
          <IconStar className="tab-icon" />
          <span>GitHub 本周热门</span>
          <span className="count-tag">{trendingList.length}</span>
        </button>
      </nav>

      {/* TAB 1: 前沿科技资讯流 */}
      {activeTab === 'feed' && (
        <section className="news-tab-pane">
          {/* 筛选与搜索工具栏 */}
          <div className="news-filter-toolbar">
            <div className="news-category-pills">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  className={`cat-pill-btn${category === cat.key ? ' active' : ''}`}
                  onClick={() => setCategory(cat.key)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="news-search-box">
              <IconSearch className="search-icon" />
              <input
                type="text"
                placeholder="搜索资讯标题、技术关键词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="news-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 状态与资讯网格 */}
          {loading ? (
            <div className="status">正在获取最新科技资讯...</div>
          ) : error ? (
            <div className="status status-error">
              {error}
              <button
                type="button"
                className="link-btn"
                onClick={() => loadData(true)}
                style={{ marginLeft: 8 }}
              >
                重试
              </button>
            </div>
          ) : newsList.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon-wrap">
                <IconSearch className="empty-svg-icon" />
              </div>
              <p className="empty-title">未找到相关资讯</p>
              <p className="empty-desc">尝试更换分类或清空搜索关键词以浏览更多内容。</p>
            </div>
          ) : (
            <div className="news-feed-grid">
              {newsList.map((item) => (
                <article key={item.id} className="news-card">
                  <div className="news-card-header">
                    <div className="news-card-meta">
                      <span className={`news-cat-tag cat-${item.category}`}>
                        {item.categoryLabel || '综合资讯'}
                      </span>
                      <span className="news-source-tag">{item.source}</span>
                    </div>
                    <time className="news-time">
                      {formatDateTime(item.publishedAt).slice(5, 16)}
                    </time>
                  </div>

                  <h3 className="news-card-title">
                    <a href={item.url} target="_blank" rel="noreferrer" className="news-link">
                      {item.title}
                    </a>
                  </h3>

                  <p className="news-card-summary">{item.summary}</p>

                  <div className="news-card-tags">
                    {(item.tags || []).map((t) => (
                      <span key={t} className="news-tag-chip">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <footer className="news-card-footer">
                    <span className="news-heat-badge">
                      <IconTrending className="badge-line-icon" /> 热度 {item.heat}
                    </span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="link-btn read-more-link"
                    >
                      阅读原文 <IconExternal className="icon-xs" />
                    </a>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: GitHub 热门开源雷达（支持 Weekly 本周热门 与 Daily 今日飙升） */}
      {activeTab === 'github' && (
        <section className="news-tab-pane">
          {/* 周期与语言过滤栏 */}
          <div className="news-filter-toolbar github-toolbar">
            {/* 左侧：今日飙升 / 本周热门 周期切换 Segment */}
            <div className="news-period-segment">
              <button
                type="button"
                className={`period-seg-btn${trendingPeriod === 'weekly' ? ' active' : ''}`}
                onClick={() => setTrendingPeriod('weekly')}
              >
                <IconStar className="badge-line-icon" /> 本周热门 Weekly
              </button>
              <button
                type="button"
                className={`period-seg-btn${trendingPeriod === 'daily' ? ' active' : ''}`}
                onClick={() => setTrendingPeriod('daily')}
              >
                <IconFire className="badge-line-icon" /> 今日飙升 Daily
              </button>
            </div>

            {/* 右侧：编程语言筛选 */}
            <div className="news-category-pills">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.key}
                  type="button"
                  className={`cat-pill-btn${language === lang.key ? ' active' : ''}`}
                  onClick={() => setLanguage(lang.key)}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* 热门开源项目网格 */}
          {loading ? (
            <div className="status">
              正在追踪 GitHub {trendingPeriod === 'daily' ? '今日飙升' : '本周热门'}项目...
            </div>
          ) : error ? (
            <div className="status status-error">
              {error}
              <button
                type="button"
                className="link-btn"
                onClick={() => loadData(true)}
                style={{ marginLeft: 8 }}
              >
                重试
              </button>
            </div>
          ) : trendingList.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon-wrap">
                <IconFolder className="empty-svg-icon" />
              </div>
              <p className="empty-title">暂无该语言热门项目</p>
              <p className="empty-desc">请选择「全部语言」查看热门开源项目。</p>
            </div>
          ) : (
            <div className="trending-repos-grid">
              {trendingList.map((repo) => (
                <div key={repo.fullName} className="trending-card">
                  <div className="trending-card-top">
                    <div className="trending-repo-name-group">
                      <IconCode className="trending-repo-icon" />
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="trending-repo-link"
                      >
                        <span className="repo-owner">{repo.owner}/</span>
                        <span className="repo-name">{repo.name}</span>
                      </a>
                    </div>
                  </div>

                  <p className="trending-desc">{repo.description}</p>

                  <div className="trending-meta-row">
                    <div className="trending-lang-wrap">
                      <span
                        className="lang-color-dot"
                        style={{ backgroundColor: repo.languageColor || '#6e7681' }}
                      />
                      <span className="lang-name">{repo.language}</span>
                    </div>

                    <div className="trending-star-badge">
                      <IconStar className="badge-line-icon" />
                      <span>{repo.stars.toLocaleString()}</span>
                    </div>

                    {(repo.growthStars || repo.weeklyStars) && (
                      <span className={`growth-stars-tag ${trendingPeriod === 'daily' ? 'daily-tag' : 'weekly-tag'}`}>
                        {trendingPeriod === 'daily' ? (
                          <IconFire className="icon-xs" />
                        ) : (
                          <IconTrending className="icon-xs" />
                        )}
                        +{(repo.growthStars || repo.weeklyStars).toLocaleString()} {repo.growthPeriod || (trendingPeriod === 'daily' ? '今日' : '本周')}
                      </span>
                    )}
                  </div>

                  <div className="trending-card-footer">
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline btn-sm trending-visit-btn"
                    >
                      <IconExternal className="btn-icon-xs" /> 访问 GitHub
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
