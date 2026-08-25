import { request } from './http.js'

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

export function getProfile() {
  return request('/api/auth/me')
}

export function updateProfile(payload) {
  return request('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function changePassword(payload) {
  return request('/api/auth/password', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
