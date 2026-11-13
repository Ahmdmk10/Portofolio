import { useEffect, useState } from 'react'
import { ExternalLink, LogOut } from 'lucide-react'
import { REPO, getToken, setToken, ghConfigured, verify } from './github.js'
import { COLLECTIONS } from './config.js'
import Manager from './Manager.jsx'

const Shell = ({ children }) => (
  <div className="min-h-screen grid place-items-center px-5">
    <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/[0.03] p-8">{children}</div>
  </div>
)

function Setup() {
  return (
    <Shell>
      <h1 className="text-2xl font-bold">GitHub belum diatur</h1>
      <p className="mt-3 text-sm text-white/60">Buat file <code className="font-mono text-emerald-300">.env.local</code> berisi <code className="font-mono">VITE_GITHUB_REPO=username/nama-repo</code> (opsional <code className="font-mono">VITE_GITHUB_BRANCH</code>, default main), lalu restart server.</p>
    </Shell>
  )
}

function Login({ onToken, err }) {
  const [t, setT] = useState('')
  return (
    <Shell>
      <p className="font-mono text-[11px] text-white/45">/admin</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Masuk</h1>
      <p className="mt-2 text-sm text-white/55">Tempel GitHub Personal Access Token (fine-grained) untuk repo <span className="font-mono text-white">{REPO}</span> dengan izin <em>Contents: Read and write</em>. Token hanya disimpan di browser ini.</p>
      <form onSubmit={(e) => { e.preventDefault(); onToken(t.trim()) }}>
        <input type="password" autoComplete="off" placeholder="github_pat_…" value={t} onChange={(e) => setT(e.target.value)}
          className="mt-5 w-full rounded-[5px] border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-400/60" />
        <button disabled={!t.trim()} className="mt-3 w-full rounded-full bg-white py-3 font-semibold text-black hover:bg-slate-200 disabled:opacity-40">Masuk</button>
      </form>
      <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer" className="mt-3 block text-center text-xs text-white/45 hover:text-white">Buat token di GitHub</a>
      {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
    </Shell>
  )
}

function Denied({ login, onOut }) {
  return (
    <Shell>
      <h1 className="text-2xl font-bold">Akses ditolak</h1>
      <p className="mt-2 text-sm text-white/60"><span className="font-mono text-white">{login}</span> tidak punya izin menulis ke <span className="font-mono">{REPO}</span>.</p>
      <button onClick={onOut} className="mt-6 w-full rounded-full border border-white/20 py-3 hover:bg-white/10">Keluar</button>
    </Shell>
  )
}

export default function AdminApp() {
  const [token, setTok] = useState(getToken())
  const [user, setUser] = useState(null) // { login, canPush }
  const [err, setErr] = useState('')
  const [tab, setTab] = useState('coding')

  const signOut = () => { setToken(''); setTok(''); setUser(null) }
  const signIn = (t) => { setErr(''); setToken(t); setTok(t) }

  useEffect(() => {
    if (!token) return
    let alive = true
    verify().then((u) => { if (alive) setUser(u) }).catch((e) => { if (alive) { setErr(e.message); signOut() } })
    return () => { alive = false }
  }, [token])

  if (!ghConfigured) return <Setup />
  if (!token) return <Login onToken={signIn} err={err} />
  if (!user) return <Shell><p className="text-sm text-white/50">Memeriksa akses…</p></Shell>
  if (!user.canPush) return <Denied login={user.login} onOut={signOut} />

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20">
      <header className="flex items-center justify-between py-5 border-b border-white/10">
        <div>
          <p className="font-bold">Admin</p>
          <p className="font-mono text-[11px] text-white/40">{user.login} · {REPO}</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <a href={import.meta.env.BASE_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-white/60 hover:text-white">Lihat situs <ExternalLink size={13} /></a>
          <button onClick={signOut} className="flex items-center gap-1 text-white/60 hover:text-white"><LogOut size={14} />Keluar</button>
        </div>
      </header>
      <nav className="flex gap-1.5 py-4">
        {Object.entries(COLLECTIONS).map(([k, c]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-1.5 text-sm ${tab === k ? 'bg-white text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>{c.label}</button>
        ))}
      </nav>
      <Manager key={tab} name={tab} />
    </div>
  )
}
