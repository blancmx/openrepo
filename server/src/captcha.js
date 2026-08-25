import crypto from 'node:crypto'

// 去除易混字符 0/O、1/I/l，仅用这些更安全
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const CODE_LENGTH = 4
const TTL_MS = 5 * 60 * 1000

// 内存存储：captchaId -> { code, exp }。单进程 dev 环境足够
const store = new Map()

function randomCode() {
  let out = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += ALPHABET[crypto.randomInt(ALPHABET.length)]
  }
  return out
}

function escapeSvg(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function makeSvg(code) {
  const width = 120
  const height = 42
  const chars = code
    .split('')
    .map((ch, i) => {
      const x = 12 + i * 25
      const y = 26 + (Math.random() * 10 - 5)
      const rotate = Math.random() * 32 - 16
      const fontSize = 26 + Math.random() * 6
      return `<text x="${x}" y="${y.toFixed(1)}" font-family="monospace" font-size="${fontSize.toFixed(1)}" fill="#333" transform="rotate(${rotate.toFixed(1)} ${x} ${y.toFixed(1)})">${escapeSvg(ch)}</text>`
    })
    .join('')

  let noise = ''
  for (let i = 0; i < 4; i++) {
    const x1 = Math.random() * width
    const y1 = Math.random() * height
    const x2 = x1 + Math.random() * 40 - 20
    const y2 = y1 + Math.random() * 24 - 12
    noise += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#bbb" stroke-width="1"/>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#f5f5f5" rx="4"/>${noise}${chars}</svg>`
}

export function generateCaptcha() {
  const now = Date.now()
  for (const [id, v] of store) {
    if (v.exp < now) store.delete(id)
  }

  const code = randomCode()
  const captchaId = crypto.randomBytes(16).toString('hex')
  store.set(captchaId, { code, exp: now + TTL_MS })
  return { captchaId, svg: makeSvg(code) }
}

// 单次使用：无论对错，命中即消耗，防止重放
export function verifyCaptcha(captchaId, input) {
  if (!captchaId || typeof input !== 'string') return false
  const entry = store.get(captchaId)
  if (!entry) return false
  store.delete(captchaId)
  if (entry.exp < Date.now()) return false
  return entry.code === input.trim().toUpperCase()
}
