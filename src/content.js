import { useEffect, useState } from 'react'

// Source of truth: the JSON committed to GitHub (public/content/*.json, served by raw.githubusercontent.com,
// so admin edits show up without redeploying; GitHub's CDN caches for a few minutes).
// Fallback: the copy deployed with the site at /content, so the page is never empty.
const REPO = import.meta.env.VITE_GITHUB_REPO || ''
const BRANCH = import.meta.env.VITE_GITHUB_BRANCH || 'main'
const RAW = REPO ? `https://raw.githubusercontent.com/${REPO}/${BRANCH}/public/content` : ''
const LOCAL = `${import.meta.env.BASE_URL}content`
const cache = {}

async function fromGitHub(name) {
  if (!RAW) return null
  try {
    const r = await fetch(`${RAW}/${name}.json`)
    if (!r.ok) return null
    const j = await r.json()
    return Array.isArray(j?.items) ? j.items : null
  } catch { return null }
}

async function fromLocal(name) {
  try {
    const r = await fetch(`${LOCAL}/${name}.json`, { cache: 'no-cache' })
    const j = r.ok ? await r.json() : null
    return Array.isArray(j?.items) ? j.items : []
  } catch { return [] }
}

async function load(name) {
  const rows = await fromGitHub(name)
  // An empty-but-successful response is valid (nothing published yet); only fall back on failure.
  return rows ?? fromLocal(name)
}

// Returns published items of a collection: 'coding' | 'design' | 'learning'.
export function useContent(name) {
  const [items, setItems] = useState(cache[name])
  useEffect(() => {
    if (cache[name]) return
    let alive = true
    load(name).then((i) => { cache[name] = i; if (alive) setItems(i) })
    return () => { alive = false }
  }, [name])
  return { items: (items || []).filter((i) => i.status !== 'draft'), loading: !items }
}

// Only http(s) links are ever rendered (blocks javascript: and data: URLs coming from content).
export function safeUrl(u) {
  try {
    const url = new URL(u)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch { return null }
}

// cover = { type: 'upload', src: 'uploads/x.webp' } | { type: 'url', src: 'https://...' } | null
export function mediaUrl(cover) {
  if (!cover || !cover.src) return null
  if (cover.type === 'url') return safeUrl(cover.src)
  if (cover.type === 'upload' && /^uploads\/[\w.\-]+$/.test(cover.src)) {
    return `${RAW || LOCAL}/${cover.src}`
  }
  return null
}
