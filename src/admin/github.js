// Admin storage = JSON files + images committed to the GitHub repo (public/content/*).
// Auth = a fine-grained Personal Access Token with "Contents: Read and write" on this one repo.
// The token stays in this browser only; being able to push to the repo is what makes someone the owner.
export const REPO = import.meta.env.VITE_GITHUB_REPO || '' // "username/portfolio"
export const BRANCH = import.meta.env.VITE_GITHUB_BRANCH || 'main'
export const ghConfigured = /^[\w.-]+\/[\w.-]+$/.test(REPO)

const TK = 'portfolio_admin_gh_token'
export const getToken = () => { try { return localStorage.getItem(TK) || '' } catch { return '' } }
export const setToken = (t) => { try { t ? localStorage.setItem(TK, t) : localStorage.removeItem(TK) } catch { /* private mode */ } }

async function gh(url, opts = {}) {
  const r = await fetch(url.startsWith('http') ? url : `https://api.github.com/repos/${REPO}${url}`, {
    ...opts,
    headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', Authorization: `Bearer ${getToken()}`, ...(opts.body ? { 'Content-Type': 'application/json' } : {}) },
  })
  if (!r.ok) {
    const j = await r.json().catch(() => ({}))
    const e = new Error(r.status === 401 ? 'Token tidak valid atau kedaluwarsa.' : j.message || `GitHub error ${r.status}`)
    e.status = r.status
    throw e
  }
  return r.status === 204 ? null : r.json()
}

// Returns { login, canPush }. canPush is the owner check.
export async function verify() {
  const [user, repo] = await Promise.all([gh('https://api.github.com/user'), gh('')])
  return { login: user.login, canPush: repo.permissions?.push === true }
}

const enc = (s) => { let b = ''; new TextEncoder().encode(s).forEach((c) => { b += String.fromCharCode(c) }); return btoa(b) }
const dec = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, '')), (c) => c.charCodeAt(0)))
const blobToB64 = (blob) => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.onerror = rej; fr.readAsDataURL(blob) })

const path = (name) => `public/content/${name}.json`
const ref = `?ref=${encodeURIComponent(BRANCH)}`

async function getFile(p) {
  try { const j = await gh(`/contents/${p}${ref}`); return { sha: j.sha, text: dec(j.content) } }
  catch (e) { if (e.status === 404) return { sha: null, text: null }; throw e }
}

export async function readCollection(name) {
  const f = await getFile(path(name))
  return f.text ? JSON.parse(f.text).items || [] : []
}

// Read-modify-write against the latest file, so edits from another tab or device are not overwritten.
export async function updateCollection(name, fn, message) {
  for (let attempt = 0; ; attempt++) {
    const f = await getFile(path(name))
    const items = fn(f.text ? JSON.parse(f.text).items || [] : [])
    try {
      await gh(`/contents/${path(name)}`, { method: 'PUT', body: JSON.stringify({
        message: message || `admin: update ${name}`, branch: BRANCH, sha: f.sha || undefined,
        content: enc(JSON.stringify({ version: 1, items }, null, 2) + '\n'),
      }) })
      return items
    } catch (e) { if (attempt < 2 && (e.status === 409 || e.status === 422)) continue; throw e }
  }
}

// src is like "uploads/x.webp" (kept as-is in the JSON), stored at public/content/uploads/x.webp
export async function uploadImage(src, blob) {
  await gh(`/contents/public/content/${src}`, { method: 'PUT', body: JSON.stringify({ message: `admin: upload ${src}`, branch: BRANCH, content: await blobToB64(blob) }) })
}
export async function deleteImage(src) {
  try {
    const j = await gh(`/contents/public/content/${src}${ref}`)
    await gh(`/contents/public/content/${src}`, { method: 'DELETE', body: JSON.stringify({ message: `admin: remove ${src}`, branch: BRANCH, sha: j.sha }) })
  } catch { /* already gone */ }
}
