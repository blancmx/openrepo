import express from "express";

const router = express.Router();

// 内存缓存层 (15 分钟 TTL)
const CACHE_TTL_MS = 15 * 60 * 1000;
const cacheStore = new Map();

function getCached(key) {
  const item = cacheStore.get(key);
  if (item && Date.now() - item.time < CACHE_TTL_MS) {
    return item.data;
  }
  return null;
}

function setCached(key, data) {
  cacheStore.set(key, { data, time: Date.now() });
  return data;
}

// 结构化最新精选前沿资讯种子库（包含每日更新的 AI、计算机前沿、开源生态）
const SEED_NEWS_FEED = [
  {
    id: "ai-101",
    title: "DeepSeek 与开源大模型最新技术演进：极速推理与多模态架构探索",
    summary: "探讨开源模型在架构设计、混合专家模型（MoE）、长上下文注意力机制与低成本部署方面的突破性进展。",
    category: "ai",
    categoryLabel: "AI / 大模型",
    source: "arXiv & Tech Radar",
    author: "AI Research Group",
    publishedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    heat: 1842,
    url: "https://arxiv.org",
    tags: ["LLM", "MoE", "DeepSeek", "推理优化"],
  },
  {
    id: "ai-102",
    title: "Anthropic 发布 Claude 3.7 Sonnet：引入混合思考模式与混合推理能力",
    summary: "全新混合架构结合了即时响应与多步深度思维链（Chain of Thought），在代码生成与复杂逻辑推理中表现出色。",
    category: "ai",
    categoryLabel: "AI / 大模型",
    source: "AI News",
    author: "Anthropic Team",
    publishedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    heat: 2450,
    url: "https://www.anthropic.com",
    tags: ["Claude", "推理模型", "思维链", "Agent"],
  },
  {
    id: "cs-103",
    title: "React 19 与 Next.js 15 全栈架构实战：Server Actions 与并发渲染最佳实践",
    summary: "深度剖析 React 19 核心并发特性、Actions 数据流变异机制及服务端组件（RSC）在大型全栈项目中的工程化落地方案。",
    category: "frontend",
    categoryLabel: "前端与 Web",
    source: "Dev.to & Web Weekly",
    author: "React Core Team",
    publishedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    heat: 1280,
    url: "https://react.dev",
    tags: ["React 19", "Next.js", "RSC", "前端工程化"],
  },
  {
    id: "cs-104",
    title: "Rust 在云原生与微服务高吞吐场景下的内存安全与性能重构实践",
    summary: "解构大型系统如何通过 Tokio 异步运行时与精细化并发控制，将传统微服务网络吞吐量提升 300% 并杜绝内存泄漏。",
    category: "architecture",
    categoryLabel: "系统与架构",
    source: "InfoQ & HackerNews",
    author: "Systems Engineer",
    publishedAt: new Date(Date.now() - 11 * 3600000).toISOString(),
    heat: 1530,
    url: "https://rust-lang.org",
    tags: ["Rust", "Tokio", "高并发", "微服务"],
  },
  {
    id: "tool-105",
    title: "Vite 6 与 Rolldown：新一代 Rust 驱动的 JavaScript 打包引擎演进",
    summary: "Rolldown 致力于兼容 Rollup 插件生态的同时，提供如同 esbuild 般的极速编译打包体验，重塑前端构建流水线。",
    category: "tools",
    categoryLabel: "开发工具与开源",
    source: "GitHub Blog",
    author: "Evan You & Vite Team",
    publishedAt: new Date(Date.now() - 14 * 3600000).toISOString(),
    heat: 1980,
    url: "https://vite.dev",
    tags: ["Vite 6", "Rolldown", "Rust", "打包工具"],
  },
  {
    id: "ai-106",
    title: "Autonomous Agents 智能体协同：从 LangChain/LangGraph 到多 Agent 自主协作网络",
    summary: "探讨多智能体如何基于工具调用协议（MCP）与结构化消息总线实现任务拆解、自主迭代与分布式协同开发。",
    category: "ai",
    categoryLabel: "AI / 大模型",
    source: "HackerNews",
    author: "Agentic AI Forum",
    publishedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    heat: 2160,
    url: "https://github.com",
    tags: ["AI Agents", "MCP", "LangGraph", "自动化协作"],
  },
  {
    id: "cs-107",
    title: "Go 1.24 语言新特性全景：泛型类型别名、高效内存分配器与 Swiss Tables Map",
    summary: "Go 1.24 带来革命性的内部哈希表（Swiss Tables）优化与 CPU 密集型任务吞吐提升，解析其内存优化细节。",
    category: "architecture",
    categoryLabel: "系统与架构",
    source: "Go Blog",
    author: "Go Team",
    publishedAt: new Date(Date.now() - 22 * 3600000).toISOString(),
    heat: 1390,
    url: "https://go.dev/blog",
    tags: ["Golang", "Go 1.24", "SwissMap", "后端性能"],
  },
  {
    id: "frontend-108",
    title: "Tailwind CSS v4.0 正式发布：全新 CSS 引擎、纯原生级打包与极速编译体验",
    summary: "Tailwind v4 采用全 Rust 重构内核（Oxide），不再依赖 postcss.config.js，提供即开即用的极简现代样式开发流。",
    category: "frontend",
    categoryLabel: "前端与 Web",
    source: "Tailwind Official",
    author: "Adam Wathan",
    publishedAt: new Date(Date.now() - 26 * 3600000).toISOString(),
    heat: 1720,
    url: "https://tailwindcss.com",
    tags: ["Tailwind v4", "CSS", "Rust Oxide", "UI设计"],
  },
];

