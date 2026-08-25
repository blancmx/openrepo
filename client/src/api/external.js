const CACHE_TTL = 10 * 60 * 1000
const cache = new Map()

const FALLBACK_GITHUB = [
  {
    fullName: 'modelcontextprotocol/servers',
    description: 'Model Context Protocol (MCP) 官方参考服务端集合，赋能大模型与本地系统无缝通信。',
    stars: 18450,
    language: 'TypeScript',
    languageColor: '#3178c6',
    url: 'https://github.com/modelcontextprotocol/servers',
  },
  {
    fullName: 'deepseek-ai/DeepSeek-V3',
    description: '开源强大大语言模型，拥有 671B 参数 MoE 架构，在多项推理基准中名列前茅。',
    stars: 56300,
    language: 'Python',
    languageColor: '#3572A5',
    url: 'https://github.com/deepseek-ai/DeepSeek-V3',
  },
  {
    fullName: 'astral-sh/uv',
    description: '极速 Rust 编写的 Python 包与项目管理工具，比传统 pip 快 10-100 倍。',
    stars: 42100,
    language: 'Rust',
    languageColor: '#dea584',
    url: 'https://github.com/astral-sh/uv',
  },
  {
    fullName: 'shadcn-ui/ui',
    description: '精心设计的无头可定制 React UI 组件集，基于 Radix UI 与 Tailwind 构建。',
    stars: 76800,
    language: 'TypeScript',
    languageColor: '#3178c6',
    url: 'https://github.com/shadcn-ui/ui',
  },
  {
    fullName: 'ollama/ollama',
    description: '在本地快速运行 Llama 3、DeepSeek 等大模型的一体化轻量运行时。',
    stars: 112000,
    language: 'Go',
    languageColor: '#00ADD8',
    url: 'https://github.com/ollama/ollama',
  },
  {
    fullName: 'browser-use/browser-use',
    description: '使大语言模型能够自主控制与操作网页浏览器的开源 Agent 工具库。',
    stars: 24800,
    language: 'Python',
    languageColor: '#3572A5',
    url: 'https://github.com/browser-use/browser-use',
  },
]

const FALLBACK_DEVTO = [
  {
    id: 'f-1',
    title: '7 Productivity Tips That Sound Wrong (But Work Wonders)',
    url: 'https://dev.to',
    author: 'Alex Mercer',
    reactions: 163,
    tags: 'productivity, career, webdev',
    publishedAt: '2026-08-22',
  },
  {
    id: 'f-2',
    title: 'Greatness Is Forged by Limitation: How to Design Under Constraints',
    url: 'https://dev.to',
    author: 'Elena Rostova',
    reactions: 76,
    tags: 'design, architecture',
    publishedAt: '2026-08-21',
  },
  {
    id: 'f-3',
    title: 'My First Engineering Job Is Teaching Me Stuff Bootcamps Never Mentioned',
    url: 'https://dev.to',
    author: 'Devon Vance',
    reactions: 67,
    tags: 'career, beginners',
    publishedAt: '2026-08-20',
  },
  {
    id: 'f-4',
    title: 'State Management in Modern Front-End Web Development in 2026',
    url: 'https://dev.to',
    author: 'Sarah Chen',
    reactions: 94,
    tags: 'react, typescript, state',
    publishedAt: '2026-08-19',
  },
  {
    id: 'f-5',
    title: 'Building Agentic Workflows with Model Context Protocol (MCP)',
    url: 'https://dev.to',
    author: 'Liam Davies',
    reactions: 88,
    tags: 'ai, mcp, agents',
    publishedAt: '2026-08-18',
  },
  {
    id: 'f-6',
    title: 'Rust for JavaScript Developers: A Practical Cheat Sheet',
    url: 'https://dev.to',
    author: 'Kenji Sato',
    reactions: 112,
    tags: 'rust, javascript, backend',
    publishedAt: '2026-08-17',
  },
]

function getCached(key) {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.at < CACHE_TTL) {
    return entry.data
  }
  return null
}

function setCached(key, data) {
  cache.set(key, { data, at: Date.now() })
  return data
}

export function formatNumber(n) {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1)}k`
  }
  return String(n)
}

export async function getGithubHot(force = false) {
  if (!force) {
    const cached = getCached('github')
    if (cached) return cached
  }
  try {
    const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    const url = `https://api.github.com/search/repositories?q=created:>=${since}&sort=stars&order=desc&per_page=6`
    const res = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) {
      throw new Error(`GitHub API HTTP ${res.status}`)
    }
    const json = await res.json()
    const data = (json.items || []).slice(0, 6).map((repo) => ({
      fullName: repo.full_name,
      description: repo.description || '暂无简介',
      stars: repo.stargazers_count,
      language: repo.language || '',
      url: repo.html_url,
    }))
    if (data.length > 0) {
      return setCached('github', data)
    }
    return setCached('github', FALLBACK_GITHUB)
  } catch (err) {
    console.warn('GitHub search fetch failed, using fallback:', err.message)
    return setCached('github', FALLBACK_GITHUB)
  }
}

export async function getCommunityPosts(force = false) {
  if (!force) {
    const cached = getCached('devto')
    if (cached) return cached
  }
  try {
    const res = await fetch('https://dev.to/api/articles?top=7&per_page=6')
    if (!res.ok) {
      throw new Error(`Dev.to API HTTP ${res.status}`)
    }
    const json = await res.json()
    const data = json.slice(0, 6).map((post) => ({
      id: post.id,
      title: post.title,
      url: post.url,
      author: post.user?.name || '匿名',
      reactions: post.positive_reactions_count || 0,
      tags: typeof post.tags === 'string' ? post.tags : (post.tag_list || []).join(', '),
      publishedAt: (post.published_at || '').slice(0, 10),
    }))
    if (data.length > 0) {
      return setCached('devto', data)
    }
    return setCached('devto', FALLBACK_DEVTO)
  } catch (err) {
    console.warn('Dev.to articles fetch failed, using fallback:', err.message)
    return setCached('devto', FALLBACK_DEVTO)
  }
}
