import { request } from './http.js'

export function getProjects() {
  return request('/api/projects')
}

export function getProject(id) {
  return request(`/api/projects/${id}`)
}

export function createProject(payload) {
  return request('/api/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProject(id, payload) {
  return request(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteProject(id) {
  return request(`/api/projects/${id}`, { method: 'DELETE' })
}

export function createMilestone(projectId, payload) {
  return request(`/api/projects/${projectId}/milestones`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateMilestone(projectId, mid, payload) {
  return request(`/api/projects/${projectId}/milestones/${mid}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteMilestone(projectId, mid) {
  return request(`/api/projects/${projectId}/milestones/${mid}`, { method: 'DELETE' })
}

export function createUpdate(projectId, content) {
  return request(`/api/projects/${projectId}/updates`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

export function deleteUpdate(projectId, uid) {
  return request(`/api/projects/${projectId}/updates/${uid}`, { method: 'DELETE' })
}
