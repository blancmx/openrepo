import { request } from './http.js'

function toQueryString(params) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value)
  )
  return qs.toString()
}

export function getArticles(filters = {}) {
  const qs = toQueryString(filters)
  return request(`/api/articles${qs ? `?${qs}` : ''}`)
}

export function getArticle(id) {
  return request(`/api/articles/${id}`)
}

export function createArticle(payload) {
  return request('/api/articles', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateArticle(id, payload) {
  return request(`/api/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteArticle(id) {
  return request(`/api/articles/${id}`, { method: 'DELETE' })
}

export function login(username, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function getCaptcha() {
  return request('/api/auth/captcha')
}

export function register(username, password, email, captchaId, captcha) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, email, captchaId, captcha }),
  })
}