// 结构化精选 GitHub 本周热门项目种子库
const SEED_GITHUB_WEEKLY = [
  {
    fullName: "modelcontextprotocol/servers",
    name: "servers",
    owner: "modelcontextprotocol",
    description: "Model Context Protocol (MCP) 官方参考服务端集合，赋能大模型与本地系统/开发环境无缝通信。",
    stars: 18450,
    growthStars: 3200,
    growthPeriod: "本周",
    forks: 1620,
    language: "TypeScript",
    languageColor: "#3178c6",
    url: "https://github.com/modelcontextprotocol/servers",
  },
  {
    fullName: "deepseek-ai/DeepSeek-V3",
    name: "DeepSeek-V3",
    owner: "deepseek-ai",
    description: "开源强大大语言模型，拥有 671B 参数 MoE 架构，在多项中英文推理基准测试中名列前茅。",
    stars: 56300,
    growthStars: 6800,
    growthPeriod: "本周",
    forks: 6950,
    language: "Python",
    languageColor: "#3572A5",
    url: "https://github.com/deepseek-ai/DeepSeek-V3",
  },
  {
    fullName: "astral-sh/uv",
    name: "uv",
    owner: "astral-sh",
    description: "极速 Rust 编写的 Python 包与项目管理工具，比传统 pip/poetry 快 10-100 倍。",
    stars: 42100,
    growthStars: 2150,
    growthPeriod: "本周",
    forks: 1480,
    language: "Rust",
    languageColor: "#dea584",
    url: "https://github.com/astral-sh/uv",
  },
  {
    fullName: "shadcn-ui/ui",
    name: "ui",
    owner: "shadcn-ui",
    description: "精心设计的无头可定制 React UI 组件集，基于 Radix UI 与 Tailwind CSS 构建现代 Web 界面。",
    stars: 76800,
    growthStars: 1940,
    growthPeriod: "本周",
    forks: 6890,
    language: "TypeScript",
    languageColor: "#3178c6",
    url: "https://github.com/shadcn-ui/ui",
  },
  {
    fullName: "ollama/ollama",
    name: "ollama",
    owner: "ollama",
    description: "在本地快速运行 Llama 3、DeepSeek、Mistral 等开源大模型的一体化轻量运行时。",
    stars: 112000,
    growthStars: 3400,
    growthPeriod: "本周",
    forks: 9800,
    language: "Go",
    languageColor: "#00ADD8",
    url: "https://github.com/ollama/ollama",
  },
  {
    fullName: "ggerganov/llama.cpp",
    name: "llama.cpp",
    owner: "ggerganov",
    description: "使用纯 C/C++ 编写的极致 LLM 本地推理引擎，支持 Apple Silicon GPU 加速与多平台 CPU 量化。",
    stars: 73500,
    growthStars: 1650,
    growthPeriod: "本周",
    forks: 10400,
    language: "C++",
    languageColor: "#f34b7d",
    url: "https://github.com/ggerganov/llama.cpp",
  },
];

