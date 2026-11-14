import { useEffect, useMemo, useState } from 'react'
import { Search, Star, X } from 'lucide-react'
import { listRepos, repoToProject } from './github.js'

// Modal that lists the owner's public GitHub repos; picking one opens the normal editor, pre-filled.
export default function ImportRepo({ existingLinks, onPick, onClose }) {
  const [repos, setRepos] = useState(null)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  useEffect(() => { listRepos().then(setRepos).catch((e) => setErr(e.message)) }, [])
  const shown = useMemo(() => (repos || []).filter((r) => `${r.name} ${r.description} ${r.language} ${r.topics.join(' ')}`.toLowerCase().includes(q.toLowerCase())), [repos, q])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-xl border border-white/10 bg-[#0b0d0c]">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h2 className="text-xl font-bold">Impor dari GitHub</h2>
          <button onClick={onClose} aria-label="Tutup" className="text-white/50 hover:text-white"><X size={18} /></button>
        </div>
        <div className="relative border-b border-white/10 p-3">
          <Search size={14} className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-white/40" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari repo…" className="w-full rounded-[5px] border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-sm outline-none focus:border-emerald-400/60" />
        </div>
        <div className="overflow-auto">
          {err && <p className="p-4 text-sm text-red-300">{err}</p>}
          {!repos && !err && <p className="p-6 text-center text-sm text-white/40">Memuat repo…</p>}
          {repos && shown.length === 0 && <p className="p-6 text-center text-sm text-white/40">{repos.length ? 'Tidak ada yang cocok.' : 'Belum ada repo publik.'}</p>}
          {shown.map((r) => {
            const added = existingLinks.includes(r.url)
            return (
              <button key={r.fullName} onClick={() => onPick(repoToProject(r))} className="flex w-full items-start gap-3 border-b border-white/10 p-4 text-left hover:bg-white/5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.name}{r.fork && <span className="ml-2 font-mono text-[10px] text-white/40">fork</span>}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-white/50">{r.description || 'Tanpa deskripsi'}</p>
                  <p className="mt-1.5 flex items-center gap-3 font-mono text-[10px] text-white/40">{r.language && <span>{r.language}</span>}<span className="flex items-center gap-0.5"><Star size={10} />{r.stars}</span><span>{r.year}</span></p>
                </div>
                {added && <span className="shrink-0 rounded-[5px] bg-emerald-400/20 px-2 py-1 text-[11px] text-emerald-300">sudah ada</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
