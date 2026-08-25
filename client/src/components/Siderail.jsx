import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { IconSearch } from './Icons.jsx'

const icons = {
  home: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 11.5 12 5l7.5 6.5" />
      <path d="M6.5 10.5V19h11v-8.5" />
      <path d="M10 19v-4h4v4" />
    </svg>
  ),
  project: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="8" width="16" height="11" rx="2" />
      <path d="M9 8V6.5A2.5 2.5 0 0 1 11.5 4h1A2.5 2.5 0 0 1 15 6.5V8" />
      <path d="M4 12.5h16" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  ),
  news: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </svg>
  ),
  collapse: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <path d="M9.5 4.5v15" />
    </svg>
  ),
}

const COLLAPSED_KEY = 'rail_collapsed'

function RailLink({ to, label, end = false, icon }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `rail-link${isActive ? ' active' : ''}`}
      title={label}
    >
      {icons[icon]}
      <span>{label}</span>
    </NavLink>
  )
}

export default function Siderail() {
  const navigate = useNavigate()
  const location = useLocation()
  const searchInputRef = useRef(null)

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSED_KEY) !== '0'
  )

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')

  // 同步 URL 中的 ?q 参数
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q') || ''
    setSearchVal(q)
    if (q) {
      setSearchOpen(true)
    }
  }, [location.search])

  function setCollapsedState(next) {
    localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0')
    setCollapsed(next)
  }

  // 折叠态点击品牌 → 展开
  function handleBrandClick(e) {
    if (collapsed) {
      e.preventDefault()
      setCollapsedState(false)
    }
  }

  // 点击顶部搜索按钮（位于折叠按钮左侧）
  function handleSearchButtonClick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (collapsed) {
      setCollapsedState(false)
      setSearchOpen(true)
      setTimeout(() => searchInputRef.current?.focus(), 80)
    } else {
      setSearchOpen((prev) => !prev)
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }

  // 点击折叠按钮
  function handleCollapseClick(e) {
    e.preventDefault()
    e.stopPropagation()
    setCollapsedState(true)
  }

  // 提交搜索
  function handleSearchSubmit(e) {
    e.preventDefault()
    const query = searchVal.trim()
    if (query) {
      navigate(`/?q=${encodeURIComponent(query)}`)
    } else {
      navigate('/')
    }
  }

  // 清空搜索
  function handleClearSearch() {
    setSearchVal('')
    if (location.pathname === '/' && location.search.includes('q=')) {
      navigate('/')
    }
    searchInputRef.current?.focus()
  }

  // 折叠态点击空白区域 → 展开
  function handleRailClick(e) {
    if (collapsed && e.target === e.currentTarget) {
      setCollapsedState(false)
    }
  }

  return (
    <aside
      className={`siderail${collapsed ? '' : ' expanded'}`}
      onClick={handleRailClick}
    >
      {/* 顶部 Brand 区域：标题 + [搜索按钮 (在折叠按钮左侧)] + [折叠按钮] */}
      <div className="siderail-brand">
        <NavLink
          to="/"
          className="brand-link"
          title={collapsed ? '点击展开' : 'Quill'}
          onClick={handleBrandClick}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="brand-icon">
            <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
            <path d="M12.5 7.5c-2.6 3-3.4 5.4-.9 9" />
            <circle cx="15.6" cy="13.8" r="1.5" />
          </svg>
          <span className="brand-label">Quill</span>
        </NavLink>

        {/* 顶部右侧操作组：搜索按钮在折叠按钮左侧 */}
        <div className="brand-action-group">
          <button
            type="button"
            className={`brand-action-btn brand-search-btn${searchOpen ? ' active' : ''}`}
            onClick={handleSearchButtonClick}
            title={searchOpen ? '收起搜索' : '搜索文章'}
            aria-label="搜索文章"
          >
            <IconSearch className="brand-action-icon" />
          </button>
          <button
            type="button"
            className="brand-action-btn brand-toggle"
            onClick={handleCollapseClick}
            title="折叠侧边栏"
            aria-label="折叠侧边栏"
          >
            {icons.collapse}
          </button>
        </div>
      </div>

      {/* 搜索展开区域 */}
      {!collapsed && searchOpen && (
        <div className="siderail-search-wrap">
          <form onSubmit={handleSearchSubmit} className="siderail-search-form">
            <IconSearch className="siderail-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="siderail-search-input"
              placeholder="搜索文章..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              autoFocus
            />
            {searchVal && (
              <button
                type="button"
                className="siderail-search-clear"
                onClick={handleClearSearch}
                title="清空"
                aria-label="清空"
              >
                ✕
              </button>
            )}
          </form>
        </div>
      )}

      {/* 导航菜单项 */}
      <nav className="siderail-nav">
        <RailLink to="/" label="首页" end icon="home" />
        <RailLink to="/news" label="资讯" icon="news" />
        <RailLink to="/projects" label="项目" icon="project" />
      </nav>

      {/* 底部用户中心 */}
      <div className="siderail-bottom">
        <RailLink to="/profile" label="个人中心" icon="profile" />
      </div>
    </aside>
  )
}