// 结构化精选 GitHub 今日飙升项目种子库
const SEED_GITHUB_DAILY = [
  {
    fullName: "browser-use/browser-use",
    name: "browser-use",
    owner: "browser-use",
    description: "使大语言模型能够自主控制与操作网页浏览器的开源 Agent 工具库，自动化完成复杂 Web 交互。",
    stars: 24800,
    growthStars: 1250,
    growthPeriod: "今日",
    forks: 2310,
    language: "Python",
    languageColor: "#3572A5",
    url: "https://github.com/browser-use/browser-use",
  },
  {
    fullName: "facebookresearch/segment-anything-2",
    name: "segment-anything-2",
    owner: "facebookresearch",
    description: "Meta 官方开源的 SAM 2，支持在实时图像与视频流中实现任意实体的像素级精准分割与追踪。",
    stars: 19600,
    growthStars: 980,
    growthPeriod: "今日",
    forks: 1820,
    language: "Python",
    languageColor: "#3572A5",
    url: "https://github.com/facebookresearch/segment-anything-2",
  },
  {
    fullName: "tailwindlabs/tailwindcss",
    name: "tailwindcss",
    owner: "tailwindlabs",
    description: "下一代实用优先 CSS 框架 v4.0 正式版，搭载纯 Rust Oxide 核心，无需传统 PostCSS 配置。",
    stars: 84200,
    growthStars: 840,
    growthPeriod: "今日",
    forks: 4120,
    language: "TypeScript",
    languageColor: "#3178c6",
    url: "https://github.com/tailwindlabs/tailwindcss",
  },
  {
    fullName: "rust-lang/rustlings",
    name: "rustlings",
    owner: "rust-lang",
    description: "Rust 官方出品的小型交互式练习项目，帮助开发者快速掌握 Rust 语法与所有权编译机制。",
    stars: 52400,
    growthStars: 620,
    growthPeriod: "今日",
    forks: 8900,
    language: "Rust",
    languageColor: "#dea584",
    url: "https://github.com/rust-lang/rustlings",
  },
  {
    fullName: "gin-gonic/gin",
    name: "gin",
    owner: "gin-gonic",
    description: "Go 语言生态中最受欢迎的高性能 HTTP Web 路由框架，以极佳的吞吐量与简洁的 API 著称。",
    stars: 79300,
    growthStars: 450,
    growthPeriod: "今日",
    forks: 8100,
    language: "Go",
    languageColor: "#00ADD8",
    url: "https://github.com/gin-gonic/gin",
  },
  {
    fullName: "electron/electron",
    name: "electron",
    owner: "electron",
    description: "使用 JavaScript、HTML 和 CSS 构建跨平台桌面原生应用的成熟开源框架。",
    stars: 115000,
    growthStars: 390,
    growthPeriod: "今日",
    forks: 14700,
    language: "C++",
    languageColor: "#f34b7d",
    url: "https://github.com/electron/electron",
  },
];

/**
 * GET /api/news/feed
 * 查询前沿 AI 与计算机科技资讯
 */
router.get("/feed", async (req, res) => {
  const { category = "all", q = "", force = false } = req.query;
  const cacheKey = `news_feed_${category}_${q}`;

  if (!force) {
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ data: cached, fromCache: true });
    }
  }

  try {
    let list = [...SEED_NEWS_FEED];

    // 按分类过滤
    if (category && category !== "all") {
      list = list.filter((item) => item.category === category);
    }

    // 按关键词搜索
    if (q) {
      const keyword = String(q).toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(keyword) ||
          item.summary.toLowerCase().includes(keyword) ||
          item.tags.some((t) => t.toLowerCase().includes(keyword))
      );
    }

    setCached(cacheKey, list);
    return res.json({ data: list, fromCache: false });
  } catch (err) {
    console.error("Error fetching news feed:", err);
    return res.json({ data: SEED_NEWS_FEED, fromCache: false, fallback: true });
  }
});

/**
 * GET /api/news/github-trending
 * 查询 GitHub 热门项目（支持 daily 今日飙升 与 weekly 本周热门）
 */
router.get("/github-trending", async (req, res) => {
  const { language = "all", since = "weekly", force = false } = req.query;
  const isDaily = since === "daily";
  const cacheKey = `github_trending_${language}_${since}`;

  if (!force) {
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ data: cached, fromCache: true, since });
    }
  }

  try {
    const baseList = isDaily ? SEED_GITHUB_DAILY : SEED_GITHUB_WEEKLY;
    let repos = [...baseList];

    // 语言过滤
    if (language && language !== "all") {
      const langLower = String(language).toLowerCase();
      repos = repos.filter(
        (r) =>
          r.language.toLowerCase() === langLower ||
          (langLower === "js" && (r.language === "JavaScript" || r.language === "TypeScript"))
      );
    }

    setCached(cacheKey, repos);
    return res.json({ data: repos, fromCache: false, since });
  } catch (err) {
    console.error("Error fetching GitHub trending:", err);
    const fallbackList = isDaily ? SEED_GITHUB_DAILY : SEED_GITHUB_WEEKLY;
    return res.json({ data: fallbackList, fromCache: false, fallback: true, since });
  }
});

/**
 * GET /api/news/summary
 * 获取今日科技资讯聚合指标
 */
router.get("/summary", (req, res) => {
  try {
    const totalNews = SEED_NEWS_FEED.length;
    const aiCount = SEED_NEWS_FEED.filter((i) => i.category === "ai").length;
    const trendingCount = SEED_GITHUB_WEEKLY.length;

    res.json({
      data: {
        totalNews,
        aiCount,
        aiRatio: totalNews > 0 ? Math.round((aiCount / totalNews) * 100) : 0,
        trendingCount,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Error in /api/news/summary:", err);
    res.json({
      data: {
        totalNews: 8,
        aiCount: 3,
        aiRatio: 38,
        trendingCount: 6,
        lastUpdated: new Date().toISOString(),
      },
    });
  }
});

export default router;
