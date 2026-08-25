import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { login, register, getCaptcha } from '../api/articles.js'
import { setAuth } from '../utils/auth.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('login')
  const [dir, setDir] = useState('none')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [email, setEmail] = useState('')
  const [captcha, setCaptcha] = useState({ captchaId: '', svg: '' })
  const [captchaInput, setCaptchaInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function loadCaptcha() {
    setCaptchaInput('')
    try {
      const c = await getCaptcha()
      setCaptcha({ captchaId: c.captchaId, svg: c.svg })
    } catch {
      setCaptcha({ captchaId: '', svg: '' })
    }
  }

  function switchMode(next) {
    setDir(next === 'register' ? 'from-right' : 'from-left')
    setMode(next)
    setError('')
    setConfirm('')
    setEmail('')
    setCaptchaInput('')
    if (next === 'register') {
      loadCaptcha()
    }
  }

  function validate() {
    if (!username.trim() || !password) return '请输入用户名和密码'
    if (mode === 'register') {
      if (username.trim().length < 2 || username.trim().length > 20) return '用户名需为 2-20 个字符'
      if (password.length < 6) return '密码至少 6 位'
      if (password !== confirm) return '两次输入的密码不一致'
      if (email.trim() && !EMAIL_RE.test(email.trim())) return '邮箱格式不正确'
    }
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const message = validate()
    if (message) {
      setError(message)
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const auth =
        mode === 'register'
          ? await register(
              username.trim(),
              password,
              email.trim(),
              captcha.captchaId,
              captchaInput.trim()
            )
          : await login(username.trim(), password)
      setAuth(auth)
      onLogin(auth)
      navigate(location.state?.from || '/')
    } catch (err) {
      setError(err.message)
      if (mode === 'register' && err.message.includes('验证码')) {
        loadCaptcha()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="auth-topbar">
          <Link to="/" className="back-btn">
            ← 返回首页
          </Link>
        </div>
        <div key={mode} className={`auth-panel ${dir}`}>
          <h1>{mode === 'login' ? '登录' : '注册'}</h1>
          <p className="login-hint">
            {mode === 'login' ? '欢迎回来，继续你的写作之旅。' : '创建账号，加入 Quill。'}
          </p>
          {error && <p className="status status-error">{error}</p>}
          <form onSubmit={handleSubmit}>
            <label className="field">
              <span>用户名</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </label>
            <label className="field">
              <span>密码</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </label>
            {mode === 'register' && (
              <label className="field">
                <span>确认密码</span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </label>
            )}
            {mode === 'register' && (
              <label className="field">
                <span>邮箱（可选）</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>
            )}
            {mode === 'register' && (
              <div className="field">
                <span>验证码</span>
                <div className="captcha-row">
                  <input
                    value={captchaInput}
                    maxLength={4}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    placeholder="输入字符"
                    autoComplete="off"
                  />
                  <div
                    className="captcha-img"
                    title="看不清？点击刷新"
                    onClick={loadCaptcha}
                    dangerouslySetInnerHTML={{ __html: captcha.svg }}
                  />
                  <button type="button" className="link-btn" onClick={loadCaptcha}>
                    刷新
                  </button>
                </div>
              </div>
            )}
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? '提交中...' : mode === 'login' ? '登录' : '注册并登录'}
            </button>
          </form>
          <p className="switch-mode">
            {mode === 'login' ? (
              <>
                还没有账号？<button type="button" onClick={() => switchMode('register')}>注册</button>
              </>
            ) : (
              <>
                已有账号？<button type="button" onClick={() => switchMode('login')}>去登录</button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
