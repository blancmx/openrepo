import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getProfile, updateProfile, changePassword } from '../api/auth.js'
import { clearAuth } from '../utils/auth.js'
import {
  IconFileText,
  IconFolder,
  IconUser,
  IconLock,
  IconShield,
  IconSun,
  IconMoon,
} from '../components/Icons.jsx'
import { getInitialTheme, applyTheme } from '../utils/theme.js'

function formatDate(str) {
  if (!str) return ''
  return str.replace('T', ' ').slice(0, 16)
}

export default function ProfilePage({ auth, onLogout }) {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' | 'profile' | 'security'
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 界面外观主题状态
  const [currentTheme, setCurrentTheme] = useState(getInitialTheme)

  useEffect(() => {
    function onThemeChange(e) {
      setCurrentTheme(e.detail)
    }
    window.addEventListener('theme-changed', onThemeChange)
    return () => window.removeEventListener('theme-changed', onThemeChange)
  }, [])

  function handleThemeChange(targetTheme) {
    applyTheme(targetTheme)
    setCurrentTheme(targetTheme)
  }

  // 资料表单
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' })

  // 密码表单
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' })

  useEffect(() => {
    if (!auth) {
      navigate('/login', { state: { from: '/profile' }, replace: true })
      return
    }

    let isMounted = true
    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const res = await getProfile()
        if (isMounted) {
          setProfileData(res)
          setEmail(res.user?.email || '')
          setBio(res.user?.bio || '')
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || '加载个人数据失败')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [auth, navigate])

  if (!auth) return null

  function handleLogout() {
    clearAuth()
    if (onLogout) onLogout()
    navigate('/')
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg({ type: '', text: '' })

    const emailTrim = email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (emailTrim && !emailRegex.test(emailTrim)) {
      setProfileMsg({ type: 'error', text: '邮箱格式不正确' })
      setProfileSaving(false)
      return
    }

    try {
      const res = await updateProfile({ email: emailTrim, bio: bio.trim() })
      setProfileMsg({ type: 'success', text: '个人资料保存成功！' })
      if (res.user) {
        setProfileData((prev) => (prev ? { ...prev, user: res.user } : prev))
      }
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || '保存失败，请稍后重试' })
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPasswordMsg({ type: '', text: '' })

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: '请完整填写所有密码字段' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: '新密码长度至少需要 6 位' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: '两次输入的新密码不一致' })
      return
    }

    setPasswordSaving(true)
    try {
      await changePassword({ oldPassword, newPassword })
      setPasswordMsg({
        type: 'success',
        text: '密码修改成功！请妥善保管新密码。',
      })
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message || '修改密码失败' })
    } finally {
      setPasswordSaving(false)
    }
  }

  const user = profileData?.user || {
    username: auth.username,
    role: auth.role,
    email: '',
    bio: '',
  }
  const stats = profileData?.stats || {
    articleCount: 0,
    wordCount: 0,
    projectCount: 0,
    completedProjectCount: 0,
    tagCount: 0,
    recentArticles: [],
    recentProjects: [],
  }

  const completionRate =
    stats.projectCount > 0
      ? Math.round((stats.completedProjectCount / stats.projectCount) * 100)
      : 0

  const userInitial = (user.username || 'U').slice(0, 1).toUpperCase()

  return (
    <div className="profile-container">
      {/* 顶部个人卡片 */}
      <section className="profile-hero-card">
        <div className="profile-hero-main">
          <div className="profile-avatar-badge" aria-label="用户头像">
            <span className="profile-avatar-text">{userInitial}</span>
          </div>
          <div className="profile-hero-info">
            <div className="profile-title-row">
              <h1 className="profile-user-name">{user.username}</h1>
              <span
                className={`status-badge ${
                  user.role === 'admin' ? 'status-developing' : 'status-done'
                }`}
              >
                {user.role === 'admin' ? '博主 · Admin' : '认证读者 · User'}
              </span>
            </div>
            <p className="profile-bio-text">
              {user.bio || (
                <span className="text-muted">这个人很低调，还没有填写个性签名...</span>
              )}
            </p>
            <div className="profile-meta-chips">
              <span className="profile-meta-item">
                <svg viewBox="0 0 24 24" className="meta-icon">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                {user.email || '未绑定邮箱'}
              </span>
              {user.created_at && (
                <span className="profile-meta-item">
                  <svg viewBox="0 0 24 24" className="meta-icon">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  注册于 {formatDate(user.created_at).slice(0, 10)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-hero-actions">
          <button
            type="button"
            className="btn btn-outline profile-theme-quick-btn"
            onClick={() => handleThemeChange(currentTheme === 'dark' ? 'light' : 'dark')}
            title={currentTheme === 'dark' ? '切换为浅色模式' : '切换为深色模式'}
          >
            {currentTheme === 'dark' ? <IconSun className="btn-icon" /> : <IconMoon className="btn-icon" />}
            <span>{currentTheme === 'dark' ? '浅色模式' : '深色模式'}</span>
          </button>
          <button type="button" className="btn btn-outline" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </section>

      {/* 导航 Tab 切换 */}
      <div className="profile-tabs-nav">
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <svg viewBox="0 0 24 24" className="tab-icon">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          {user.role === 'admin' ? '创作工作台' : '概览'}
        </button>
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <svg viewBox="0 0 24 24" className="tab-icon">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          个人资料
        </button>
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <svg viewBox="0 0 24 24" className="tab-icon">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          安全设置
        </button>
      </div>

      {loading && <div className="loading-state">正在加载个人数据...</div>}
      {error && <div className="error-banner">{error}</div>}

      {!loading && (
        <div className="profile-tab-content">
          {/* TAB 1: 工作台 / 概览 */}
          {activeTab === 'dashboard' && (
            <div className="profile-dashboard-view">
              {user.role === 'admin' ? (
                <>
                  {/* 数据指标卡片 */}
                  <div className="stat-cards-grid">
                    <div className="stat-card">
                      <div className="stat-card-header">
                        <span className="stat-label">已发布文章</span>
                        <span className="stat-badge-tag">{stats.tagCount} 个标签</span>
                      </div>
                      <div className="stat-value">{stats.articleCount}</div>
                      <div className="stat-desc">在博客沉淀的技术与思考</div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-card-header">
                        <span className="stat-label">创作总字数</span>
                        <span className="stat-badge-tag">Markdown</span>
                      </div>
                      <div className="stat-value">
                        {stats.wordCount.toLocaleString()}
                      </div>
                      <div className="stat-desc">全站文章正文累计字数</div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-card-header">
                        <span className="stat-label">个人与开源项目</span>
                        <span className="stat-badge-tag">
                          {stats.completedProjectCount} 个已完成
                        </span>
                      </div>
                      <div className="stat-value">{stats.projectCount}</div>
                      <div className="stat-desc">持续迭代的代码工程</div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-card-header">
                        <span className="stat-label">项目整体达成率</span>
                        <span className="stat-badge-tag">进度统计</span>
                      </div>
                      <div className="stat-value">{completionRate}%</div>
                      <div className="stat-desc">
                        {stats.completedProjectCount}/{stats.projectCount} 个项目顺利收官
                      </div>
                    </div>
                  </div>

                  {/* 近期文章与项目两栏动态 */}
                  <div className="profile-recent-grid">
                    <div className="profile-recent-card">
                      <div className="recent-card-header">
                        <h3 className="section-title">近期文章</h3>
                        <Link to="/" className="link-btn">
                          查看全部 →
                        </Link>
                      </div>
                      {stats.recentArticles?.length === 0 ? (
                        <div className="empty-hint">暂无已发布文章</div>
                      ) : (
                        <ul className="profile-recent-list">
                          {stats.recentArticles.map((art) => (
                            <li key={art.id} className="profile-recent-item">
                              <Link
                                to={`/articles/${art.id}`}
                                className="profile-recent-link"
                              >
                                <span className="profile-recent-title">{art.title}</span>
                                <span className="profile-recent-date">
                                  {formatDate(art.created_at).slice(0, 10)}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="profile-recent-card">
                      <div className="recent-card-header">
                        <h3 className="section-title">近期项目</h3>
                        <Link to="/projects" className="link-btn">
                          查看全部 →
                        </Link>
                      </div>
                      {stats.recentProjects?.length === 0 ? (
                        <div className="empty-hint">暂无项目记录</div>
                      ) : (
                        <ul className="profile-recent-list">
                          {stats.recentProjects.map((p) => (
                            <li key={p.id} className="profile-recent-item">
                              <Link
                                to={`/projects/${p.id}`}
                                className="profile-recent-link project-recent-link"
                              >
                                <div className="project-link-header">
                                  <span className="profile-recent-title">{p.name}</span>
                                  <span
                                    className={`status-badge ${
                                      p.status === '已完成'
                                        ? 'status-done'
                                        : p.status === '开发中'
                                          ? 'status-developing'
                                          : 'status-paused'
                                    }`}
                                  >
                                    {p.status}
                                  </span>
                                </div>
                                <div className="profile-mini-progress">
                                  <div
                                    className="profile-mini-progress-fill"
                                    style={{ width: `${p.progress || 0}%` }}
                                  />
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* 普通读者视图 */
                <div className="reader-welcome-box">
                  <div className="reader-welcome-header">
                    <h2>欢迎来到 Quill 个人博客与项目空间</h2>
                    <p>
                      您当前登录身份为<strong>认证读者</strong>
                      。您可以自由浏览博主发布的所有深度技术博客，并随时跟进开源项目的开发进度与演进日志。
                    </p>
                  </div>
                  <div className="reader-actions">
                    <Link to="/" className="btn btn-primary">
                      <IconFileText className="btn-icon" /> 浏览全部博文
                    </Link>
                    <Link to="/projects" className="btn">
                      <IconFolder className="btn-icon" /> 探索项目看板
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 个人资料 */}
          {activeTab === 'profile' && (
            <div className="profile-tab-pane-grid">
              {/* 左侧主要表单 */}
              <div className="profile-card-box">
                <div className="pd-card-header">
                  <h3 className="section-title">
                    <IconUser className="card-header-icon" /> 修改基本资料
                  </h3>
                </div>

                {profileMsg.text && (
                  <div
                    className={
                      profileMsg.type === 'error' ? 'error-banner' : 'success-banner'
                    }
                  >
                    {profileMsg.text}
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="profile-compact-form">
                  <div className="form-row-2">
                    <div className="field">
                      <label>登录用户名</label>
                      <input type="text" value={user.username} disabled className="input-disabled" />
                    </div>
                    <div className="field">
                      <label>身份角色</label>
                      <input
                        type="text"
                        value={user.role === 'admin' ? '博主（Admin）' : '认证读者（User）'}
                        disabled
                        className="input-disabled"
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="user-email">联系邮箱</label>
                    <input
                      id="user-email"
                      type="email"
                      placeholder="例如：yourname@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <div className="field-label-row">
                      <label htmlFor="user-bio">个性签名 / 个人简介</label>
                      <span className="char-count">{bio.length}/200</span>
                    </div>
                    <textarea
                      id="user-bio"
                      rows={2}
                      maxLength={200}
                      placeholder="写一句座右铭或简短的自我介绍..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label>界面外观偏好</label>
                    <div className="profile-theme-selector">
                      <button
                        type="button"
                        className={`theme-option-btn${currentTheme === 'light' ? ' is-active' : ''}`}
                        onClick={() => handleThemeChange('light')}
                      >
                        <IconSun className="theme-opt-icon" />
                        <div className="theme-opt-info">
                          <span className="theme-opt-title">浅色模式</span>
                          <span className="theme-opt-sub">清爽纸质白</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className={`theme-option-btn${currentTheme === 'dark' ? ' is-active' : ''}`}
                        onClick={() => handleThemeChange('dark')}
                      >
                        <IconMoon className="theme-opt-icon" />
                        <div className="theme-opt-info">
                          <span className="theme-opt-title">深色模式</span>
                          <span className="theme-opt-sub">沉浸护眼黑</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="form-submit-row">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={profileSaving}
                    >
                      {profileSaving ? '正在保存...' : '保存资料'}
                    </button>
                  </div>
                </form>
              </div>

              {/* 右侧信息侧栏 */}
              <div className="profile-side-info-card">
                <div className="pd-card-header">
                  <h3 className="section-title">
                    <IconShield className="card-header-icon" /> 账户资料概览
                  </h3>
                </div>
                <div className="profile-info-list">
                  <div className="profile-info-item">
                    <span className="info-item-label">账户唯一 ID</span>
                    <span className="info-item-value font-mono">#{user.id}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="info-item-label">注册时间</span>
                    <span className="info-item-value">{formatDate(user.created_at)}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="info-item-label">邮箱绑定状态</span>
                    <span className="info-item-value">
                      {user.email ? <span className="text-success">✓ 已绑定</span> : <span className="text-muted">未绑定</span>}
                    </span>
                  </div>
                  <div className="profile-info-item">
                    <span className="info-item-label">个性签名状态</span>
                    <span className="info-item-value">
                      {user.bio ? <span className="text-success">✓ 已设置</span> : <span className="text-muted">未设置</span>}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 安全设置 */}
          {activeTab === 'security' && (
            <div className="profile-tab-pane-grid">
              {/* 左侧密码修改表单 */}
              <div className="profile-card-box">
                <div className="pd-card-header">
                  <h3 className="section-title">
                    <IconLock className="card-header-icon" /> 修改登录密码
                  </h3>
                </div>

                {passwordMsg.text && (
                  <div
                    className={
                      passwordMsg.type === 'error' ? 'error-banner' : 'success-banner'
                    }
                  >
                    {passwordMsg.text}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="profile-compact-form">
                  <div className="field">
                    <label htmlFor="old-password">当前原密码</label>
                    <input
                      id="old-password"
                      type="password"
                      placeholder="请输入当前正在使用的密码"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="field">
                      <label htmlFor="new-password">新密码</label>
                      <input
                        id="new-password"
                        type="password"
                        placeholder="新密码（至少 6 位）"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="confirm-password">确认新密码</label>
                      <input
                        id="confirm-password"
                        type="password"
                        placeholder="再次输入新密码"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-submit-row">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={passwordSaving}
                    >
                      {passwordSaving ? '正在提交...' : '确认修改密码'}
                    </button>
                  </div>
                </form>
              </div>

              {/* 右侧安全指引与防护卡片 */}
              <div className="profile-side-info-card">
                <div className="pd-card-header">
                  <h3 className="section-title">
                    <IconShield className="card-header-icon" /> 账户安全指引
                  </h3>
                </div>
                <div className="security-guidance-content">
                  <div className="security-guide-item">
                    <strong>定期更换强密码</strong>
                    <p>推荐混合字母、数字与符号组合，长度至少 6 位以上。</p>
                  </div>
                  <div className="security-guide-item">
                    <strong>避免多平台重复</strong>
                    <p>切勿在其他网站使用相同密码，有效防御撞库风险。</p>
                  </div>
                  <div className="security-guide-item">
                    <strong>即时生效规则</strong>
                    <p>修改成功后原密码立即作废，下次登录请使用新密码。</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
