const BASE = '/api/news'

export async function getNewsFeed({ category = 'all', q = '', force = false } = {}) {
  const params = new URLSearchParams()
  if (category && category !== 'all') params.set('category', category)
  if (q) params.set('q', q)
  if (force) params.set('force', 'true')

  const url = params.toString() ? `${BASE}/feed?${params}` : `${BASE}/feed`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`获取科技资讯失败（${res.status}）`)
  }
  const json = await res.json()
  return json.data || []
}

export async function getGithubTrending({ language = 'all', since = 'weekly', force = false } = {}) {
  const params = new URLSearchParams()
  if (language && language !== 'all') params.set('language', language)
  if (since) params.set('since', since)
  if (force) params.set('force', 'true')

  const url = params.toString() ? `${BASE}/github-trending?${params}` : `${BASE}/github-trending`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`获取 GitHub 热门项目失败（${res.status}）`)
  }
  const json = await res.json()
  return json.data || []
}

export async function getNewsSummary(force = false) {
  const url = force ? `${BASE}/summary?force=true` : `${BASE}/summary`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`获取资讯概览失败（${res.status}）`)
  }
  const json = await res.json()
  return json.data || { totalNews: 0, aiCount: 0, aiRatio: 0, trendingCount: 0, lastUpdated: '' }
}
