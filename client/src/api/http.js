import { getToken, clearAuth } from '../utils/auth.js'

export async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(url, { ...options, headers })
  let data = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }
  if (!res.ok) {
    if (res.status === 401) {
      clearAuth()
      window.dispatchEvent(new Event('auth-changed'))
    }
    throw new Error(data.error || `请求失败（${res.status}）`)
  }
  return data
}
