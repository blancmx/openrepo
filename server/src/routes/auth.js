import express from 'express'
import {
  findUserByCredentials,
  createUser,
  usernameExists,
  getUserById,
  updateUserProfile,
  updateUserPassword,
  getUserStats,
} from '../db.js'
import { signToken, requireAuth } from '../auth.js'
import { generateCaptcha, verifyCaptcha } from '../captcha.js'

const router = express.Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.get('/captcha', (req, res) => {
  res.json(generateCaptcha())
})

function validateRegisterInput(username, password, email) {
  if (!username || !password) return '请输入用户名和密码'
  if (username.length < 2 || username.length > 20) return '用户名需为 2-20 个字符'
  if (password.length < 6) return '密码至少 6 位'
  if (email && !EMAIL_RE.test(email)) return '邮箱格式不正确'
  return ''
}

router.post('/register', (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : ''
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : ''
  const captchaId = typeof req.body?.captchaId === 'string' ? req.body.captchaId : ''
  const captcha = typeof req.body?.captcha === 'string' ? req.body.captcha : ''

  const message = validateRegisterInput(username, password, email)
  if (message) {
    return res.status(400).json({ error: message })
  }
  if (usernameExists(username)) {
    return res.status(409).json({ error: '用户名已被占用' })
  }
  if (!verifyCaptcha(captchaId, captcha)) {
    return res.status(400).json({ error: '验证码错误，请刷新后重试' })
  }
  try {
    const user = createUser(username, password, email)
    res.status(201).json({ token: signToken(user), username: user.username, role: user.role })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '注册失败，请稍后再试' })
  }
})

router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' })
  }
  const user = findUserByCredentials(username.trim(), password)
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }
  res.json({ token: signToken(user), username: user.username, role: user.role })
})

// 获取当前登录用户完整信息与统计
router.get('/me', requireAuth, (req, res) => {
  const user = getUserById(req.user.id)
  if (!user) {
    return res.status(404).json({ error: '用户不存在' })
  }
  const stats = getUserStats()
  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email || '',
      bio: user.bio || '',
      created_at: user.created_at || '',
    },
    stats,
  })
})

// 更新个人资料（邮箱与个性签名）
router.put('/profile', requireAuth, (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : ''
  const bio = typeof req.body?.bio === 'string' ? req.body.bio.trim() : ''

  if (email && !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: '邮箱格式不正确' })
  }
  if (bio.length > 200) {
    return res.status(400).json({ error: '个性签名不能超过 200 个字' })
  }

  try {
    const updated = updateUserProfile(req.user.id, { email, bio })
    res.json({
      success: true,
      user: {
        id: updated.id,
        username: updated.username,
        role: updated.role,
        email: updated.email || '',
        bio: updated.bio || '',
        created_at: updated.created_at || '',
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '更新个人资料失败' })
  }
})

// 修改密码
router.put('/password', requireAuth, (req, res) => {
  const { oldPassword, newPassword } = req.body || {}
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '请输入原密码和新密码' })
  }
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: '新密码长度至少 6 位' })
  }
  if (oldPassword === newPassword) {
    return res.status(400).json({ error: '新密码不能与原密码相同' })
  }

  const result = updateUserPassword(req.user.id, oldPassword, newPassword)
  if (!result.success) {
    return res.status(400).json({ error: result.error || '原密码错误' })
  }

  res.json({ success: true, message: '密码修改成功' })
})

export default router
